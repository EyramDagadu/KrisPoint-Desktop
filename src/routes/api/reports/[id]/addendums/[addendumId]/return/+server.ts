import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { getReportIdentifier } from '$lib/server/reports/getReportIdentifier';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = parseInt(params.id);
    const addendumId = parseInt(params.addendumId);
    
    if (isNaN(reportId) || isNaN(addendumId)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const [addendum] = await db
      .select()
      .from(schema.reportAmendments)
      .where(and(
        eq(schema.reportAmendments.id, addendumId),
        eq(schema.reportAmendments.reportId, reportId)
      ))
      .limit(1);

    if (!addendum) {
      return json({ success: false, error: 'Addendum not found' }, { status: 404 });
    }

    if (addendum.status !== 'SUBMITTED') {
      return json({ success: false, error: 'Only submitted addendums can be returned' }, { status: 400 });
    }

    if (addendum.assignedSpecialistId !== session.user.id) {
      return json({ 
        success: false, 
        error: 'Only the assigned specialist can return this addendum' 
      }, { status: 403 });
    }

    const data = await request.json();
    const { feedback } = data;

    // Get friendly report identifier (patient name + modality + body region)
    const reportIdentifier = await getReportIdentifier(reportId);

    const now = new Date();

    const [updated] = await db
      .update(schema.reportAmendments)
      .set({
        status: 'DRAFT',
        submittedAt: null,
        updatedAt: now
      })
      .where(eq(schema.reportAmendments.id, addendumId))
      .returning();

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'ADDENDUM_RETURNED',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'ADDENDUM',
      resourceId: String(addendumId),
      description: `Addendum returned for report #${reportId}`,
      metadata: { reportId, feedback }
    });

    return json({ 
      success: true, 
      addendum: updated,
      message: 'Addendum returned to creator for revision' 
    });
  } catch (error) {
    console.error('Error returning addendum:', error);
    return json({ success: false, error: 'Failed to return addendum' }, { status: 500 });
  }
};
