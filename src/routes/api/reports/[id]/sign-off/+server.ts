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

    const hasSignOwnPermission = await checkPermission(session.user.id, 'reports.sign_own');
    const hasFinalizePermission = await checkPermission(session.user.id, 'reports.finalize');
    
    if (!hasSignOwnPermission && !hasFinalizePermission) {
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

    if (report.createdBy !== session.user.id && !hasFinalizePermission) {
      return json({ success: false, error: 'You can only sign off your own reports' }, { status: 403 });
    }

    const now = new Date();
    
    // SIGNED reports are immutable - user must first "Undo Sign Off" to revert to DRAFT
    if (report.status === 'SIGNED') {
      return json({ success: false, error: 'Report is already signed. Use "Undo Sign Off" first if you need to make changes.' }, { status: 400 });
    }

    if (report.status === 'SUBMITTED') {
      return json({ success: false, error: 'Report is awaiting specialist review. Use standard sign endpoint.' }, { status: 400 });
    }

    const PG_INT_MAX = 2147483647;
    let reportingDurationMs = report.reportingDurationMs;

    // Calculate reporting duration on first sign
    if (report.openedAt) {
      const raw = now.getTime() - new Date(report.openedAt).getTime();
      reportingDurationMs = raw > PG_INT_MAX ? null : raw;
    }

    const [updatedReport] = await db
      .update(schema.reports)
      .set({
        status: 'SIGNED',
        statusBeforeSign: report.status, // Store previous status for accurate undo
        reviewedBy: null,
        signedBy: session.user.id,
        signedAt: now,
        reportingDurationMs,
        reviewDurationMs: null,
        updatedAt: now
      })
      .where(eq(schema.reports.id, id))
      .returning();

    await db.insert(schema.reportWorkflows).values({
      reportId: id,
      event: 'SIGNED_BY_CREATOR',
      userId: session.user.id,
      userRole: session.user.roleName,
      occurredAt: now
    });

    // Update worklist status to COMPLETED (all reports now have worklist items)
    const [worklistItem] = await db
      .update(schema.worklist)
      .set({ status: 'COMPLETED', updatedAt: now })
      .where(eq(schema.worklist.reportId, id))
      .returning();

    // Notify SSE clients of status change
    reportEvents.notifyReportStatusChange(id, worklistItem?.id || null, 'COMPLETED', 'SIGNED');

    // Audit log for self sign-off
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'REPORT_SELF_SIGNED',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'REPORT',
      resourceId: String(id),
      description: `Report signed off by creator`,
      metadata: { reportingDurationMs }
    });

    return json({ 
      success: true, 
      report: updatedReport,
      message: 'Report signed off successfully'
    });
  } catch (error) {
    console.error('Sign-off report error:', error);
    return json({ success: false, error: 'Failed to sign off report' }, { status: 500 });
  }
};
