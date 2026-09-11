import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, checkReportParticipation, logAudit } from '$lib/server/auth';
import { reportEvents } from '$lib/server/reportEvents';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'reports.submit');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const participation = await checkReportParticipation(session.user.id, id);
    
    if (participation.denyReason === 'Report not found') {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    
    if (!participation.canMutate) {
      await logAudit({
        userId: session.user.id,
        username: session.user.username,
        userRole: session.user.roleName,
        action: 'REPORT_SUBMIT_DENIED',
        category: 'REPORTS',
        severity: 'WARNING',
        resourceType: 'REPORT',
        resourceId: String(id),
        description: `Submit attempt denied: ${participation.denyReason}`,
        metadata: { reason: participation.denyReason }
      });
      return json({ success: false, error: participation.denyReason }, { status: 403 });
    }

    const data = await request.json();
    const { specialistId, message } = data;

    if (!specialistId) {
      return json({ success: false, error: 'Please select a specialist to submit to' }, { status: 400 });
    }

    const [report] = await db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, id))
      .limit(1);

    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    // Only DRAFT reports can be submitted for review
    // SIGNED reports must first use "Undo Sign Off" to revert to DRAFT
    if (report.status !== 'DRAFT') {
      if (report.status === 'SIGNED') {
        return json({ success: false, error: 'Report is already signed. Use "Undo Sign Off" first if you need to submit for review.' }, { status: 400 });
      }
      return json({ success: false, error: 'Report has already been submitted' }, { status: 400 });
    }

    const now = new Date();

    const PG_INT_MAX = 2147483647;
    let reportingDurationMs = null;
    if (report.openedAt) {
      const raw = now.getTime() - new Date(report.openedAt).getTime();
      reportingDurationMs = raw > PG_INT_MAX ? null : raw;
    }

    console.log(`Submitting report ${id} to specialist ${specialistId} by user ${session.user.id}`);
    
    const [updatedReport] = await db
      .update(schema.reports)
      .set({
        status: 'SUBMITTED',
        assignedSpecialistId: specialistId,
        submittedBy: session.user.id,
        submittedAt: now,
        reportingDurationMs,
        updatedAt: now
      })
      .where(eq(schema.reports.id, id))
      .returning();

    console.log(`Report ${id} updated, new status: ${updatedReport?.status}`);

    // Release any edit locks on this report when submitted
    try {
      await db.delete(schema.reportEditLocks).where(eq(schema.reportEditLocks.reportId, id));
      console.log(`Released edit lock for report ${id} after submission`);
    } catch (lockError) {
      // Log but don't fail the submission if lock release fails
      console.error('Error releasing edit lock:', lockError);
    }

    await db.insert(schema.reportWorkflows).values({
      reportId: id,
      event: 'SUBMITTED',
      userId: session.user.id,
      userRole: session.user.roleName,
      occurredAt: now,
      assignedToId: specialistId,
      metadata: message ? { message } : null
    });

    // Get worklist item for this report
    const [worklistItem] = await db
      .select()
      .from(schema.worklist)
      .where(eq(schema.worklist.reportId, id))
      .limit(1);

    // Notify SSE clients of status change
    reportEvents.notifyReportStatusChange(id, worklistItem?.id || null, 'IN_PROGRESS', 'SUBMITTED');

    // Audit log for successful submission
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'REPORT_SUBMITTED',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'REPORT',
      resourceId: String(id),
      description: `Report submitted for review to specialist ID ${specialistId}`,
      metadata: { specialistId, reportingDurationMs }
    });

    return json({ 
      success: true, 
      report: updatedReport,
      message: 'Report submitted for review'
    });
  } catch (error) {
    console.error('Submit report error:', error);
    return json({ success: false, error: 'Failed to submit report' }, { status: 500 });
  }
};
