import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { reportEvents } from '$lib/server/reportEvents';
import { eq } from 'drizzle-orm';

const UNDO_SIGN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid report ID' }, { status: 400 });
    }

    const [report] = await db
      .select({
        id: schema.reports.id,
        status: schema.reports.status,
        statusBeforeSign: schema.reports.statusBeforeSign,
        signedBy: schema.reports.signedBy,
        signedAt: schema.reports.signedAt,
        createdBy: schema.reports.createdBy,
        assignedSpecialistId: schema.reports.assignedSpecialistId
      })
      .from(schema.reports)
      .where(eq(schema.reports.id, id))
      .limit(1);

    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    if (report.status !== 'SIGNED') {
      return json({ success: false, error: 'Report is not signed' }, { status: 400 });
    }

    if (report.signedBy !== session.user.id) {
      return json({ success: false, error: 'Only the signer can undo their sign-off' }, { status: 403 });
    }

    if (!report.signedAt) {
      return json({ success: false, error: 'Report has no sign-off timestamp' }, { status: 400 });
    }

    const signedTime = new Date(report.signedAt).getTime();
    const now = Date.now();
    const elapsed = now - signedTime;

    if (elapsed >= UNDO_SIGN_WINDOW_MS) {
      const minutesAgo = Math.floor(elapsed / 60000);
      return json({ 
        success: false, 
        error: `The 15-minute undo window has expired. Report was signed ${minutesAgo} minutes ago.` 
      }, { status: 400 });
    }

    const nowDate = new Date();
    
    // Restore to the status before signing (DRAFT or SUBMITTED)
    // Fall back to DRAFT for legacy reports without statusBeforeSign
    const restoreStatus = report.statusBeforeSign || 'DRAFT';

    const [updatedReport] = await db
      .update(schema.reports)
      .set({
        status: restoreStatus,
        statusBeforeSign: null, // Clear it since we're no longer signed
        signedBy: null,
        signedAt: null,
        reviewedBy: null,
        // Only keep assignedSpecialistId if restoring to SUBMITTED
        assignedSpecialistId: restoreStatus === 'SUBMITTED' ? report.assignedSpecialistId : null,
        updatedAt: nowDate
      })
      .where(eq(schema.reports.id, id))
      .returning();

    await db.insert(schema.reportWorkflows).values({
      reportId: id,
      event: 'SIGN_UNDONE',
      userId: session.user.id,
      userRole: session.user.roleName,
      occurredAt: nowDate,
      metadata: { 
        previousSignedAt: report.signedAt,
        restoredToStatus: restoreStatus,
        undoneWithinMinutes: Math.floor(elapsed / 60000)
      }
    });

    // Update worklist status back to IN_PROGRESS
    const [worklistItem] = await db
      .update(schema.worklist)
      .set({ status: 'IN_PROGRESS', updatedAt: nowDate })
      .where(eq(schema.worklist.reportId, id))
      .returning();

    // Notify SSE clients of status change
    reportEvents.notifyReportStatusChange(id, worklistItem?.id || null, 'IN_PROGRESS', restoreStatus);

    console.log(`Report ${id} sign-off undone by user ${session.user.id} (${session.user.username})`);

    // Audit log for undo sign
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'REPORT_SIGN_UNDONE',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'REPORT',
      resourceId: String(id),
      description: `Report sign-off undone, restored to ${restoreStatus}`,
      metadata: { 
        previousSignedAt: report.signedAt,
        restoredToStatus: restoreStatus,
        undoneWithinMinutes: Math.floor(elapsed / 60000)
      }
    });

    return json({ 
      success: true, 
      report: updatedReport,
      message: 'Sign-off has been undone. You can continue editing.'
    });
  } catch (error) {
    console.error('Undo sign error:', error);
    return json({ success: false, error: 'Failed to undo sign-off' }, { status: 500 });
  }
};
