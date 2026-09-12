import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, logAudit } from '$lib/server/auth';
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

    if (addendum.status !== 'DRAFT') {
      return json({ success: false, error: 'Only draft addendums can be submitted' }, { status: 400 });
    }

    if (addendum.createdBy !== session.user.id) {
      return json({ success: false, error: 'Only the addendum creator can submit it' }, { status: 403 });
    }

    const data = await request.json();
    const { specialistId } = data;

    if (!specialistId) {
      return json({ success: false, error: 'Please select a specialist for review' }, { status: 400 });
    }

    // Look up specialist name for friendly audit log
    const [specialist] = await db
      .select({ fullName: schema.users.fullName, title: schema.users.title })
      .from(schema.users)
      .where(eq(schema.users.id, specialistId))
      .limit(1);
    const specialistName = specialist ? (specialist.title ? `${specialist.title} ${specialist.fullName}` : specialist.fullName) : `specialist #${specialistId}`;

    // Get friendly report identifier (patient name + modality + body region)
    const reportIdentifier = await getReportIdentifier(reportId);

    const now = new Date();

    const [updated] = await db
      .update(schema.reportAmendments)
      .set({
        status: 'SUBMITTED',
        assignedSpecialistId: specialistId,
        submittedAt: now,
        updatedAt: now
      })
      .where(eq(schema.reportAmendments.id, addendumId))
      .returning();

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'ADDENDUM_SUBMITTED',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'ADDENDUM',
      resourceId: String(addendumId),
      description: `Addendum submitted for report #${reportId} to ${specialistName}`,
      metadata: { reportId, specialistId }
    });

    return json({ 
      success: true, 
      addendum: updated,
      message: 'Addendum submitted for review' 
    });
  } catch (error) {
    console.error('Error submitting addendum:', error);
    return json({ success: false, error: 'Failed to submit addendum' }, { status: 500 });
  }
};
