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

    const [report] = await db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, id))
      .limit(1);

    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    const isCreator = report.createdBy === session.user.id;
    const isSigner = report.signedBy === session.user.id;
    const hasReviewPermission = await checkPermission(session.user.id, 'reports.review');
    
    if (!isCreator && !isSigner && !hasReviewPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    if (report.status !== 'SIGNED') {
      return json({ success: false, error: 'Only signed reports can be sent for specialist review' }, { status: 400 });
    }

    if (report.reviewedBy !== null) {
      return json({ success: false, error: 'This report was already reviewed by a specialist' }, { status: 400 });
    }

    const now = new Date();

    const body = await request.json().catch(() => ({}));
    const specialistId = body.specialistId;
    const message = body.message || '';
    
    const [updatedReport] = await db
      .update(schema.reports)
      .set({
        status: 'SUBMITTED',
        assignedSpecialistId: specialistId || null,
        submittedBy: session.user.id,
        submittedAt: now,
        updatedAt: now
      })
      .where(eq(schema.reports.id, id))
      .returning();

    await db.insert(schema.reportWorkflows).values({
      reportId: id,
      event: 'REVIEW_REQUESTED',
      userId: session.user.id,
      userRole: session.user.roleName,
      notes: message || 'Sent for specialist co-signature review',
      metadata: message ? { message } : null,
      occurredAt: now
    });

    // Update worklist status to IN_PROGRESS (all reports now have worklist items)
    await db
      .update(schema.worklist)
      .set({ status: 'IN_PROGRESS', updatedAt: now })
      .where(eq(schema.worklist.reportId, id));

    // Audit log for review request
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      action: 'REQUEST_REVIEW',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'report',
      resourceId: id.toString(),
      description: `Requested specialist review for report #${id}${message ? ': ' + message : ''}`
    });

    return json({ 
      success: true, 
      report: updatedReport,
      message: 'Report sent for specialist review'
    });
  } catch (error) {
    console.error('Request review error:', error);
    return json({ success: false, error: 'Failed to request review' }, { status: 500 });
  }
};
