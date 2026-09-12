import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { reportEvents } from '$lib/server/reportEvents';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'reports.finalize');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const [report] = await db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, id))
      .limit(1);

    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    const now = new Date();
    
    // SIGNED reports are immutable - user must first "Undo Sign Off" to revert to DRAFT
    if (report.status === 'SIGNED') {
      return json({ success: false, error: 'Report is already signed. Use "Undo Sign Off" first if you need to make changes.' }, { status: 400 });
    }

    const PG_INT_MAX = 2147483647;
    let reviewDurationMs = report.reviewDurationMs;
    let reportingDurationMs = report.reportingDurationMs;

    // Calculate durations based on report status
    if (report.status === 'SUBMITTED' && report.submittedAt) {
      const raw = now.getTime() - new Date(report.submittedAt).getTime();
      reviewDurationMs = raw > PG_INT_MAX ? null : raw;
    } else if (report.status === 'DRAFT' && report.openedAt) {
      const raw = now.getTime() - new Date(report.openedAt).getTime();
      reportingDurationMs = raw > PG_INT_MAX ? null : raw;
    }

    const isCoSignature = report.status === 'SUBMITTED' && report.signedBy !== null;
    
    let finalSignedBy = report.signedBy;
    let finalSignedAt = report.signedAt;
    let finalReviewedBy = report.reviewedBy;
    
    if (isCoSignature) {
      // Co-signature: keep original signer, add reviewer
      finalReviewedBy = session.user.id;
    } else if (report.status === 'SUBMITTED') {
      // Specialist signing a submitted report
      finalReviewedBy = session.user.id;
      finalSignedBy = session.user.id;
      finalSignedAt = now;
    } else {
      // Direct signing of draft
      finalSignedBy = session.user.id;
      finalSignedAt = now;
      finalReviewedBy = null;
    }
    
    const [updatedReport] = await db
      .update(schema.reports)
      .set({
        status: 'SIGNED',
        statusBeforeSign: report.status, // Store previous status for accurate undo
        reviewedBy: finalReviewedBy,
        signedBy: finalSignedBy,
        signedAt: finalSignedAt,
        reportingDurationMs,
        reviewDurationMs,
        updatedAt: now
      })
      .where(eq(schema.reports.id, id))
      .returning();

    await db.insert(schema.reportWorkflows).values({
      reportId: id,
      event: 'SIGNED',
      userId: session.user.id,
      userRole: session.user.roleName,
      occurredAt: now
    });

    // Audit log for report signing
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      action: 'SIGN_REPORT',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'report',
      resourceId: id.toString(),
      description: isCoSignature 
        ? `Co-signed report #${id}` 
        : `Signed report #${id}`
    });

    // Update worklist status to COMPLETED (all reports now have worklist items)
    const [worklistItem] = await db
      .update(schema.worklist)
      .set({ status: 'COMPLETED', updatedAt: now })
      .where(eq(schema.worklist.reportId, id))
      .returning();

    // Notify SSE clients of status change
    reportEvents.notifyReportStatusChange(id, worklistItem?.id || null, 'COMPLETED', 'SIGNED');

    return json({ 
      success: true, 
      report: updatedReport,
      message: 'Report signed successfully'
    });
  } catch (error) {
    console.error('Sign report error:', error);
    return json({ success: false, error: 'Failed to sign report' }, { status: 500 });
  }
};
