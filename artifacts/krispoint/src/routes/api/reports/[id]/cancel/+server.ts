import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const data = await request.json().catch(() => ({}));
    const { reason } = data;

    const [report] = await db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, id))
      .limit(1);

    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    // Can only cancel DRAFT reports (not SUBMITTED or SIGNED)
    if (report.status === 'SIGNED') {
      return json({ success: false, error: 'Cannot cancel a signed report' }, { status: 400 });
    }
    
    if (report.status === 'SUBMITTED') {
      return json({ success: false, error: 'Cannot cancel a report under review. Ask the specialist to return it first.' }, { status: 400 });
    }

    // User must be the one who opened/picked up the report, or a specialist who was assigned
    const isOpener = report.openedBy === session.user.id;
    const isCreator = report.createdBy === session.user.id;
    const isAssignedSpecialist = report.assignedSpecialistId === session.user.id;
    
    if (!isOpener && !isCreator && !isAssignedSpecialist) {
      return json({ success: false, error: 'You can only cancel reports you have picked up' }, { status: 403 });
    }

    const now = new Date();

    // Clear the report content and reset to initial state
    const [updatedReport] = await db
      .update(schema.reports)
      .set({
        status: 'DRAFT',
        content: null,
        findings: null,
        impressions: null,
        recommendations: null,
        technique: null,
        comparison: null,
        openedBy: null,
        openedAt: null,
        assignedSpecialistId: null,
        updatedAt: now
      })
      .where(eq(schema.reports.id, id))
      .returning();

    // Update the worklist item back to PENDING
    await db
      .update(schema.worklist)
      .set({
        status: 'PENDING',
        updatedAt: now
      })
      .where(eq(schema.worklist.reportId, id));

    // Log the workflow event
    await db.insert(schema.reportWorkflows).values({
      reportId: id,
      event: 'CANCELLED',
      userId: session.user.id,
      userRole: session.user.roleName,
      occurredAt: now,
      metadata: reason ? { reason } : null
    });
    
    // Audit log
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'REPORT_CANCELLED',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'REPORT',
      resourceId: String(id),
      description: `Report cancelled and released back to worklist`,
      metadata: { reason: reason || 'No reason provided' }
    });

    return json({ 
      success: true, 
      report: updatedReport,
      message: 'Report cancelled and released back to worklist'
    });
  } catch (error) {
    console.error('Cancel report error:', error);
    return json({ success: false, error: 'Failed to cancel report' }, { status: 500 });
  }
};
