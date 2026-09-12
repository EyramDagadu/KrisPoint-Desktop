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

    // Check permission - must have reports.review permission
    const hasPermission = await checkPermission(session.user.id, 'reports.review');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const data = await request.json();
    const { reason } = data;

    const [report] = await db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, id))
      .limit(1);

    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    if (report.status !== 'SUBMITTED') {
      return json({ success: false, error: 'Can only return reports that are submitted for review' }, { status: 400 });
    }

    // Check if user is the assigned specialist
    if (report.assignedSpecialistId !== session.user.id) {
      return json({ success: false, error: 'Only the assigned specialist can return this report' }, { status: 403 });
    }

    const now = new Date();

    // Return to DRAFT status for the original author to revise
    const [updatedReport] = await db
      .update(schema.reports)
      .set({
        status: 'DRAFT',
        assignedSpecialistId: null,
        updatedAt: now
      })
      .where(eq(schema.reports.id, id))
      .returning();

    // Log the workflow event
    await db.insert(schema.reportWorkflows).values({
      reportId: id,
      event: 'RETURNED',
      userId: session.user.id,
      userRole: session.user.roleName,
      occurredAt: now,
      metadata: reason ? { reason } : null
    });

    // Audit log for report return
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      action: 'RETURN_REPORT',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'report',
      resourceId: id.toString(),
      description: `Returned report #${id} to resident for revision${reason ? ': ' + reason : ''}`
    });

    // Get worklist item for this report
    const [worklistItem] = await db
      .select()
      .from(schema.worklist)
      .where(eq(schema.worklist.reportId, id))
      .limit(1);

    // Notify SSE clients of status change
    reportEvents.notifyReportStatusChange(id, worklistItem?.id || null, 'IN_PROGRESS', 'DRAFT');

    return json({ 
      success: true, 
      report: updatedReport,
      message: 'Report returned to resident for revision'
    });
  } catch (error) {
    console.error('Return report error:', error);
    return json({ success: false, error: 'Failed to return report' }, { status: 500 });
  }
};
