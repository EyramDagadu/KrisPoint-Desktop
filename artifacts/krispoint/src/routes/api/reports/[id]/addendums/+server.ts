import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { getReportIdentifier } from '$lib/server/reports/getReportIdentifier';
import { eq, desc } from 'drizzle-orm';

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

    const hasFullReadPermission = await checkPermission(session.user.id, 'reports.read');
    if (!hasFullReadPermission && !isReportParticipant(report, session.user.id)) {
      return json({ success: false, error: 'Permission denied - not a participant on this report' }, { status: 403 });
    }

    const addendumRows = await db
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
        signedAt: schema.reportAmendments.signedAt
      })
      .from(schema.reportAmendments)
      .where(eq(schema.reportAmendments.reportId, reportId))
      .orderBy(desc(schema.reportAmendments.createdAt));

    const addendums = await Promise.all(addendumRows.map(async (addendum) => {
      let creatorName = null;
      let creatorTitle = null;
      let signerName = null;
      let signerTitle = null;

      if (addendum.createdBy) {
        const [creator] = await db.select({
          fullName: schema.users.fullName,
          title: schema.users.title
        }).from(schema.users).where(eq(schema.users.id, addendum.createdBy)).limit(1);
        if (creator) {
          creatorName = creator.fullName;
          creatorTitle = creator.title;
        }
      }

      if (addendum.signedBy) {
        const [signer] = await db.select({
          fullName: schema.users.fullName,
          title: schema.users.title
        }).from(schema.users).where(eq(schema.users.id, addendum.signedBy)).limit(1);
        if (signer) {
          signerName = signer.fullName;
          signerTitle = signer.title;
        }
      }

      return {
        ...addendum,
        creatorName,
        creatorTitle,
        signerName,
        signerTitle
      };
    }));

    return json({ success: true, addendums });
  } catch (error) {
    console.error('Error fetching addendums:', error);
    return json({ success: false, error: 'Failed to fetch addendums' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
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

    if (report.status !== 'SIGNED') {
      return json({ success: false, error: 'Addendums can only be added to signed reports' }, { status: 400 });
    }

    if (!isReportParticipant(report, session.user.id)) {
      await logAudit({
        userId: session.user.id,
        username: session.user.username,
        userRole: session.user.roleName,
        action: 'ADDENDUM_CREATE_DENIED',
        category: 'REPORTS',
        severity: 'WARNING',
        resourceType: 'REPORT',
        resourceId: String(reportId),
        description: 'User not authorized to add addendum - not a participant on this report'
      });
      return json({ 
        success: false, 
        error: 'Only the original report creator or assigned specialist can add addendums' 
      }, { status: 403 });
    }

    const data = await request.json();
    const { reason, content, amendmentType = 'ADDENDUM' } = data;

    if (!reason?.trim()) {
      return json({ success: false, error: 'Reason is required' }, { status: 400 });
    }
    if (!content?.trim()) {
      return json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    // Get friendly report identifier (patient name + modality + body region)
    const reportIdentifier = await getReportIdentifier(reportId);

    const [addendum] = await db
      .insert(schema.reportAmendments)
      .values({
        reportId,
        amendmentType,
        reason: reason.trim(),
        content: content.trim(),
        status: 'DRAFT',
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'ADDENDUM_CREATED',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'ADDENDUM',
      resourceId: String(addendum.id),
      description: `Addendum created for report #${reportId}`,
      metadata: { reportId, amendmentType }
    });

    return json({ 
      success: true, 
      addendum,
      message: 'Addendum created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating addendum:', error);
    return json({ success: false, error: 'Failed to create addendum' }, { status: 500 });
  }
};
