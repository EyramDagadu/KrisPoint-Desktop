import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission } from '$lib/server/auth';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { PatientsRepository } from '$lib/server/PatientsRepository';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasSubmitPermission = await checkPermission(session.user.id, 'reports.submit');
    if (!hasSubmitPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    // Get returned reports
    const userReports = await db
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
        createdAt: schema.reports.createdAt,
        updatedAt: schema.reports.updatedAt,
        patientFirstName: schema.patients.firstName,
        patientLastName: schema.patients.lastName,
        patientMrn: schema.patients.mrn,
        specialistName: schema.users.fullName
      })
      .from(schema.reports)
      .leftJoin(schema.patients, eq(schema.reports.patientId, schema.patients.id))
      .leftJoin(schema.users, eq(schema.reports.assignedSpecialistId, schema.users.id))
      .where(
        and(
          eq(schema.reports.status, 'DRAFT'),
          eq(schema.reports.createdBy, session.user.id)
        )
      )
      .orderBy(desc(schema.reports.updatedAt));
    
    let filteredReports: any[] = [];
    
    if (userReports.length > 0) {
      const reportIds = userReports.map(r => r.id);
      
      const returnedWorkflows = await db
        .select({
          reportId: schema.reportWorkflows.reportId,
          metadata: schema.reportWorkflows.metadata,
          occurredAt: schema.reportWorkflows.occurredAt,
          performedByName: schema.users.fullName
        })
        .from(schema.reportWorkflows)
        .leftJoin(schema.users, eq(schema.reportWorkflows.userId, schema.users.id))
        .where(
          and(
            eq(schema.reportWorkflows.event, 'RETURNED'),
            inArray(schema.reportWorkflows.reportId, reportIds)
          )
        )
        .orderBy(desc(schema.reportWorkflows.occurredAt));

      const latestReturnsByReportId = new Map();
      for (const wf of returnedWorkflows) {
        if (!latestReturnsByReportId.has(wf.reportId)) {
          latestReturnsByReportId.set(wf.reportId, wf);
        }
      }
      
      filteredReports = userReports
        .filter(r => latestReturnsByReportId.has(r.id))
        .map(r => {
          const returnInfo = latestReturnsByReportId.get(r.id);
          // Decrypt patient PHI fields
          const decrypted = PatientsRepository.decryptPatientFields(r);
          return {
            ...decrypted,
            itemType: 'report',
            returnedAt: returnInfo.occurredAt,
            returnedBy: returnInfo.performedByName,
            returnReason: (returnInfo.metadata as any)?.reason || null
          };
        });
    }

    // Get returned addendums via audit logs
    const returnedAddendumLogs = await db
      .select({
        resourceId: schema.auditLogs.resourceId,
        createdAt: schema.auditLogs.createdAt,
        metadata: schema.auditLogs.metadata,
        username: schema.auditLogs.username
      })
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.action, 'ADDENDUM_RETURNED'),
          eq(schema.auditLogs.resourceType, 'ADDENDUM')
        )
      )
      .orderBy(desc(schema.auditLogs.createdAt));

    let returnedAddendums: any[] = [];
    
    if (returnedAddendumLogs.length > 0) {
      // Get unique addendum IDs from audit logs
      const addendumReturnInfo = new Map();
      for (const log of returnedAddendumLogs) {
        const addendumId = parseInt(log.resourceId || '0');
        if (addendumId > 0 && !addendumReturnInfo.has(addendumId)) {
          addendumReturnInfo.set(addendumId, {
            returnedAt: log.createdAt,
            returnedBy: log.username,
            returnReason: (log.metadata as any)?.feedback || null
          });
        }
      }
      
      const addendumIds = Array.from(addendumReturnInfo.keys());
      
      // Get draft addendums created by user that are in the returned set
      const userAddendums = await db
        .select({
          id: schema.reportAmendments.id,
          reportId: schema.reportAmendments.reportId,
          content: schema.reportAmendments.content,
          reason: schema.reportAmendments.reason,
          status: schema.reportAmendments.status,
          createdAt: schema.reportAmendments.createdAt,
          updatedAt: schema.reportAmendments.updatedAt,
          patientFirstName: schema.patients.firstName,
          patientLastName: schema.patients.lastName,
          patientMrn: schema.patients.mrn,
          modality: schema.reports.modality,
          bodyRegion: schema.reports.bodyRegion,
          priority: schema.reports.priority,
          specialistName: schema.users.fullName
        })
        .from(schema.reportAmendments)
        .innerJoin(schema.reports, eq(schema.reportAmendments.reportId, schema.reports.id))
        .leftJoin(schema.patients, eq(schema.reports.patientId, schema.patients.id))
        .leftJoin(schema.users, eq(schema.reportAmendments.assignedSpecialistId, schema.users.id))
        .where(
          and(
            eq(schema.reportAmendments.status, 'DRAFT'),
            eq(schema.reportAmendments.createdBy, session.user.id),
            inArray(schema.reportAmendments.id, addendumIds)
          )
        )
        .orderBy(desc(schema.reportAmendments.updatedAt));
      
      returnedAddendums = userAddendums.map(a => {
        const returnInfo = addendumReturnInfo.get(a.id);
        // Decrypt patient PHI fields
        const decrypted = PatientsRepository.decryptPatientFields(a);
        return {
          ...decrypted,
          itemType: 'addendum',
          returnedAt: returnInfo?.returnedAt,
          returnedBy: returnInfo?.returnedBy,
          returnReason: returnInfo?.returnReason
        };
      });
    }

    return json({ 
      success: true, 
      reports: filteredReports,
      addendums: returnedAddendums
    });
  } catch (error) {
    console.error('Get returned reports error:', error);
    return json({ success: false, error: 'Failed to get returned reports' }, { status: 500 });
  }
};
