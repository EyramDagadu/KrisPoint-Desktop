import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest } from '$lib/server/auth';
import { eq, and, gte, lte, sql, count, avg, min, max, sum } from 'drizzle-orm';

// Normalize modality to canonical form for consistent grouping
function normalizeModality(modality: string | null): string {
  if (!modality) return 'Unknown';
  const lower = modality.toLowerCase().trim();
  const modalityMap: Record<string, string> = {
    'ct': 'CT',
    'mri': 'MRI',
    'xray': 'X-Ray',
    'x-ray': 'X-Ray',
    'us': 'Ultrasound',
    'ultrasound': 'Ultrasound',
    'mg': 'Mammography',
    'mammography': 'Mammography',
    'fl': 'Fluoroscopy',
    'fluoroscopy': 'Fluoroscopy',
    'nm': 'Nuclear Medicine',
    'nuclear medicine': 'Nuclear Medicine'
  };
  return modalityMap[lower] || modality;
}

// Aggregate modality counts after normalization
function aggregateModalityCounts(data: { modality: string | null; count: number }[]): { modality: string; count: number }[] {
  const aggregated: Record<string, number> = {};
  for (const item of data) {
    const normalized = normalizeModality(item.modality);
    aggregated[normalized] = (aggregated[normalized] || 0) + Number(item.count);
  }
  return Object.entries(aggregated)
    .map(([modality, count]) => ({ modality, count }))
    .sort((a, b) => b.count - a.count);
}

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const period = url.searchParams.get('period') || 'month';
    const customStart = url.searchParams.get('startDate');
    const customEnd = url.searchParams.get('endDate');
    
    let startDate: Date;
    let endDate: Date;
    
    if (period === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
      
      switch (period) {
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date('2000-01-01');
          break;
        default:
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
      }
    }

    const [
      totalReports,
      reportsByStatus,
      reportsByModality,
      timingMetrics,
      recentActivity,
      // Review analytics - reports reviewed by this user (as specialist)
      totalReviews,
      reviewsByModality,
      reviewTimingMetrics,
      recentReviewActivity
    ] = await Promise.all([
      db.select({ count: count() })
        .from(schema.reports)
        .where(and(
          eq(schema.reports.createdBy, userId),
          gte(schema.reports.createdAt, startDate),
          lte(schema.reports.createdAt, endDate)
        )),
      
      db.select({
        status: schema.reports.status,
        count: count()
      })
        .from(schema.reports)
        .where(and(
          eq(schema.reports.createdBy, userId),
          gte(schema.reports.createdAt, startDate),
          lte(schema.reports.createdAt, endDate)
        ))
        .groupBy(schema.reports.status),
      
      db.select({
        modality: schema.reports.modality,
        count: count()
      })
        .from(schema.reports)
        .where(and(
          eq(schema.reports.createdBy, userId),
          gte(schema.reports.createdAt, startDate),
          lte(schema.reports.createdAt, endDate)
        ))
        .groupBy(schema.reports.modality)
        .orderBy(sql`count(*) DESC`),
      
      db.select({
        avgReportingTime: avg(schema.reports.reportingDurationMs),
        minReportingTime: min(schema.reports.reportingDurationMs),
        maxReportingTime: max(schema.reports.reportingDurationMs),
        avgReviewTime: avg(schema.reports.reviewDurationMs),
        totalReportingTime: sum(schema.reports.reportingDurationMs)
      })
        .from(schema.reports)
        .where(and(
          eq(schema.reports.createdBy, userId),
          gte(schema.reports.createdAt, startDate),
          lte(schema.reports.createdAt, endDate)
        )),
      
      db.select({
        id: schema.reports.id,
        modality: schema.reports.modality,
        status: schema.reports.status,
        createdAt: schema.reports.createdAt,
        reportingDurationMs: schema.reports.reportingDurationMs
      })
        .from(schema.reports)
        .where(and(
          eq(schema.reports.createdBy, userId),
          gte(schema.reports.createdAt, startDate),
          lte(schema.reports.createdAt, endDate)
        ))
        .orderBy(sql`${schema.reports.createdAt} DESC`)
        .limit(10),
      
      // Total reviews by this user as specialist
      db.select({ count: count() })
        .from(schema.reports)
        .where(and(
          eq(schema.reports.reviewedBy, userId),
          gte(schema.reports.createdAt, startDate),
          lte(schema.reports.createdAt, endDate)
        )),
      
      // Reviews by modality
      db.select({
        modality: schema.reports.modality,
        count: count()
      })
        .from(schema.reports)
        .where(and(
          eq(schema.reports.reviewedBy, userId),
          gte(schema.reports.createdAt, startDate),
          lte(schema.reports.createdAt, endDate)
        ))
        .groupBy(schema.reports.modality)
        .orderBy(sql`count(*) DESC`),
      
      // Review timing metrics
      db.select({
        avgReviewTime: avg(schema.reports.reviewDurationMs),
        minReviewTime: min(schema.reports.reviewDurationMs),
        maxReviewTime: max(schema.reports.reviewDurationMs),
        totalReviewTime: sum(schema.reports.reviewDurationMs)
      })
        .from(schema.reports)
        .where(and(
          eq(schema.reports.reviewedBy, userId),
          gte(schema.reports.createdAt, startDate),
          lte(schema.reports.createdAt, endDate)
        )),
      
      // Recent review activity
      db.select({
        id: schema.reports.id,
        modality: schema.reports.modality,
        status: schema.reports.status,
        createdAt: schema.reports.createdAt,
        reviewDurationMs: schema.reports.reviewDurationMs
      })
        .from(schema.reports)
        .where(and(
          eq(schema.reports.reviewedBy, userId),
          gte(schema.reports.createdAt, startDate),
          lte(schema.reports.createdAt, endDate)
        ))
        .orderBy(sql`${schema.reports.createdAt} DESC`)
        .limit(10)
    ]);

    const dailyTrend = await db.select({
      date: sql<string>`DATE(${schema.reports.createdAt})`.as('date'),
      count: count()
    })
      .from(schema.reports)
      .where(and(
        eq(schema.reports.createdBy, userId),
        gte(schema.reports.createdAt, startDate),
        lte(schema.reports.createdAt, endDate)
      ))
      .groupBy(sql`DATE(${schema.reports.createdAt})`)
      .orderBy(sql`DATE(${schema.reports.createdAt})`);

    const signedCount = reportsByStatus.find(r => r.status === 'SIGNED')?.count || 0;
    const submittedCount = reportsByStatus.find(r => r.status === 'SUBMITTED')?.count || 0;
    const draftCount = reportsByStatus.find(r => r.status === 'DRAFT')?.count || 0;

    return json({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        summary: {
          totalReports: totalReports[0]?.count || 0,
          signedReports: signedCount,
          submittedReports: submittedCount,
          draftReports: draftCount,
          completionRate: totalReports[0]?.count > 0 
            ? Math.round((Number(signedCount) / Number(totalReports[0].count)) * 100) 
            : 0
        },
        timing: {
          avgReportingTimeMs: Number(timingMetrics[0]?.avgReportingTime) || 0,
          minReportingTimeMs: Number(timingMetrics[0]?.minReportingTime) || 0,
          maxReportingTimeMs: Number(timingMetrics[0]?.maxReportingTime) || 0,
          avgReviewTimeMs: Number(timingMetrics[0]?.avgReviewTime) || 0,
          totalReportingTimeMs: Number(timingMetrics[0]?.totalReportingTime) || 0
        },
        byModality: aggregateModalityCounts(reportsByModality),
        byStatus: reportsByStatus.map(r => ({
          status: r.status,
          count: Number(r.count)
        })),
        dailyTrend: dailyTrend.map(d => ({
          date: d.date,
          count: Number(d.count)
        })),
        recentActivity: recentActivity.map(r => ({
          id: r.id,
          modality: r.modality,
          status: r.status,
          createdAt: r.createdAt,
          reportingDurationMs: r.reportingDurationMs
        })),
        // Review analytics - reports this user reviewed as a specialist
        reviews: {
          totalReviews: totalReviews[0]?.count || 0,
          byModality: aggregateModalityCounts(reviewsByModality),
          timing: {
            avgReviewTimeMs: Number(reviewTimingMetrics[0]?.avgReviewTime) || 0,
            minReviewTimeMs: Number(reviewTimingMetrics[0]?.minReviewTime) || 0,
            maxReviewTimeMs: Number(reviewTimingMetrics[0]?.maxReviewTime) || 0,
            totalReviewTimeMs: Number(reviewTimingMetrics[0]?.totalReviewTime) || 0
          },
          recentActivity: recentReviewActivity.map(r => ({
            id: r.id,
            modality: r.modality,
            status: r.status,
            createdAt: r.createdAt,
            reviewDurationMs: r.reviewDurationMs
          }))
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
  }
};
