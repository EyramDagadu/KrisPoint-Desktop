import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest } from '$lib/server/auth';
import { eq, and, gte, lte, desc, asc, inArray } from 'drizzle-orm';
import { decrypt } from '$lib/server/encryption';

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

    const userId = session.user.id;
    const period = url.searchParams.get('period') || 'month';
    const customStart = url.searchParams.get('startDate');
    const customEnd = url.searchParams.get('endDate');
    const filterModality = url.searchParams.get('modality');
    const sortBy = url.searchParams.get('sortBy') || 'date';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const filterType = url.searchParams.get('filterType') || 'created'; // 'created' or 'reviewed'
    
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

    // Filter by createdBy or reviewedBy depending on filterType
    const userCondition = filterType === 'reviewed'
      ? eq(schema.reports.reviewedBy, userId)
      : eq(schema.reports.createdBy, userId);
    
    const conditions: any[] = [
      userCondition,
      gte(schema.reports.createdAt, startDate),
      lte(schema.reports.createdAt, endDate)
    ];

    if (filterModality && filterModality !== 'all') {
      const variations = getModalityVariations(filterModality);
      conditions.push(inArray(schema.reports.modality, variations));
    }

    // Use reviewDurationMs for reviews, reportingDurationMs for created reports
    const durationColumn = filterType === 'reviewed'
      ? schema.reports.reviewDurationMs
      : schema.reports.reportingDurationMs;
    
    const orderColumn = sortBy === 'duration' 
      ? durationColumn
      : schema.reports.createdAt;
    
    const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const reports = await db.select({
      id: schema.reports.id,
      modality: schema.reports.modality,
      status: schema.reports.status,
      createdAt: schema.reports.createdAt,
      signedAt: schema.reports.signedAt,
      reportingDurationMs: schema.reports.reportingDurationMs,
      reviewDurationMs: schema.reports.reviewDurationMs,
      patientId: schema.reports.patientId
    })
      .from(schema.reports)
      .where(and(...conditions))
      .orderBy(orderDirection)
      .limit(100);

    const patientIds = reports.map(r => r.patientId).filter((id): id is number => id !== null && id !== undefined);
    
    let patientMap: Record<number, { name: string; mrn: string }> = {};
    if (patientIds.length > 0) {
      const patients = await db.select({
        id: schema.patients.id,
        firstName: schema.patients.firstName,
        lastName: schema.patients.lastName,
        mrn: schema.patients.mrn
      })
        .from(schema.patients)
        .where(inArray(schema.patients.id, patientIds));
      
      patientMap = patients.reduce((acc, p) => {
        // Decrypt patient PHI fields
        const decryptedFirstName = decrypt(p.firstName) || p.firstName;
        const decryptedLastName = decrypt(p.lastName) || p.lastName;
        const decryptedMrn = decrypt(p.mrn) || p.mrn;
        acc[p.id] = { name: `${decryptedFirstName} ${decryptedLastName}`, mrn: decryptedMrn };
        return acc;
      }, {} as Record<number, { name: string; mrn: string }>);
    }

    return json({
      success: true,
      data: {
        filterModality,
        sortBy,
        sortOrder,
        totalCount: reports.length,
        reports: reports.map(r => ({
          id: r.id,
          modality: r.modality,
          status: r.status,
          createdAt: r.createdAt,
          signedAt: r.signedAt,
          reportingDurationMs: r.reportingDurationMs,
          reviewDurationMs: r.reviewDurationMs,
          patientName: r.patientId ? patientMap[r.patientId]?.name : null,
          patientMrn: r.patientId ? patientMap[r.patientId]?.mrn : null
        }))
      }
    });
  } catch (error) {
    console.error('Analytics details error:', error);
    return json({ success: false, error: 'Failed to fetch analytics details' }, { status: 500 });
  }
};
