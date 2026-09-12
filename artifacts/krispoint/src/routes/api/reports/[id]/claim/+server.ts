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

    const hasPermission = await checkPermission(session.user.id, 'reports.review');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return json({ success: false, error: 'Invalid report ID' }, { status: 400 });
    }

    const [report] = await db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, reportId))
      .limit(1);

    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    if (report.status !== 'SUBMITTED') {
      return json({ success: false, error: 'Only submitted reports can be claimed' }, { status: 400 });
    }

    if (report.assignedSpecialistId === session.user.id) {
      return json({ success: false, error: 'This report is already assigned to you' }, { status: 400 });
    }

    await db
      .update(schema.reports)
      .set({
        assignedSpecialistId: session.user.id,
        updatedAt: new Date()
      })
      .where(eq(schema.reports.id, reportId));

    await db.insert(schema.reportWorkflows).values({
      reportId,
      event: 'CLAIMED',
      userId: session.user.id,
      userRole: session.user.roleName,
      occurredAt: new Date(),
      metadata: {
        previousSpecialistId: report.assignedSpecialistId,
        claimedBy: session.user.id
      }
    });

    // Notify SSE clients of the claim (report assignment changed)
    reportEvents.notifyReportClaimed(reportId, session.user.id, report.assignedSpecialistId);

    // Audit log for report claim
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'REPORT_CLAIMED',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'REPORT',
      resourceId: String(reportId),
      description: `Report claimed for review`,
      metadata: { previousSpecialistId: report.assignedSpecialistId }
    });

    return json({ success: true });
  } catch (error) {
    console.error('Claim report error:', error);
    return json({ success: false, error: 'Failed to claim report' }, { status: 500 });
  }
};
