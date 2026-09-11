import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission } from '$lib/server/auth';
import { eq, and, gte, lte, sql, desc, count, avg, inArray } from 'drizzle-orm';

// Get all raw modality values that map to a normalized modality name
function getModalityVariations(normalizedModality: string): string[] {
  const variationMap: Record<string, string[]> = {
    'CT': ['ct', 'CT'], 'MRI': ['mri', 'MRI'],
    'X-Ray': ['xray', 'x-ray', 'X-Ray', 'Xray', 'XRay'],
    'Ultrasound': ['us', 'US', 'ultrasound', 'Ultrasound'],
    'Mammography': ['mg', 'MG', 'mammography', 'Mammography'],
    'Fluoroscopy': ['fl', 'FL', 'fluoroscopy', 'Fluoroscopy'],
    'Nuclear Medicine': ['nm', 'NM', 'nuclear medicine', 'Nuclear Medicine']
  };
  return variationMap[normalizedModality] || [normalizedModality];
}

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasViewPermission = await checkPermission(session.user.id, 'analytics.view');
    const hasReadPermission = await checkPermission(session.user.id, 'analytics.read');
    if (!hasViewPermission && !hasReadPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const modality = url.searchParams.get('modality');
    const userId = url.searchParams.get('userId');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const conditions = [
      gte(schema.reports.createdAt, startDate),
      lte(schema.reports.createdAt, endDate)
    ];

    if (modality) {
      const variations = getModalityVariations(modality);
      conditions.push(inArray(schema.reports.modality, variations));
    }
    if (userId) {
      conditions.push(eq(schema.reports.createdBy, parseInt(userId)));
    }

    const [summary] = await db
      .select({
        totalReports: count(),
        avgReportingTimeMs: avg(schema.reports.reportingDurationMs),
        avgReviewTimeMs: avg(schema.reports.reviewDurationMs)
      })
      .from(schema.reports)
      .where(and(...conditions));

    const reportsByStatus = await db
      .select({
        status: schema.reports.status,
        count: count()
      })
      .from(schema.reports)
      .where(and(...conditions))
      .groupBy(schema.reports.status);

    const reportsByModality = await db
      .select({
        modality: schema.reports.modality,
        count: count(),
        avgReportingTimeMs: avg(schema.reports.reportingDurationMs)
      })
      .from(schema.reports)
      .where(and(...conditions))
      .groupBy(schema.reports.modality);

    const reportsByUser = await db
      .select({
        userId: schema.reports.createdBy,
        userName: schema.users.fullName,
        userRole: schema.roles.displayName,
        count: count(),
        avgReportingTimeMs: avg(schema.reports.reportingDurationMs)
      })
      .from(schema.reports)
      .innerJoin(schema.users, eq(schema.reports.createdBy, schema.users.id))
      .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(and(...conditions))
      .groupBy(schema.reports.createdBy, schema.users.fullName, schema.roles.displayName)
      .orderBy(desc(count()));

    const dailyTrend = await db
      .select({
        date: sql<string>`DATE(${schema.reports.createdAt})`.as('date'),
        count: count(),
        avgReportingTimeMs: avg(schema.reports.reportingDurationMs)
      })
      .from(schema.reports)
      .where(and(...conditions))
      .groupBy(sql`DATE(${schema.reports.createdAt})`)
      .orderBy(sql`DATE(${schema.reports.createdAt})`);

    const reviewMetrics = await db
      .select({
        reviewerId: schema.reports.reviewedBy,
        reviewerName: schema.users.fullName,
        count: count(),
        avgReviewTimeMs: avg(schema.reports.reviewDurationMs)
      })
      .from(schema.reports)
      .innerJoin(schema.users, eq(schema.reports.reviewedBy, schema.users.id))
      .where(
        and(
          ...conditions,
          sql`${schema.reports.reviewedBy} IS NOT NULL`
        )
      )
      .groupBy(schema.reports.reviewedBy, schema.users.fullName);

    return json({
      success: true,
      analytics: {
        dateRange: { startDate, endDate },
        summary: {
          totalReports: Number(summary.totalReports) || 0,
          avgReportingTimeMs: Math.round(Number(summary.avgReportingTimeMs) || 0),
          avgReviewTimeMs: Math.round(Number(summary.avgReviewTimeMs) || 0)
        },
        reportsByStatus,
        reportsByModality: reportsByModality.map(r => ({
          ...r,
          avgReportingTimeMs: Math.round(Number(r.avgReportingTimeMs) || 0)
        })),
        reportsByUser: reportsByUser.map(r => ({
          ...r,
          avgReportingTimeMs: Math.round(Number(r.avgReportingTimeMs) || 0)
        })),
        dailyTrend: dailyTrend.map(d => ({
          ...d,
          avgReportingTimeMs: Math.round(Number(d.avgReportingTimeMs) || 0)
        })),
        reviewMetrics: reviewMetrics.map(r => ({
          ...r,
          avgReviewTimeMs: Math.round(Number(r.avgReviewTimeMs) || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return json({ success: false, error: 'Failed to get analytics' }, { status: 500 });
  }
};
