import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { eq, and } from 'drizzle-orm';

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
    const addendumId = parseInt(params.addendumId);
    if (isNaN(reportId) || isNaN(addendumId)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const [addendum] = await db
      .select()
      .from(schema.reportAmendments)
      .where(
        and(
          eq(schema.reportAmendments.id, addendumId),
          eq(schema.reportAmendments.reportId, reportId)
        )
      )
      .limit(1);

    if (!addendum) {
      return json({ success: false, error: 'Addendum not found' }, { status: 404 });
    }

    if (addendum.status !== 'SUBMITTED') {
      return json({ success: false, error: 'Only submitted addendums can be claimed' }, { status: 400 });
    }

    if (addendum.assignedSpecialistId === session.user.id) {
      return json({ success: false, error: 'This addendum is already assigned to you' }, { status: 400 });
    }

    await db
      .update(schema.reportAmendments)
      .set({
        assignedSpecialistId: session.user.id,
        updatedAt: new Date()
      })
      .where(eq(schema.reportAmendments.id, addendumId));

    // Audit log for addendum claim
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'ADDENDUM_CLAIMED',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'ADDENDUM',
      resourceId: String(addendumId),
      description: `Addendum claimed for review on report ${reportId}`,
      metadata: { reportId, previousSpecialistId: addendum.assignedSpecialistId }
    });

    return json({ success: true });
  } catch (error) {
    console.error('Claim addendum error:', error);
    return json({ success: false, error: 'Failed to claim addendum' }, { status: 500 });
  }
};
