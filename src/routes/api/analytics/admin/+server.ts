import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema, isSqlite } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission } from '$lib/server/auth';
import { eq, and, gte, lte, sql, count, avg, sum, min, max, inArray } from 'drizzle-orm';

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

// Get all raw modality values that map to a normalized modality name
function getModalityVariations(normalizedModality: string): string[] {
  const variationMap: Record<string, string[]> = {
    'CT': ['ct', 'CT'],
    'MRI': ['mri', 'MRI'],
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

    const period = url.searchParams.get('period') || 'month';
    const customStart = url.searchParams.get('startDate');
    const customEnd = url.searchParams.get('endDate');
    const filterUserId = url.searchParams.get('userId');
    const filterModality = url.searchParams.get('modality');
    const filterStatus = url.searchParams.get('status');
    
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

    const dateConditions = and(
      gte(schema.reports.createdAt, startDate),
      lte(schema.reports.createdAt, endDate)
    );

    const buildFilteredConditions = () => {
      const conditions: any[] = [
        gte(schema.reports.createdAt, startDate),
        lte(schema.reports.createdAt, endDate)
      ];
      
      if (filterUserId && filterUserId !== 'all') {
        conditions.push(eq(schema.reports.createdBy, filterUserId));
      }
      if (filterModality && filterModality !== 'all') {
        const variations = getModalityVariations(filterModality);
        conditions.push(inArray(schema.reports.modality, variations));
      }
      if (filterStatus && filterStatus !== 'all') {
        conditions.push(eq(schema.reports.status, filterStatus));
      }
      
      return and(...conditions);
    };

    const filteredConditions = buildFilteredConditions();
    const hasFilters = (filterUserId && filterUserId !== 'all') || 
                       (filterModality && filterModality !== 'all') || 
                       (filterStatus && filterStatus !== 'all');

    const weekExpression = isSqlite
      ? sql<string>`strftime('%Y-%W', ${schema.reports.createdAt})`
      : sql<string>`TO_CHAR(${schema.reports.createdAt}, 'IYYY-IW')`;

    const [
      allUsers,
      allModalities,
      unfilteredTotalReports,
      unfilteredTimingStats,
      unfilteredDailyTrend,
      totalReports,
      reportsByStatus,
      reportsByModality,
      reportsByUser,
      avgTimingByUser,
      dailyTrend,
      timingStats,
      weeklyProductivity
    ] = await Promise.all([
      db.select({
        id: schema.users.id,
        fullName: schema.users.fullName
      }).from(schema.users).orderBy(schema.users.fullName),
      
      db.selectDistinct({ modality: schema.reports.modality })
        .from(schema.reports)
        .where(and(dateConditions, sql`${schema.reports.modality} IS NOT NULL`)),
      
      db.select({ count: count() })
        .from(schema.reports)
        .where(dateConditions),
      
      db.select({
        avgTime: avg(schema.reports.reportingDurationMs),
        totalTime: sum(schema.reports.reportingDurationMs)
      })
        .from(schema.reports)
        .where(dateConditions),
      
      db.select({
        date: sql<string>`DATE(${schema.reports.createdAt})`.as('date'),
        count: count()
      })
        .from(schema.reports)
        .where(dateConditions)
        .groupBy(sql`DATE(${schema.reports.createdAt})`),
      
      db.select({ count: count() })
        .from(schema.reports)
        .where(filteredConditions),
      
      db.select({
        status: schema.reports.status,
        count: count()
      })
        .from(schema.reports)
        .where(filteredConditions)
        .groupBy(schema.reports.status),
      
      db.select({
        modality: schema.reports.modality,
        count: count()
      })
        .from(schema.reports)
        .where(filteredConditions)
        .groupBy(schema.reports.modality)
        .orderBy(sql`count(*) DESC`),
      
      db.select({
        userId: schema.reports.createdBy,
        userName: schema.users.fullName,
        count: count()
      })
        .from(schema.reports)
        .innerJoin(schema.users, eq(schema.reports.createdBy, schema.users.id))
        .where(filteredConditions)
        .groupBy(schema.reports.createdBy, schema.users.fullName)
        .orderBy(sql`count(*) DESC`)
        .limit(10),
      
      db.select({
        userId: schema.reports.createdBy,
        userName: schema.users.fullName,
        avgTime: avg(schema.reports.reportingDurationMs),
        minTime: min(schema.reports.reportingDurationMs),
        maxTime: max(schema.reports.reportingDurationMs),
        totalTime: sum(schema.reports.reportingDurationMs),
        reportCount: count()
      })
        .from(schema.reports)
        .innerJoin(schema.users, eq(schema.reports.createdBy, schema.users.id))
        .where(filteredConditions)
        .groupBy(schema.reports.createdBy, schema.users.fullName)
        .orderBy(sql`count(*) DESC`),
      
      db.select({
        date: sql<string>`DATE(${schema.reports.createdAt})`.as('date'),
        count: count()
      })
        .from(schema.reports)
        .where(filteredConditions)
        .groupBy(sql`DATE(${schema.reports.createdAt})`)
        .orderBy(sql`DATE(${schema.reports.createdAt})`),
      
      db.select({
        avgTime: avg(schema.reports.reportingDurationMs),
        minTime: min(schema.reports.reportingDurationMs),
        maxTime: max(schema.reports.reportingDurationMs),
        totalTime: sum(schema.reports.reportingDurationMs)
      })
        .from(schema.reports)
        .where(filteredConditions),
      
      db.select({
        week: weekExpression.as('week'),
        count: count(),
        avgTime: avg(schema.reports.reportingDurationMs)
      })
        .from(schema.reports)
        .where(filteredConditions)
        .groupBy(weekExpression)
        .orderBy(weekExpression)
    ]);

    const signedCount = reportsByStatus.find(r => r.status === 'SIGNED')?.count || 0;
    const submittedCount = reportsByStatus.find(r => r.status === 'SUBMITTED')?.count || 0;
    const draftCount = reportsByStatus.find(r => r.status === 'DRAFT')?.count || 0;
    const totalCount = totalReports[0]?.count || 0;
    const orgTotalCount = unfilteredTotalReports[0]?.count || 0;

    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const reportsPerDay = totalCount > 0 ? (totalCount / daysDiff).toFixed(1) : '0';
    const reportsPerWeek = totalCount > 0 ? ((totalCount / daysDiff) * 7).toFixed(1) : '0';

    return json({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        hasFilters,
        filters: {
          users: allUsers.map(u => ({ id: u.id, name: u.fullName })),
          modalities: allModalities.map(m => m.modality).filter(Boolean),
          statuses: ['DRAFT', 'SUBMITTED', 'SIGNED']
        },
        orgSummary: {
          totalReports: orgTotalCount,
          avgReportingTimeMs: Number(unfilteredTimingStats[0]?.avgTime) || 0,
          totalTimeSpentMs: Number(unfilteredTimingStats[0]?.totalTime) || 0,
          activeDays: unfilteredDailyTrend.length
        },
        summary: {
          totalReports: totalCount,
          signedReports: Number(signedCount),
          submittedReports: Number(submittedCount),
          draftReports: Number(draftCount),
          completionRate: totalCount > 0 
            ? Math.round((Number(signedCount) / totalCount) * 100) 
            : 0
        },
        productivity: {
          reportsPerDay: parseFloat(reportsPerDay),
          reportsPerWeek: parseFloat(reportsPerWeek),
          avgReportingTimeMs: Number(timingStats[0]?.avgTime) || 0,
          minReportingTimeMs: Number(timingStats[0]?.minTime) || 0,
          maxReportingTimeMs: Number(timingStats[0]?.maxTime) || 0,
          totalTimeSpentMs: Number(timingStats[0]?.totalTime) || 0,
          activeDays: dailyTrend.length
        },
        byModality: aggregateModalityCounts(reportsByModality),
        byStatus: reportsByStatus.map(r => ({
          status: r.status,
          count: Number(r.count)
        })),
        byUser: reportsByUser.map(r => ({
          userId: r.userId,
          userName: r.userName || 'Unknown',
          count: Number(r.count)
        })),
        userPerformance: avgTimingByUser.map(r => ({
          userId: r.userId,
          userName: r.userName || 'Unknown',
          avgTimeMs: Number(r.avgTime) || 0,
          minTimeMs: Number(r.minTime) || 0,
          maxTimeMs: Number(r.maxTime) || 0,
          totalTimeMs: Number(r.totalTime) || 0,
          reportCount: Number(r.reportCount)
        })),
        dailyTrend: dailyTrend.map(d => ({
          date: d.date,
          count: Number(d.count)
        })),
        weeklyTrend: weeklyProductivity.map(w => ({
          week: w.week,
          count: Number(w.count),
          avgTimeMs: Number(w.avgTime) || 0
        }))
      }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
  }
};
