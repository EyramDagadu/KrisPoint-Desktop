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

    // Get the original report to check if it was self-signed
    const [report] = await db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, reportId))
      .limit(1);

    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
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
      return json({ success: false, error: 'Addendum is already signed' }, { status: 400 });
    }

    // Check permissions based on addendum status and original report signing pattern
    const hasSignPermission = await checkPermission(session.user.id, 'reports.sign');
    const hasSignOwnPermission = await checkPermission(session.user.id, 'reports.sign_own');
    
    // Determine if the original report was self-signed:
    // - No reviewer at all (reviewedBy is null)
    // - OR the reviewer is the same as the signer (specialist signed their own report)
    const reportWasSelfSigned = !report.reviewedBy || report.reviewedBy === report.signedBy;
    const isAddendumCreator = addendum.createdBy === session.user.id;
    const isReportSigner = report.signedBy === session.user.id;
    
    // For DRAFT addendums: allow self-sign if the user was the original signer
    if (addendum.status === 'DRAFT') {
      if (!isAddendumCreator) {
        return json({ 
          success: false, 
          error: 'Only the addendum creator can sign a draft addendum' 
        }, { status: 403 });
      }
      
      // If the original report had a DIFFERENT specialist review, require submission
      // But if the user themselves was the signer/reviewer, allow direct signing
      if (!reportWasSelfSigned && !isReportSigner) {
        return json({ 
          success: false, 
          error: 'This report was reviewed by a specialist. Please submit the addendum for specialist review.' 
        }, { status: 403 });
      }
      
      // For self-signed reports or reports signed by the current user, allow signing with permission
      if (!hasSignOwnPermission && !hasSignPermission) {
        return json({ 
          success: false, 
          error: 'Permission denied - requires sign permission' 
        }, { status: 403 });
      }
    }
    // For SUBMITTED addendums: only the assigned specialist can sign
    else if (addendum.status === 'SUBMITTED') {
      if (addendum.assignedSpecialistId !== session.user.id) {
        return json({ 
          success: false, 
          error: 'Only the assigned specialist can sign this addendum' 
        }, { status: 403 });
      }
      
      if (!hasSignPermission) {
        return json({ 
          success: false, 
          error: 'Permission denied - requires sign permission' 
        }, { status: 403 });
      }
    }

    // Get friendly report identifier (patient name + modality + body region)
    const reportIdentifier = await getReportIdentifier(reportId);

    const now = new Date();

    const [updated] = await db
      .update(schema.reportAmendments)
      .set({
        status: 'SIGNED',
        signedBy: session.user.id,
        signedAt: now,
        updatedAt: now
      })
      .where(eq(schema.reportAmendments.id, addendumId))
      .returning();

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'ADDENDUM_SIGNED',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'ADDENDUM',
      resourceId: String(addendumId),
      description: `Addendum signed for report #${reportId}`,
      metadata: { reportId }
    });

    return json({ 
      success: true, 
      addendum: updated,
      message: 'Addendum signed successfully' 
    });
  } catch (error) {
    console.error('Error signing addendum:', error);
    return json({ success: false, error: 'Failed to sign addendum' }, { status: 500 });
  }
};
