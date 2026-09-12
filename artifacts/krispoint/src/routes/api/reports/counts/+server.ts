import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission } from '$lib/server/auth';
import { eq, and, sql, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    let pendingReviewsCount = 0;
    let returnedReportsCount = 0;
    let pendingAddendumReviewsCount = 0;
    let returnedAddendumsCount = 0;

    const hasReviewPermission = await checkPermission(userId, 'reports.review');
    if (hasReviewPermission) {
      // Count pending reports
      const [reportResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.reports)
        .where(
          and(
            eq(schema.reports.status, 'SUBMITTED'),
            eq(schema.reports.assignedSpecialistId, userId)
          )
        );
      pendingReviewsCount = Number(reportResult?.count) || 0;
      
      // Count pending addendums assigned to this specialist
      const [addendumResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.reportAmendments)
        .where(
          and(
            eq(schema.reportAmendments.status, 'SUBMITTED'),
            eq(schema.reportAmendments.assignedSpecialistId, userId)
          )
        );
      pendingAddendumReviewsCount = Number(addendumResult?.count) || 0;
    }

    const hasSubmitPermission = await checkPermission(userId, 'reports.submit');
    if (hasSubmitPermission) {
      // Count returned reports
      const userDraftReports = await db
        .select({ id: schema.reports.id })
        .from(schema.reports)
        .where(
          and(
            eq(schema.reports.status, 'DRAFT'),
            eq(schema.reports.createdBy, userId)
          )
        );
      
      if (userDraftReports.length > 0) {
        const reportIds = userDraftReports.map(r => r.id);
        
        const returnedWorkflows = await db
          .select({ reportId: schema.reportWorkflows.reportId })
          .from(schema.reportWorkflows)
          .where(
            and(
              eq(schema.reportWorkflows.event, 'RETURNED'),
              inArray(schema.reportWorkflows.reportId, reportIds)
            )
          );
        
        const returnedReportIds = new Set(returnedWorkflows.map(w => w.reportId));
        returnedReportsCount = returnedReportIds.size;
      }
      
      // Count returned addendums (check audit logs for ADDENDUM_RETURNED events)
      const returnedAddendumLogs = await db
        .select({ resourceId: schema.auditLogs.resourceId })
        .from(schema.auditLogs)
        .where(
          and(
            eq(schema.auditLogs.action, 'ADDENDUM_RETURNED'),
            eq(schema.auditLogs.resourceType, 'ADDENDUM')
          )
        );
      
      if (returnedAddendumLogs.length > 0) {
        const returnedAddendumIds = returnedAddendumLogs.map(log => parseInt(log.resourceId || '0')).filter(id => id > 0);
        if (returnedAddendumIds.length > 0) {
          const [returnedAddendumResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.reportAmendments)
            .where(
              and(
                eq(schema.reportAmendments.status, 'DRAFT'),
                eq(schema.reportAmendments.createdBy, userId),
                inArray(schema.reportAmendments.id, returnedAddendumIds)
              )
            );
          returnedAddendumsCount = Number(returnedAddendumResult?.count) || 0;
        }
      }
    }

    return json({ 
      success: true, 
      counts: {
        pendingReviews: pendingReviewsCount + pendingAddendumReviewsCount,
        returnedReports: returnedReportsCount + returnedAddendumsCount,
        pendingReportReviews: pendingReviewsCount,
        pendingAddendumReviews: pendingAddendumReviewsCount,
        returnedReportCount: returnedReportsCount,
        returnedAddendumCount: returnedAddendumsCount
      }
    });
  } catch (error) {
    console.error('Get report counts error:', error);
    return json({ success: false, error: 'Failed to get report counts' }, { status: 500 });
  }
};
