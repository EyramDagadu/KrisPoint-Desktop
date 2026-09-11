import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, checkReportParticipation, logAudit } from '$lib/server/auth';
import { reportEvents } from '$lib/server/reportEvents';
import { eq, or, desc, isNotNull, and, inArray, max, lt } from 'drizzle-orm';
import { PatientsRepository } from '$lib/server/PatientsRepository';

// Helper to get edit lock status
async function getLockStatus(reportId: number, currentUserId: number) {
  const LOCK_EXPIRY_SECONDS = 75;
  await db.delete(schema.reportEditLocks)
    .where(lt(schema.reportEditLocks.expiresAt, new Date()));
  
  const [lock] = await db
    .select({
      userId: schema.reportEditLocks.userId,
      fullName: schema.users.fullName,
      acquiredAt: schema.reportEditLocks.acquiredAt,
      expiresAt: schema.reportEditLocks.expiresAt
    })
    .from(schema.reportEditLocks)
    .innerJoin(schema.users, eq(schema.reportEditLocks.userId, schema.users.id))
    .where(eq(schema.reportEditLocks.reportId, reportId))
    .limit(1);
  
  if (!lock) {
    return { isLocked: false, lockHolder: null, isOwnLock: false };
  }
  
  return {
    isLocked: true,
    lockHolder: {
      userId: lock.userId,
      fullName: lock.fullName,
      acquiredAt: lock.acquiredAt
    },
    isOwnLock: lock.userId === currentUserId
  };
}

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    // Check for single report request via query param (Windows routing workaround)
    const reportId = url.searchParams.get('id');
    if (reportId) {
      return handleSingleReportRequest(request, parseInt(reportId));
    }
    
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasFullReadPermission = await checkPermission(session.user.id, 'reports.read');
    const hasReadOwnPermission = await checkPermission(session.user.id, 'reports.read_own');
    
    if (!hasFullReadPermission && !hasReadOwnPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    let reportsQuery;
    
    if (hasFullReadPermission) {
      reportsQuery = db
        .select({
          id: schema.reports.id,
          patientId: schema.reports.patientId,
          accessionNumber: schema.reports.accessionNumber,
          modality: schema.reports.modality,
          bodyRegion: schema.reports.bodyRegion,
          studyDate: schema.reports.studyDate,
          status: schema.reports.status,
          priority: schema.reports.priority,
          createdBy: schema.reports.createdBy,
          openedBy: schema.reports.openedBy,
          signedBy: schema.reports.signedBy,
          assignedSpecialistId: schema.reports.assignedSpecialistId,
          createdAt: schema.reports.createdAt,
          updatedAt: schema.reports.updatedAt,
          patientFirstName: schema.patients.firstName,
          patientLastName: schema.patients.lastName,
          patientHospitalNumber: schema.patients.mrn
        })
        .from(schema.reports)
        .leftJoin(schema.patients, eq(schema.reports.patientId, schema.patients.id))
        .where(isNotNull(schema.reports.openedBy))
        .orderBy(desc(schema.reports.updatedAt));
    } else {
      reportsQuery = db
        .select({
          id: schema.reports.id,
          patientId: schema.reports.patientId,
          accessionNumber: schema.reports.accessionNumber,
          modality: schema.reports.modality,
          bodyRegion: schema.reports.bodyRegion,
          studyDate: schema.reports.studyDate,
          status: schema.reports.status,
          priority: schema.reports.priority,
          createdBy: schema.reports.createdBy,
          openedBy: schema.reports.openedBy,
          signedBy: schema.reports.signedBy,
          assignedSpecialistId: schema.reports.assignedSpecialistId,
          createdAt: schema.reports.createdAt,
          updatedAt: schema.reports.updatedAt,
          patientFirstName: schema.patients.firstName,
          patientLastName: schema.patients.lastName,
          patientHospitalNumber: schema.patients.mrn
        })
        .from(schema.reports)
        .leftJoin(schema.patients, eq(schema.reports.patientId, schema.patients.id))
        .where(
          and(
            isNotNull(schema.reports.openedBy),
            or(
              eq(schema.reports.openedBy, session.user.id),
              eq(schema.reports.createdBy, session.user.id)
            )
          )
        )
        .orderBy(desc(schema.reports.updatedAt));
    }

    const rawReports = await reportsQuery;
    
    // Decrypt patient PHI fields
    const reports = rawReports.map(r => PatientsRepository.decryptPatientFields(r));
    
    // Get all unique user IDs for author lookup
    const userIds = new Set<number>();
    reports.forEach(r => {
      if (r.openedBy) userIds.add(r.openedBy);
      if (r.signedBy) userIds.add(r.signedBy);
      if (r.assignedSpecialistId) userIds.add(r.assignedSpecialistId);
    });
    
    // Fetch user names and extract surnames
    const userMap = new Map<number, string>();
    if (userIds.size > 0) {
      const users = await db
        .select({ id: schema.users.id, fullName: schema.users.fullName, deletedAt: schema.users.deletedAt })
        .from(schema.users)
        .where(inArray(schema.users.id, Array.from(userIds)));
      users.forEach(u => {
        const fullName = u.fullName || 'Unknown';
        // Extract surname (last word of full name)
        const nameParts = fullName.trim().split(' ');
        const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
        // Add * suffix for deleted users
        const deletedSuffix = u.deletedAt ? ' *' : '';
        userMap.set(u.id, `Dr ${surname}${deletedSuffix}`);
      });
    }
    
    // Get latest addendum dates for each report
    const reportIds = reports.map(r => r.id);
    const addendumDatesMap = new Map<number, Date>();
    if (reportIds.length > 0) {
      const addendumDates = await db
        .select({
          reportId: schema.reportAmendments.reportId,
          maxUpdatedAt: max(schema.reportAmendments.updatedAt)
        })
        .from(schema.reportAmendments)
        .where(inArray(schema.reportAmendments.reportId, reportIds))
        .groupBy(schema.reportAmendments.reportId);
      
      addendumDates.forEach(a => {
        if (a.maxUpdatedAt) {
          addendumDatesMap.set(a.reportId, new Date(a.maxUpdatedAt));
        }
      });
    }

    const formattedReports = reports.map(report => {
      // Build authors string: show both resident (opener) and specialist if both worked on it
      const authors: string[] = [];
      const openerName = report.openedBy ? userMap.get(report.openedBy) : null;
      const signerName = report.signedBy ? userMap.get(report.signedBy) : null;
      const specialistName = report.assignedSpecialistId ? userMap.get(report.assignedSpecialistId) : null;
      
      // Add opener/resident if they exist and are different from signer
      if (openerName && report.openedBy !== report.signedBy) {
        authors.push(openerName);
      }
      
      // Add specialist/signer
      if (signerName) {
        authors.push(signerName);
      } else if (specialistName && !authors.includes(specialistName)) {
        authors.push(specialistName);
      }
      
      // If no authors found, just show opener
      if (authors.length === 0 && openerName) {
        authors.push(openerName);
      }
      
      // Determine last modified: max of report.updatedAt and latest addendum date
      let lastModifiedDate = report.updatedAt ? new Date(report.updatedAt) : null;
      const latestAddendumDate = addendumDatesMap.get(report.id);
      if (latestAddendumDate && (!lastModifiedDate || latestAddendumDate > lastModifiedDate)) {
        lastModifiedDate = latestAddendumDate;
      }
      
      return {
        id: report.id,
        patient: `${report.patientFirstName || ''} ${report.patientLastName || ''}`.trim() || 'Unknown Patient',
        hospitalNumber: report.patientHospitalNumber || '',
        studyDate: report.studyDate ? new Date(report.studyDate).toISOString().split('T')[0] : '',
        modality: report.modality || 'Unknown',
        bodyPart: report.bodyRegion || '',
        status: report.status === 'SIGNED' ? 'Completed' : 'Draft',
        accessionNumber: report.accessionNumber || '',
        dateCreated: report.createdAt ? new Date(report.createdAt).toISOString() : '',
        lastModified: lastModifiedDate ? lastModifiedDate.toISOString() : '',
        authors: authors.length > 0 ? authors : ['Unknown']
      };
    });

    return json({ 
      success: true, 
      reports: formattedReports
    });
  } catch (error) {
    console.error('List reports error:', error);
    return json({ success: false, error: 'Failed to list reports' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, url }) => {
  try {
    // Check for action via query params (Windows routing workaround)
    const reportId = url.searchParams.get('id');
    const action = url.searchParams.get('action');
    
    if (reportId && action) {
      return handleReportAction(request, parseInt(reportId), action);
    }
    
    // Otherwise, this is a report creation request
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasCreatePermission = await checkPermission(session.user.id, 'reports.create');
    if (!hasCreatePermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const data = await request.json();
    const { 
      patientName, 
      hospitalNumber, 
      gender,
      dateOfBirth,
      age,
      ageUnit,
      modality, 
      bodyRegion, 
      studyDate,
      indication,
      content,
      technique,
      comparison,
      findings,
      impressions,
      recommendations,
      status = 'DRAFT'
    } = data;

    if (!patientName || !hospitalNumber || !modality) {
      return json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const nameParts = patientName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Use PatientsRepository for encrypted patient lookup/creation
    let patient = await PatientsRepository.findByMrn(hospitalNumber);
    let patientId: number;

    if (!patient) {
      const newPatient = await PatientsRepository.create({
        mrn: hospitalNumber,
        firstName,
        lastName,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined
      });
      patientId = newPatient.id;
    } else {
      patientId = patient.id;
    }

    const [newReport] = await db
      .insert(schema.reports)
      .values({
        patientId,
        modality: modality.toUpperCase(),
        bodyRegion: bodyRegion || null,
        studyDate: studyDate ? new Date(studyDate) : new Date(),
        patientAge: age ? parseInt(age) : null,
        patientAgeUnit: ageUnit || 'years',
        indication: indication || null,
        content: content || null,
        technique: technique || null,
        comparison: comparison || null,
        findings: findings || null,
        impressions: impressions || null,
        recommendations: recommendations || null,
        status,
        createdBy: session.user.id,
        openedBy: session.user.id,
        openedAt: new Date(),
        isFromWorklist: false
      })
      .returning();

    // Also create a corresponding worklist item so the report shows in worklist
    await db
      .insert(schema.worklist)
      .values({
        patientId,
        modality: modality.toUpperCase(),
        bodyRegion: bodyRegion || null,
        studyDate: studyDate ? new Date(studyDate) : null,
        indication: indication || null,
        priority: 'ROUTINE',
        status: 'IN_PROGRESS',
        reportId: newReport.id,
        pickedUpBy: session.user.id,
        pickedUpAt: new Date(),
        createdBy: session.user.id
      });

    // Audit log for report creation
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'REPORT_CREATED',
      category: 'REPORTS',
      severity: 'INFO',
      resourceType: 'REPORT',
      resourceId: String(newReport.id),
      description: `Created new report #${newReport.id} - ${modality} ${bodyRegion || ''}`.trim(),
      metadata: { modality, bodyRegion, patientId }
    });

    return json({ 
      success: true, 
      report: {
        id: newReport.id,
        patientId: newReport.patientId
      }
    });
  } catch (error) {
    console.error('Create report error:', error);
    return json({ success: false, error: 'Failed to create report' }, { status: 500 });
  }
};

// Windows routing workaround: Handle single report requests via query param
async function handleSingleReportRequest(request: Request, id: number): Promise<Response> {
  try {
    console.log('handleSingleReportRequest called for ID:', id);
    
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const hasFullReadPermission = await checkPermission(session.user.id, 'reports.read');
    const hasReadOwnPermission = await checkPermission(session.user.id, 'reports.read_own');
    
    if (!hasFullReadPermission && !hasReadOwnPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const [report] = await db
      .select({
        id: schema.reports.id,
        patientId: schema.reports.patientId,
        accessionNumber: schema.reports.accessionNumber,
        modality: schema.reports.modality,
        bodyRegion: schema.reports.bodyRegion,
        studyDate: schema.reports.studyDate,
        indication: schema.reports.indication,
        technique: schema.reports.technique,
        comparison: schema.reports.comparison,
        content: schema.reports.content,
        findings: schema.reports.findings,
        impressions: schema.reports.impressions,
        recommendations: schema.reports.recommendations,
        status: schema.reports.status,
        priority: schema.reports.priority,
        isFromWorklist: schema.reports.isFromWorklist,
        createdBy: schema.reports.createdBy,
        signedBy: schema.reports.signedBy,
        signedAt: schema.reports.signedAt,
        reviewedBy: schema.reports.reviewedBy,
        openedBy: schema.reports.openedBy,
        openedAt: schema.reports.openedAt,
        createdAt: schema.reports.createdAt,
        updatedAt: schema.reports.updatedAt,
        submittedAt: schema.reports.submittedAt,
        assignedSpecialistId: schema.reports.assignedSpecialistId,
        referringPhysician: schema.reports.referringPhysician,
        patientFirstName: schema.patients.firstName,
        patientLastName: schema.patients.lastName,
        patientHospitalNumber: schema.patients.mrn,
        patientGender: schema.patients.gender,
        patientDateOfBirth: schema.patients.dateOfBirth,
        patientAge: schema.reports.patientAge,
        patientAgeUnit: schema.reports.patientAgeUnit
      })
      .from(schema.reports)
      .leftJoin(schema.patients, eq(schema.reports.patientId, schema.patients.id))
      .where(eq(schema.reports.id, id))
      .limit(1);

    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    
    const decryptedReport = PatientsRepository.decryptPatientFields(report);
    const { patientFirstName, patientLastName, patientHospitalNumber, patientDateOfBirth } = decryptedReport;
    
    if (!hasFullReadPermission && hasReadOwnPermission) {
      const isOwner = report.openedBy === session.user.id || report.createdBy === session.user.id;
      const isParticipant = report.assignedSpecialistId === session.user.id || report.signedBy === session.user.id;
      const canViewSigned = report.status === 'SIGNED';
      
      if (!isOwner && !isParticipant && !canViewSigned) {
        return json({ success: false, error: 'Permission denied' }, { status: 403 });
      }
    }

    const worklistInfo = await db
      .select({
        referringPhysician: schema.worklist.referringPhysician,
        indication: schema.worklist.indication
      })
      .from(schema.worklist)
      .where(eq(schema.worklist.reportId, id))
      .limit(1);

    const referringPhysician = worklistInfo.length > 0 ? worklistInfo[0].referringPhysician : null;
    const worklistIndication = worklistInfo.length > 0 ? worklistInfo[0].indication : null;

    let creatorInfo = null;
    if (report.createdBy) {
      const [creator] = await db
        .select({
          id: schema.users.id,
          fullName: schema.users.fullName,
          title: schema.users.title,
          signatureUrl: schema.users.signatureUrl,
          deletedAt: schema.users.deletedAt,
          roleDisplayName: schema.roles.displayName
        })
        .from(schema.users)
        .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
        .where(eq(schema.users.id, report.createdBy))
        .limit(1);
      if (creator) {
        creatorInfo = {
          id: creator.id,
          fullName: creator.deletedAt ? `${creator.fullName} *` : creator.fullName,
          designation: creator.roleDisplayName || 'Doctor',
          title: creator.title,
          signatureUrl: creator.signatureUrl
        };
      }
    }

    let signerInfo = null;
    if (report.signedBy) {
      const [signer] = await db
        .select({
          id: schema.users.id,
          fullName: schema.users.fullName,
          title: schema.users.title,
          signatureUrl: schema.users.signatureUrl,
          deletedAt: schema.users.deletedAt,
          roleDisplayName: schema.roles.displayName
        })
        .from(schema.users)
        .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
        .where(eq(schema.users.id, report.signedBy))
        .limit(1);
      if (signer) {
        signerInfo = {
          id: signer.id,
          fullName: signer.deletedAt ? `${signer.fullName} *` : signer.fullName,
          designation: signer.roleDisplayName || 'Doctor',
          title: signer.title,
          signatureUrl: signer.signatureUrl
        };
      }
    }

    let reviewerInfo = null;
    if (report.reviewedBy) {
      const [reviewer] = await db
        .select({
          id: schema.users.id,
          fullName: schema.users.fullName,
          title: schema.users.title,
          signatureUrl: schema.users.signatureUrl,
          deletedAt: schema.users.deletedAt,
          roleDisplayName: schema.roles.displayName
        })
        .from(schema.users)
        .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
        .where(eq(schema.users.id, report.reviewedBy))
        .limit(1);
      if (reviewer) {
        reviewerInfo = {
          id: reviewer.id,
          fullName: reviewer.deletedAt ? `${reviewer.fullName} *` : reviewer.fullName,
          designation: reviewer.roleDisplayName || 'Doctor',
          title: reviewer.title,
          signatureUrl: reviewer.signatureUrl
        };
      }
    }

    const hasEditPermission = await checkPermission(session.user.id, 'reports.update');
    const hasEditOwnPermission = await checkPermission(session.user.id, 'reports.update_own');
    
    const isOwner = report.createdBy === session.user.id;
    const isAssignedSpecialist = report.assignedSpecialistId === session.user.id;
    const isSigner = report.signedBy === session.user.id;
    const isReviewer = report.reviewedBy === session.user.id;
    const isCompleted = report.status === 'SIGNED';
    const isSubmitted = report.status === 'SUBMITTED';
    
    const participation = await checkReportParticipation(session.user.id, id);
    
    let canUndoSign = false;
    let undoSignExpiresAt = null;
    const UNDO_SIGN_WINDOW_MS = 15 * 60 * 1000;
    
    if (report.signedAt && report.status === 'SIGNED' && isSigner) {
      const signedTime = new Date(report.signedAt).getTime();
      const now = Date.now();
      canUndoSign = (now - signedTime) < UNDO_SIGN_WINDOW_MS;
      undoSignExpiresAt = new Date(signedTime + UNDO_SIGN_WINDOW_MS).toISOString();
    }
    
    const isReportAuthor = isOwner || isSigner || isReviewer;
    
    let canEdit = false;
    
    if (isCompleted) {
      canEdit = false;
    } else if (isSubmitted) {
      canEdit = isAssignedSpecialist && (hasEditPermission || hasEditOwnPermission);
    } else {
      canEdit = isOwner && (hasEditPermission || hasEditOwnPermission);
    }

    const lockStatus = await getLockStatus(id, session.user.id);
    
    let canEditWithLock = canEdit;
    if (canEdit && lockStatus.isLocked && !lockStatus.isOwnLock) {
      canEditWithLock = false;
    }

    return json({ 
      success: true, 
      report: {
        ...report,
        canEdit: canEditWithLock,
        canEditBase: canEdit,
        isOwner,
        isAssignedSpecialist,
        isSigner,
        isReviewer,
        isReportAuthor,
        canUndoSign,
        undoSignExpiresAt,
        lock: lockStatus,
        creatorInfo,
        signerInfo,
        reviewerInfo,
        patientData: {
          name: `${patientFirstName || ''} ${patientLastName || ''}`.trim(),
          hospitalNumber: patientHospitalNumber || '',
          gender: report.patientGender || '',
          dateOfBirth: patientDateOfBirth || '',
          age: report.patientAge || null,
          ageUnit: report.patientAgeUnit || 'years',
          examType: report.modality || '',
          examSubtype: report.bodyRegion || '',
          indication: report.indication || worklistIndication || '',
          referringPhysician: report.referringPhysician || referringPhysician || '',
          studyDate: report.studyDate ? new Date(report.studyDate).toISOString().split('T')[0] : ''
        }
      }
    });
  } catch (error) {
    console.error('Get single report error:', error);
    return json({ success: false, error: 'Failed to get report' }, { status: 500 });
  }
}

// Normalize modality to canonical form
function normalizeModality(modality: string | null | undefined): string | undefined {
  if (!modality) return undefined;
  const lower = modality.toLowerCase().trim();
  const modalityMap: Record<string, string> = {
    'ct': 'CT', 'mri': 'MRI', 'xray': 'X-Ray', 'x-ray': 'X-Ray',
    'us': 'Ultrasound', 'ultrasound': 'Ultrasound',
    'mg': 'Mammography', 'mammography': 'Mammography',
    'fl': 'Fluoroscopy', 'fluoroscopy': 'Fluoroscopy',
    'nm': 'Nuclear Medicine', 'nuclear medicine': 'Nuclear Medicine'
  };
  return modalityMap[lower] || modality;
}

// Windows routing workaround: PUT handler via query param
export const PUT: RequestHandler = async ({ request, url }) => {
  try {
    const reportId = url.searchParams.get('id');
    if (!reportId) {
      return json({ success: false, error: 'Report ID required' }, { status: 400 });
    }
    
    const id = parseInt(reportId);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }
    
    console.log('PUT /api/reports?id= called for ID:', id);
    
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasFullEditPermission = await checkPermission(session.user.id, 'reports.update');
    const hasUpdateOwnPermission = await checkPermission(session.user.id, 'reports.update_own');
    
    if (!hasFullEditPermission && !hasUpdateOwnPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }
    
    const participation = await checkReportParticipation(session.user.id, id);
    
    if (participation.denyReason === 'Report not found') {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    
    if (!participation.canMutate) {
      await logAudit({
        userId: session.user.id,
        username: session.user.username,
        userRole: session.user.roleName,
        action: 'REPORT_EDIT_DENIED',
        category: 'REPORTS',
        severity: 'WARNING',
        resourceType: 'REPORT',
        resourceId: String(id),
        description: `Edit attempt denied: ${participation.denyReason}`,
        metadata: { reason: participation.denyReason }
      });
      
      return json({ success: false, error: participation.denyReason }, { status: 403 });
    }

    const data = await request.json();
    const { content, findings, impressions, recommendations, technique, comparison, indication, status, age, ageUnit, bodyRegion, modality, referringPhysician, ifMatchVersion } = data;

    // Optimistic concurrency control
    if (ifMatchVersion) {
      const [currentReport] = await db
        .select({ updatedAt: schema.reports.updatedAt })
        .from(schema.reports)
        .where(eq(schema.reports.id, id))
        .limit(1);
      
      if (currentReport) {
        const expectedVersion = new Date(ifMatchVersion).getTime();
        const actualVersion = currentReport.updatedAt ? new Date(currentReport.updatedAt).getTime() : 0;
        
        if (Math.abs(expectedVersion - actualVersion) > 1000) {
          const currentVersion = currentReport.updatedAt
            ? new Date(currentReport.updatedAt)
            : null;
          return json({ 
            success: false, 
            error: 'This report has been modified by another user. Please refresh to see the latest changes.',
            conflictType: 'VERSION_MISMATCH',
            currentVersion: currentVersion && !Number.isNaN(currentVersion.getTime())
              ? currentVersion.toISOString()
              : null
          }, { status: 409 });
        }
      }
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (content !== undefined) updateData.content = content;
    if (findings !== undefined) updateData.findings = findings;
    if (impressions !== undefined) updateData.impressions = impressions;
    if (recommendations !== undefined) updateData.recommendations = recommendations;
    if (technique !== undefined) updateData.technique = technique;
    if (comparison !== undefined) updateData.comparison = comparison;
    if (indication !== undefined) updateData.indication = indication;
    if (status !== undefined) updateData.status = status;
    if (age !== undefined) updateData.patientAge = age ? parseInt(age) : null;
    if (ageUnit !== undefined) updateData.patientAgeUnit = ageUnit;
    if (bodyRegion !== undefined) updateData.bodyRegion = bodyRegion;
    if (modality !== undefined) updateData.modality = normalizeModality(modality);
    if (referringPhysician !== undefined) updateData.referringPhysician = referringPhysician;

    const [updatedReport] = await db
      .update(schema.reports)
      .set(updateData)
      .where(eq(schema.reports.id, id))
      .returning();

    if (!updatedReport) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    return json({ success: true, report: updatedReport });
  } catch (error) {
    console.error('Update report error:', error);
    return json({ success: false, error: 'Failed to update report' }, { status: 500 });
  }
};

// Helper for routing report actions (Windows routing workaround)
async function handleReportAction(request: Request, id: number, action: string) {
  if (isNaN(id)) {
    return json({ success: false, error: 'Invalid report ID' }, { status: 400 });
  }
  
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    switch (action) {
      case 'submit':
        return handleSubmitAction(request, id, session);
      case 'sign':
        return handleSignAction(request, id, session);
      case 'sign-off':
        return handleSignOffAction(request, id, session);
      case 'return':
        return handleReturnAction(request, id, session);
      case 'undo-sign':
        return handleUndoSignAction(request, id, session);
      case 'request-review':
        return handleRequestReviewAction(request, id, session);
      // Addendum actions (Windows routing workaround)
      case 'addendum-sign':
        return handleAddendumSignAction(request, id, session);
      case 'addendum-submit':
        return handleAddendumSubmitAction(request, id, session);
      case 'addendum-return':
        return handleAddendumReturnAction(request, id, session);
      // Presence/lock actions (Windows routing workaround)
      case 'presence':
        return handlePresenceAction(request, id, session);
      default:
        return json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error(`Action ${action} error:`, error);
    return json({ success: false, error: `Failed to ${action} report` }, { status: 500 });
  }
}

// Submit report to specialist
async function handleSubmitAction(request: Request, id: number, session: any) {
  const hasPermission = await checkPermission(session.user.id, 'reports.submit');
  if (!hasPermission) {
    return json({ success: false, error: 'Permission denied' }, { status: 403 });
  }

  const participation = await checkReportParticipation(session.user.id, id);
  if (participation.denyReason === 'Report not found') {
    return json({ success: false, error: 'Report not found' }, { status: 404 });
  }
  if (!participation.canMutate) {
    return json({ success: false, error: participation.denyReason }, { status: 403 });
  }

  const data = await request.json();
  const { specialistId, message } = data;

  if (!specialistId) {
    return json({ success: false, error: 'Please select a specialist to submit to' }, { status: 400 });
  }

  const [report] = await db
    .select()
    .from(schema.reports)
    .where(eq(schema.reports.id, id))
    .limit(1);

  if (!report) {
    return json({ success: false, error: 'Report not found' }, { status: 404 });
  }

  if (report.status !== 'DRAFT') {
    if (report.status === 'SIGNED') {
      return json({ success: false, error: 'Report is already signed. Use "Undo Sign Off" first if you need to submit for review.' }, { status: 400 });
    }
    return json({ success: false, error: 'Report has already been submitted' }, { status: 400 });
  }

  const now = new Date();
  const PG_INT_MAX = 2147483647;
  let reportingDurationMs = null;
  if (report.openedAt) {
    const raw = now.getTime() - new Date(report.openedAt).getTime();
    reportingDurationMs = raw > PG_INT_MAX ? null : raw;
  }

  const [updatedReport] = await db
    .update(schema.reports)
    .set({
      status: 'SUBMITTED',
      assignedSpecialistId: specialistId,
      submittedBy: session.user.id,
      submittedAt: now,
      reportingDurationMs,
      updatedAt: now
    })
    .where(eq(schema.reports.id, id))
    .returning();

  // Release any edit locks
  await db.delete(schema.reportEditLocks).where(eq(schema.reportEditLocks.reportId, id));

  await db.insert(schema.reportWorkflows).values({
    reportId: id,
    event: 'SUBMITTED',
    userId: session.user.id,
    userRole: session.user.roleName,
    occurredAt: now,
    assignedToId: specialistId,
    metadata: message ? { message } : null
  });

  const [worklistItem] = await db
    .select()
    .from(schema.worklist)
    .where(eq(schema.worklist.reportId, id))
    .limit(1);

  reportEvents.notifyReportStatusChange(id, worklistItem?.id || null, 'IN_PROGRESS', 'SUBMITTED');

  // Audit log for successful submission
  await logAudit({
    userId: session.user.id,
    username: session.user.username,
    userRole: session.user.roleName,
    action: 'REPORT_SUBMITTED',
    category: 'REPORTS',
    severity: 'INFO',
    resourceType: 'REPORT',
    resourceId: String(id),
    description: `Report submitted for review to specialist ID ${specialistId}`,
    metadata: { specialistId, reportingDurationMs }
  });

  return json({ success: true, report: updatedReport, message: 'Report submitted for review' });
}

// Specialist signs report
async function handleSignAction(request: Request, id: number, session: any) {
  const hasPermission = await checkPermission(session.user.id, 'reports.finalize');
  if (!hasPermission) {
    return json({ success: false, error: 'Permission denied' }, { status: 403 });
  }

  const [report] = await db
    .select()
    .from(schema.reports)
    .where(eq(schema.reports.id, id))
    .limit(1);

  if (!report) {
    return json({ success: false, error: 'Report not found' }, { status: 404 });
  }

  if (report.status === 'SIGNED') {
    return json({ success: false, error: 'Report is already signed' }, { status: 400 });
  }

  const now = new Date();
  const PG_INT_MAX = 2147483647;
  let reviewDurationMs = report.reviewDurationMs;
  let reportingDurationMs = report.reportingDurationMs;

  if (report.status === 'SUBMITTED' && report.submittedAt) {
    const raw = now.getTime() - new Date(report.submittedAt).getTime();
    reviewDurationMs = raw > PG_INT_MAX ? null : raw;
  } else if (report.status === 'DRAFT' && report.openedAt) {
    const raw = now.getTime() - new Date(report.openedAt).getTime();
    reportingDurationMs = raw > PG_INT_MAX ? null : raw;
  }

  const isCoSignature = report.status === 'SUBMITTED' && report.signedBy !== null;
  
  let finalSignedBy = report.signedBy;
  let finalSignedAt = report.signedAt;
  let finalReviewedBy = report.reviewedBy;
  
  if (isCoSignature) {
    finalReviewedBy = session.user.id;
  } else if (report.status === 'SUBMITTED') {
    finalReviewedBy = session.user.id;
    finalSignedBy = session.user.id;
    finalSignedAt = now;
  } else {
    finalSignedBy = session.user.id;
    finalSignedAt = now;
    finalReviewedBy = null;
  }
  
  const [updatedReport] = await db
    .update(schema.reports)
    .set({
      status: 'SIGNED',
      statusBeforeSign: report.status,
      reviewedBy: finalReviewedBy,
      signedBy: finalSignedBy,
      signedAt: finalSignedAt,
      reportingDurationMs,
      reviewDurationMs,
      updatedAt: now
    })
    .where(eq(schema.reports.id, id))
    .returning();

  await db.delete(schema.reportEditLocks).where(eq(schema.reportEditLocks.reportId, id));

  await db.insert(schema.reportWorkflows).values({
    reportId: id,
    event: isCoSignature ? 'CO_SIGNED' : 'SIGNED',
    userId: session.user.id,
    userRole: session.user.roleName,
    occurredAt: now
  });

  const [worklistItem] = await db
    .select()
    .from(schema.worklist)
    .where(eq(schema.worklist.reportId, id))
    .limit(1);

  // Update worklist status to COMPLETED when report is signed
  if (worklistItem) {
    await db
      .update(schema.worklist)
      .set({ status: 'COMPLETED', updatedAt: now })
      .where(eq(schema.worklist.id, worklistItem.id));
  }
  
  reportEvents.notifyReportStatusChange(id, worklistItem?.id || null, 'COMPLETED', 'SIGNED');

  // Audit log for report signing
  await logAudit({
    userId: session.user.id,
    username: session.user.username,
    userRole: session.user.roleName,
    action: 'REPORT_SIGNED',
    category: 'REPORTS',
    severity: 'INFO',
    resourceType: 'REPORT',
    resourceId: String(id),
    description: isCoSignature ? `Co-signed report #${id}` : `Signed report #${id}`,
    metadata: { isCoSignature, reviewDurationMs }
  });

  return json({ success: true, report: updatedReport, message: isCoSignature ? 'Report co-signed' : 'Report signed' });
}

// Resident signs own report
async function handleSignOffAction(request: Request, id: number, session: any) {
  const hasPermission = await checkPermission(session.user.id, 'reports.sign_own');
  if (!hasPermission) {
    return json({ success: false, error: 'Permission denied' }, { status: 403 });
  }

  const [report] = await db
    .select()
    .from(schema.reports)
    .where(eq(schema.reports.id, id))
    .limit(1);

  if (!report) {
    return json({ success: false, error: 'Report not found' }, { status: 404 });
  }

  // Check if user is the report owner (creator or opener)
  const isOwner = report.createdBy === session.user.id || report.openedBy === session.user.id;
  if (!isOwner) {
    return json({ success: false, error: 'Only the report creator can sign off their own report' }, { status: 403 });
  }

  if (report.status !== 'DRAFT') {
    return json({ success: false, error: 'Only draft reports can be signed off' }, { status: 400 });
  }

  const now = new Date();
  const PG_INT_MAX = 2147483647;
  let reportingDurationMs = report.reportingDurationMs;
  if (report.openedAt) {
    const raw = now.getTime() - new Date(report.openedAt).getTime();
    reportingDurationMs = raw > PG_INT_MAX ? null : raw;
  }

  const [updatedReport] = await db
    .update(schema.reports)
    .set({
      status: 'SIGNED',
      statusBeforeSign: 'DRAFT',
      signedBy: session.user.id,
      signedAt: now,
      reportingDurationMs,
      updatedAt: now
    })
    .where(eq(schema.reports.id, id))
    .returning();

  await db.delete(schema.reportEditLocks).where(eq(schema.reportEditLocks.reportId, id));

  await db.insert(schema.reportWorkflows).values({
    reportId: id,
    event: 'SELF_SIGNED',
    userId: session.user.id,
    userRole: session.user.roleName,
    occurredAt: now
  });

  const [worklistItem] = await db
    .select()
    .from(schema.worklist)
    .where(eq(schema.worklist.reportId, id))
    .limit(1);

  // Update worklist status to COMPLETED when report is signed off
  if (worklistItem) {
    await db
      .update(schema.worklist)
      .set({ status: 'COMPLETED', updatedAt: now })
      .where(eq(schema.worklist.id, worklistItem.id));
  }

  reportEvents.notifyReportStatusChange(id, worklistItem?.id || null, 'COMPLETED', 'SIGNED');

  // Audit log for self sign-off
  await logAudit({
    userId: session.user.id,
    username: session.user.username,
    userRole: session.user.roleName,
    action: 'REPORT_SELF_SIGNED',
    category: 'REPORTS',
    severity: 'INFO',
    resourceType: 'REPORT',
    resourceId: String(id),
    description: `Self-signed report #${id}`,
    metadata: { reportingDurationMs }
  });

  return json({ success: true, report: updatedReport, message: 'Report signed off' });
}

// Specialist returns report to resident
async function handleReturnAction(request: Request, id: number, session: any) {
  const hasPermission = await checkPermission(session.user.id, 'reports.review');
  if (!hasPermission) {
    return json({ success: false, error: 'Permission denied' }, { status: 403 });
  }

  const data = await request.json();
  const { reason } = data;

  const [report] = await db
    .select()
    .from(schema.reports)
    .where(eq(schema.reports.id, id))
    .limit(1);

  if (!report) {
    return json({ success: false, error: 'Report not found' }, { status: 404 });
  }

  if (report.status !== 'SUBMITTED') {
    return json({ success: false, error: 'Can only return reports that are submitted for review' }, { status: 400 });
  }

  if (report.assignedSpecialistId !== session.user.id) {
    return json({ success: false, error: 'Only the assigned specialist can return this report' }, { status: 403 });
  }

  const now = new Date();

  const [updatedReport] = await db
    .update(schema.reports)
    .set({
      status: 'DRAFT',
      assignedSpecialistId: null,
      updatedAt: now
    })
    .where(eq(schema.reports.id, id))
    .returning();

  await db.insert(schema.reportWorkflows).values({
    reportId: id,
    event: 'RETURNED',
    userId: session.user.id,
    userRole: session.user.roleName,
    occurredAt: now,
    metadata: reason ? { reason } : null
  });

  const [worklistItem] = await db
    .select()
    .from(schema.worklist)
    .where(eq(schema.worklist.reportId, id))
    .limit(1);

  reportEvents.notifyReportStatusChange(id, worklistItem?.id || null, 'SUBMITTED', 'DRAFT');

  // Audit log for report return
  await logAudit({
    userId: session.user.id,
    username: session.user.username,
    userRole: session.user.roleName,
    action: 'REPORT_RETURNED',
    category: 'REPORTS',
    severity: 'INFO',
    resourceType: 'REPORT',
    resourceId: String(id),
    description: `Returned report #${id} to resident for revision${reason ? ': ' + reason : ''}`,
    metadata: { reason }
  });

  return json({ success: true, report: updatedReport, message: 'Report returned to resident' });
}

// Undo sign off
async function handleUndoSignAction(request: Request, id: number, session: any) {
  const [report] = await db
    .select()
    .from(schema.reports)
    .where(eq(schema.reports.id, id))
    .limit(1);

  if (!report) {
    return json({ success: false, error: 'Report not found' }, { status: 404 });
  }

  if (report.status !== 'SIGNED') {
    return json({ success: false, error: 'Only signed reports can be unsigned' }, { status: 400 });
  }

  // Check 24-hour edit window
  if (report.signedAt) {
    const signedDate = new Date(report.signedAt);
    const hoursElapsed = (Date.now() - signedDate.getTime()) / (1000 * 60 * 60);
    if (hoursElapsed > 24) {
      return json({ success: false, error: 'Reports cannot be unsigned after 24 hours' }, { status: 400 });
    }
  }

  // Must be signer or reviewer
  const isSigner = report.signedBy === session.user.id;
  const isReviewer = report.reviewedBy === session.user.id;
  if (!isSigner && !isReviewer) {
    return json({ success: false, error: 'Only the signer or reviewer can undo the signature' }, { status: 403 });
  }

  const now = new Date();
  const previousStatus = report.statusBeforeSign || 'DRAFT';

  const [updatedReport] = await db
    .update(schema.reports)
    .set({
      status: previousStatus,
      signedBy: null,
      signedAt: null,
      reviewedBy: previousStatus === 'SUBMITTED' ? null : report.reviewedBy,
      statusBeforeSign: null,
      updatedAt: now
    })
    .where(eq(schema.reports.id, id))
    .returning();

  await db.insert(schema.reportWorkflows).values({
    reportId: id,
    event: 'UNSIGNED',
    userId: session.user.id,
    userRole: session.user.roleName,
    occurredAt: now
  });

  const [worklistItem] = await db
    .select()
    .from(schema.worklist)
    .where(eq(schema.worklist.reportId, id))
    .limit(1);

  // Update worklist status back to IN_PROGRESS when signature is undone
  if (worklistItem) {
    await db
      .update(schema.worklist)
      .set({ status: 'IN_PROGRESS', updatedAt: now })
      .where(eq(schema.worklist.id, worklistItem.id));
  }

  reportEvents.notifyReportStatusChange(id, worklistItem?.id || null, 'IN_PROGRESS', previousStatus);

  // Audit log for undo sign
  await logAudit({
    userId: session.user.id,
    username: session.user.username,
    userRole: session.user.roleName,
    action: 'REPORT_SIGNATURE_UNDONE',
    category: 'REPORTS',
    severity: 'INFO',
    resourceType: 'REPORT',
    resourceId: String(id),
    description: `Undid signature on report #${id}, reverted to ${previousStatus}`,
    metadata: { previousStatus }
  });

  return json({ success: true, report: updatedReport, message: 'Signature removed' });
}

// Request specialist review after self-sign
async function handleRequestReviewAction(request: Request, id: number, session: any) {
  const data = await request.json();
  const { specialistId } = data;

  if (!specialistId) {
    return json({ success: false, error: 'Please select a specialist' }, { status: 400 });
  }

  const [report] = await db
    .select()
    .from(schema.reports)
    .where(eq(schema.reports.id, id))
    .limit(1);

  if (!report) {
    return json({ success: false, error: 'Report not found' }, { status: 404 });
  }

  if (report.status !== 'SIGNED') {
    return json({ success: false, error: 'Only signed reports can request review' }, { status: 400 });
  }

  if (report.signedBy !== session.user.id) {
    return json({ success: false, error: 'Only the original signer can request review' }, { status: 403 });
  }

  const now = new Date();

  const [updatedReport] = await db
    .update(schema.reports)
    .set({
      status: 'SUBMITTED',
      statusBeforeSign: 'SIGNED',
      assignedSpecialistId: specialistId,
      submittedAt: now,
      updatedAt: now
    })
    .where(eq(schema.reports.id, id))
    .returning();

  await db.insert(schema.reportWorkflows).values({
    reportId: id,
    event: 'REVIEW_REQUESTED',
    userId: session.user.id,
    userRole: session.user.roleName,
    occurredAt: now,
    assignedToId: specialistId
  });

  const [worklistItem] = await db
    .select()
    .from(schema.worklist)
    .where(eq(schema.worklist.reportId, id))
    .limit(1);

  reportEvents.notifyReportStatusChange(id, worklistItem?.id || null, 'SIGNED', 'SUBMITTED');

  return json({ success: true, report: updatedReport, message: 'Review requested' });
}

// Addendum Sign Action (Windows routing workaround)
async function handleAddendumSignAction(request: Request, reportId: number, session: any) {
  const data = await request.json();
  const { addendumId } = data;
  
  if (!addendumId) {
    return json({ success: false, error: 'Addendum ID required' }, { status: 400 });
  }

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

  const hasSignPermission = await checkPermission(session.user.id, 'reports.sign');
  const hasSignOwnPermission = await checkPermission(session.user.id, 'reports.sign_own');
  
  // Report is self-signed if reviewedBy is null OR reviewedBy equals signedBy (same person)
  const reportWasSelfSigned = !report.reviewedBy || report.reviewedBy === report.signedBy;
  const isAddendumCreator = addendum.createdBy === session.user.id;
  
  if (addendum.status === 'DRAFT') {
    if (!isAddendumCreator) {
      return json({ success: false, error: 'Only the addendum creator can sign a draft addendum' }, { status: 403 });
    }
    
    // Users with full sign permission (specialists, owner) can sign any addendum they created
    // Users with only sign_own permission must submit for review if report was reviewed by a specialist
    if (hasSignPermission) {
      // Full sign permission - can sign directly
    } else if (hasSignOwnPermission) {
      // Sign own permission - can only self-sign if original report was self-signed
      if (!reportWasSelfSigned) {
        return json({ success: false, error: 'This report was reviewed by a specialist. Please submit the addendum for specialist review.' }, { status: 403 });
      }
    } else {
      return json({ success: false, error: 'Permission denied - requires sign permission' }, { status: 403 });
    }
  } else if (addendum.status === 'SUBMITTED') {
    if (addendum.assignedSpecialistId !== session.user.id) {
      return json({ success: false, error: 'Only the assigned specialist can sign this addendum' }, { status: 403 });
    }
    
    if (!hasSignPermission) {
      return json({ success: false, error: 'Permission denied - requires sign permission' }, { status: 403 });
    }
  }

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

  return json({ success: true, addendum: updated, message: 'Addendum signed successfully' });
}

// Addendum Submit Action (Windows routing workaround)
async function handleAddendumSubmitAction(request: Request, reportId: number, session: any) {
  const data = await request.json();
  const { addendumId, specialistId, message } = data;
  
  if (!addendumId || !specialistId) {
    return json({ success: false, error: 'Addendum ID and specialist ID required' }, { status: 400 });
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
    return json({ success: false, error: 'Only draft addendums can be submitted' }, { status: 400 });
  }

  if (addendum.createdBy !== session.user.id) {
    return json({ success: false, error: 'Only the addendum creator can submit it' }, { status: 403 });
  }

  const hasSubmitPermission = await checkPermission(session.user.id, 'reports.submit');
  if (!hasSubmitPermission) {
    return json({ success: false, error: 'Permission denied' }, { status: 403 });
  }

  const now = new Date();

  const [updated] = await db
    .update(schema.reportAmendments)
    .set({
      status: 'SUBMITTED',
      assignedSpecialistId: specialistId,
      submittedAt: now,
      updatedAt: now
    })
    .where(eq(schema.reportAmendments.id, addendumId))
    .returning();

  await logAudit({
    userId: session.user.id,
    username: session.user.username,
    userRole: session.user.roleName,
    action: 'ADDENDUM_SUBMITTED',
    category: 'REPORTS',
    severity: 'INFO',
    resourceType: 'ADDENDUM',
    resourceId: String(addendumId),
      description: `Addendum submitted for report #${reportId}`,
    metadata: { reportId, specialistId, message }
  });

  return json({ success: true, addendum: updated, message: 'Addendum submitted for review' });
}

// Addendum Return Action (Windows routing workaround)
async function handleAddendumReturnAction(request: Request, reportId: number, session: any) {
  const data = await request.json();
  const { addendumId, reason } = data;
  
  if (!addendumId) {
    return json({ success: false, error: 'Addendum ID required' }, { status: 400 });
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

  if (addendum.status !== 'SUBMITTED') {
    return json({ success: false, error: 'Only submitted addendums can be returned' }, { status: 400 });
  }

  if (addendum.assignedSpecialistId !== session.user.id) {
    return json({ success: false, error: 'Only the assigned specialist can return this addendum' }, { status: 403 });
  }

  const now = new Date();

  const [updated] = await db
    .update(schema.reportAmendments)
    .set({
      status: 'DRAFT',
      assignedSpecialistId: null,
      submittedAt: null,
      updatedAt: now
    })
    .where(eq(schema.reportAmendments.id, addendumId))
    .returning();

  await logAudit({
    userId: session.user.id,
    username: session.user.username,
    userRole: session.user.roleName,
    action: 'ADDENDUM_RETURNED',
    category: 'REPORTS',
    severity: 'INFO',
    resourceType: 'ADDENDUM',
    resourceId: String(addendumId),
    description: `Addendum returned for report #${reportId}`,
    metadata: { reportId, reason }
  });

  return json({ success: true, addendum: updated, message: 'Addendum returned to creator' });
}

// Presence/Lock Action (Windows routing workaround)
const HEARTBEAT_EXPIRY_SECONDS = 60;
const LOCK_EXPIRY_SECONDS = 75;

async function cleanupExpiredLocks() {
  await db.delete(schema.reportEditLocks)
    .where(lt(schema.reportEditLocks.expiresAt, new Date()));
}

async function acquireEditLock(reportId: number, userId: number): Promise<{ success: boolean; error?: string; lockHolder?: any }> {
  await cleanupExpiredLocks();
  
  const [existingLock] = await db
    .select({
      userId: schema.reportEditLocks.userId,
      fullName: schema.users.fullName
    })
    .from(schema.reportEditLocks)
    .innerJoin(schema.users, eq(schema.reportEditLocks.userId, schema.users.id))
    .where(eq(schema.reportEditLocks.reportId, reportId))
    .limit(1);
  
  if (existingLock) {
    if (existingLock.userId === userId) {
      const newExpiresAt = new Date(Date.now() + LOCK_EXPIRY_SECONDS * 1000);
      await db.update(schema.reportEditLocks)
        .set({ expiresAt: newExpiresAt })
        .where(eq(schema.reportEditLocks.reportId, reportId));
      return { success: true };
    } else {
      return { 
        success: false, 
        error: 'Report is locked by another user',
        lockHolder: { userId: existingLock.userId, fullName: existingLock.fullName }
      };
    }
  }
  
  const expiresAt = new Date(Date.now() + LOCK_EXPIRY_SECONDS * 1000);
  await db.insert(schema.reportEditLocks)
    .values({
      reportId,
      userId,
      acquiredAt: new Date(),
      expiresAt
    });
  
  return { success: true };
}

async function renewEditLock(reportId: number, userId: number): Promise<{ success: boolean; error?: string }> {
  const [existingLock] = await db
    .select()
    .from(schema.reportEditLocks)
    .where(and(
      eq(schema.reportEditLocks.reportId, reportId),
      eq(schema.reportEditLocks.userId, userId)
    ))
    .limit(1);
  
  if (!existingLock) {
    return { success: false, error: 'No lock held' };
  }
  
  const newExpiresAt = new Date(Date.now() + LOCK_EXPIRY_SECONDS * 1000);
  await db.update(schema.reportEditLocks)
    .set({ expiresAt: newExpiresAt })
    .where(eq(schema.reportEditLocks.id, existingLock.id));
  
  return { success: true };
}

async function releaseEditLock(reportId: number, userId: number): Promise<{ success: boolean }> {
  await db.delete(schema.reportEditLocks)
    .where(and(
      eq(schema.reportEditLocks.reportId, reportId),
      eq(schema.reportEditLocks.userId, userId)
    ));
  return { success: true };
}

async function handlePresenceAction(request: Request, reportId: number, session: any) {
  const data = await request.json().catch(() => ({}));
  const presenceAction = data.presenceAction || 'heartbeat';

  if (presenceAction === 'leave') {
    await db.delete(schema.reportEditors)
      .where(and(
        eq(schema.reportEditors.reportId, reportId),
        eq(schema.reportEditors.userId, session.user.id)
      ));
    await releaseEditLock(reportId, session.user.id);
    return json({ success: true, action: 'left' });
  }

  if (presenceAction === 'release_lock') {
    await releaseEditLock(reportId, session.user.id);
    const lockStatus = await getLockStatus(reportId, session.user.id);
    return json({ success: true, action: 'lock_released', lock: lockStatus });
  }

  if (presenceAction === 'acquire_lock') {
    const participation = await checkReportParticipation(session.user.id, reportId);
    if (!participation.isParticipant) {
      return json({ success: false, error: 'Only report participants can acquire edit lock' }, { status: 403 });
    }
    
    const lockResult = await acquireEditLock(reportId, session.user.id);
    if (!lockResult.success) {
      return json({ 
        success: false, 
        error: lockResult.error,
        lockHolder: lockResult.lockHolder 
      }, { status: 423 });
    }
    
    const lockStatus = await getLockStatus(reportId, session.user.id);
    return json({ success: true, action: 'lock_acquired', lock: lockStatus });
  }

  // Default: heartbeat
  const expiryTime = new Date(Date.now() - HEARTBEAT_EXPIRY_SECONDS * 1000);
  await db.delete(schema.reportEditors)
    .where(lt(schema.reportEditors.lastHeartbeat, expiryTime));

  const [existing] = await db
    .select()
    .from(schema.reportEditors)
    .where(and(
      eq(schema.reportEditors.reportId, reportId),
      eq(schema.reportEditors.userId, session.user.id)
    ))
    .limit(1);

  if (existing) {
    await db.update(schema.reportEditors)
      .set({ lastHeartbeat: new Date() })
      .where(eq(schema.reportEditors.id, existing.id));
  } else {
    await db.insert(schema.reportEditors)
      .values({
        reportId,
        userId: session.user.id,
        lastHeartbeat: new Date()
      });
  }

  const lockStatus = await getLockStatus(reportId, session.user.id);
  if (lockStatus.isOwnLock) {
    await renewEditLock(reportId, session.user.id);
  }

  const activeEditors = await db
    .select({
      userId: schema.reportEditors.userId,
      fullName: schema.users.fullName
    })
    .from(schema.reportEditors)
    .innerJoin(schema.users, eq(schema.reportEditors.userId, schema.users.id))
    .where(eq(schema.reportEditors.reportId, reportId));

  const otherEditors = activeEditors.filter(e => e.userId !== session.user!.id);

  const updatedLockStatus = await getLockStatus(reportId, session.user.id);

  return json({
    success: true,
    action: existing ? 'heartbeat' : 'joined',
    activeEditors: otherEditors.map(e => ({
      userId: e.userId,
      fullName: e.fullName
    })),
    hasOtherEditors: otherEditors.length > 0,
    lock: updatedLockStatus
  });
}
