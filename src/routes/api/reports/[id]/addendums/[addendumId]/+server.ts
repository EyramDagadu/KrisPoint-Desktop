import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { getReportIdentifier } from '$lib/server/reports/getReportIdentifier';
import { eq, and } from 'drizzle-orm';

function isReportParticipant(report: any, userId: number): boolean {
  return report.createdBy === userId || 
         report.openedBy === userId || 
         report.assignedSpecialistId === userId || 
         report.signedBy === userId;
}

export const GET: RequestHandler = async ({ request, params }) => {
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

    const [report] = await db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, reportId))
      .limit(1);

    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    const hasFullReadPermission = await checkPermission(session.user.id, 'reports.read');
    if (!hasFullReadPermission && !isReportParticipant(report, session.user.id)) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const [addendum] = await db
      .select({
        id: schema.reportAmendments.id,
        reportId: schema.reportAmendments.reportId,
        amendmentType: schema.reportAmendments.amendmentType,
        reason: schema.reportAmendments.reason,
        content: schema.reportAmendments.content,
        status: schema.reportAmendments.status,
        createdBy: schema.reportAmendments.createdBy,
        createdAt: schema.reportAmendments.createdAt,
        assignedSpecialistId: schema.reportAmendments.assignedSpecialistId,
        submittedAt: schema.reportAmendments.submittedAt,
        signedBy: schema.reportAmendments.signedBy,
        signedAt: schema.reportAmendments.signedAt,
        creatorName: schema.users.fullName,
        creatorTitle: schema.users.title
      })
      .from(schema.reportAmendments)
      .leftJoin(schema.users, eq(schema.reportAmendments.createdBy, schema.users.id))
      .where(and(
        eq(schema.reportAmendments.id, addendumId),
        eq(schema.reportAmendments.reportId, reportId)
      ))
      .limit(1);

    if (!addendum) {
      return json({ success: false, error: 'Addendum not found' }, { status: 404 });
    }

    return json({ success: true, addendum });
  } catch (error) {
    console.error('Error fetching addendum:', error);
    return json({ success: false, error: 'Failed to fetch addendum' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ request, params }) => {
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

    if (addendum.status === 'SIGNED') {
      return json({ success: false, error: 'Cannot edit a signed addendum' }, { status: 400 });
    }

    const isCreator = addendum.createdBy === session.user.id;
    const isAssignedSpecialist = addendum.status === 'SUBMITTED' && addendum.assignedSpecialistId === session.user.id;
    
    if (!isCreator && !isAssignedSpecialist) {
      return json({ success: false, error: 'You do not have permission to edit this addendum' }, { status: 403 });
    }

    const data = await request.json();
    const { reason, content } = data;

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (reason?.trim()) updateData.reason = reason.trim();
    if (content?.trim()) updateData.content = content.trim();

    // Get friendly report identifier (patient name + modality + body region)
    const reportIdentifier = await getReportIdentifier(reportId);

    const [updated] = await db
      .update(schema.reportAmendments)
      .set(updateData)
      .where(eq(schema.reportAmendments.id, addendumId))
      .returning();

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'ADDENDUM_UPDATED',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'ADDENDUM',
      resourceId: String(addendumId),
      description: `Addendum updated for ${reportIdentifier}`
    });

    return json({ success: true, addendum: updated });
  } catch (error) {
    console.error('Error updating addendum:', error);
    return json({ success: false, error: 'Failed to update addendum' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request, params }) => {
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
      return json({ success: false, error: 'Only draft addendums can be deleted' }, { status: 400 });
    }

    const isCreator = addendum.createdBy === session.user.id;
    if (!isCreator) {
      return json({ success: false, error: 'Only the addendum creator can delete it' }, { status: 403 });
    }

    // Get friendly report identifier (patient name + modality + body region)
    const reportIdentifier = await getReportIdentifier(reportId);

    await db
      .delete(schema.reportAmendments)
      .where(eq(schema.reportAmendments.id, addendumId));

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'ADDENDUM_DELETED',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'ADDENDUM',
      resourceId: String(addendumId),
      description: `Addendum deleted from ${reportIdentifier}`
    });

    return json({ success: true, message: 'Addendum deleted' });
  } catch (error) {
    console.error('Error deleting addendum:', error);
    return json({ success: false, error: 'Failed to delete addendum' }, { status: 500 });
  }
};
