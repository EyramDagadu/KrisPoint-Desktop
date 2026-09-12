import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission } from '$lib/server/auth';
import { eq, and, desc, sql } from 'drizzle-orm';
import { aliasedTable as alias } from 'drizzle-orm/alias';
import { PatientsRepository } from '$lib/server/PatientsRepository';

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'reports.review');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const filter = url.searchParams.get('filter') || 'mine';
    const submitterUser = alias(schema.users, 'submitterUser');
    const specialistUser = alias(schema.users, 'specialistUser');

    let reportQuery = db
      .select({
        id: schema.reports.id,
        patientId: schema.reports.patientId,
        accessionNumber: schema.reports.accessionNumber,
        modality: schema.reports.modality,
        bodyRegion: schema.reports.bodyRegion,
        studyDate: schema.reports.studyDate,
        indication: schema.reports.indication,
        findings: schema.reports.findings,
        impressions: schema.reports.impressions,
        status: schema.reports.status,
        priority: schema.reports.priority,
        submittedAt: schema.reports.submittedAt,
        submittedBy: schema.reports.submittedBy,
        assignedSpecialistId: schema.reports.assignedSpecialistId,
        createdAt: schema.reports.createdAt,
        patientFirstName: schema.patients.firstName,
        patientLastName: schema.patients.lastName,
        patientMrn: schema.patients.mrn,
        submitterName: submitterUser.fullName,
        assignedSpecialistName: specialistUser.fullName
      })
      .from(schema.reports)
      .leftJoin(schema.patients, eq(schema.reports.patientId, schema.patients.id))
      .leftJoin(submitterUser, eq(schema.reports.submittedBy, submitterUser.id))
      .leftJoin(specialistUser, eq(schema.reports.assignedSpecialistId, specialistUser.id))
      .where(
        filter === 'all' 
          ? eq(schema.reports.status, 'SUBMITTED')
          : and(
              eq(schema.reports.status, 'SUBMITTED'),
              eq(schema.reports.assignedSpecialistId, session.user.id)
            )
      )
      .orderBy(
        sql`CASE WHEN ${schema.reports.priority} = 'STAT' THEN 1 WHEN ${schema.reports.priority} = 'URGENT' THEN 2 ELSE 3 END`,
        desc(schema.reports.submittedAt)
      );

    const rawReports = await reportQuery;
    
    // Decrypt patient PHI fields
    const reports = rawReports.map(r => PatientsRepository.decryptPatientFields(r));
    
    const reportsWithMessages = await Promise.all(reports.map(async (r) => {
      // Check for SUBMITTED event first, then REVIEW_REQUESTED
      const [latestSubmission] = await db
        .select({ metadata: schema.reportWorkflows.metadata, event: schema.reportWorkflows.event })
        .from(schema.reportWorkflows)
        .where(
          and(
            eq(schema.reportWorkflows.reportId, r.id),
            sql`${schema.reportWorkflows.event} IN ('SUBMITTED', 'REVIEW_REQUESTED')`
          )
        )
        .orderBy(desc(schema.reportWorkflows.occurredAt))
        .limit(1);
      
      return {
        ...r,
        submissionMessage: (latestSubmission?.metadata as any)?.message || null
      };
    }));

    const addendumCreator = alias(schema.users, 'addendumCreator');
    const addendumSpecialist = alias(schema.users, 'addendumSpecialist');

    const pendingAddendums = await db
      .select({
        id: schema.reportAmendments.id,
        reportId: schema.reportAmendments.reportId,
        reason: schema.reportAmendments.reason,
        content: schema.reportAmendments.content,
        status: schema.reportAmendments.status,
        submittedAt: schema.reportAmendments.submittedAt,
        createdBy: schema.reportAmendments.createdBy,
        assignedSpecialistId: schema.reportAmendments.assignedSpecialistId,
        creatorName: addendumCreator.fullName,
        assignedSpecialistName: addendumSpecialist.fullName,
        patientFirstName: schema.patients.firstName,
        patientLastName: schema.patients.lastName,
        patientMrn: schema.patients.mrn,
        modality: schema.reports.modality,
        bodyRegion: schema.reports.bodyRegion
      })
      .from(schema.reportAmendments)
      .leftJoin(addendumCreator, eq(schema.reportAmendments.createdBy, addendumCreator.id))
      .leftJoin(addendumSpecialist, eq(schema.reportAmendments.assignedSpecialistId, addendumSpecialist.id))
      .leftJoin(schema.reports, eq(schema.reportAmendments.reportId, schema.reports.id))
      .leftJoin(schema.patients, eq(schema.reports.patientId, schema.patients.id))
      .where(
        filter === 'all'
          ? eq(schema.reportAmendments.status, 'SUBMITTED')
          : and(
              eq(schema.reportAmendments.status, 'SUBMITTED'),
              eq(schema.reportAmendments.assignedSpecialistId, session.user.id)
            )
      )
      .orderBy(desc(schema.reportAmendments.submittedAt));
    
    // Decrypt patient PHI fields in addendums
    const decryptedAddendums = pendingAddendums.map(a => PatientsRepository.decryptPatientFields(a));

    return json({ success: true, reports: reportsWithMessages, addendums: decryptedAddendums, currentUserId: session.user.id });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    return json({ success: false, error: 'Failed to get pending reviews' }, { status: 500 });
  }
};
