import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, checkReportParticipation, logAudit } from '$lib/server/auth';
import { eq, lt } from 'drizzle-orm';
import { PatientsRepository } from '$lib/server/PatientsRepository';

const LOCK_EXPIRY_SECONDS = 75;

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

async function getLockStatus(reportId: number, currentUserId: number) {
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

export const GET: RequestHandler = async ({ request, params }) => {
  try {
    console.log('GET /api/reports/[id] called with params:', params);
    
    const session = await validateSessionFromRequest(request);
    console.log('Session validation result:', session.success, session.user?.id);
    
    if (!session.success || !session.user) {
      console.log('Session validation failed:', session.error);
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const hasFullReadPermission = await checkPermission(session.user.id, 'reports.read');
    const hasReadOwnPermission = await checkPermission(session.user.id, 'reports.read_own');
    console.log('Permission check - reports.read:', hasFullReadPermission, 'reports.read_own:', hasReadOwnPermission);
    
    if (!hasFullReadPermission && !hasReadOwnPermission) {
      console.log('No read permission for user:', session.user.id);
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
      console.log('Report not found for ID:', id);
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    
    // Decrypt patient PHI fields
    const decryptedReport = PatientsRepository.decryptPatientFields(report);
    const { patientFirstName, patientLastName, patientHospitalNumber, patientDateOfBirth } = decryptedReport;
    
    if (!hasFullReadPermission && hasReadOwnPermission) {
      const isOwner = report.openedBy === session.user.id || report.createdBy === session.user.id;
      const isParticipant = report.assignedSpecialistId === session.user.id || report.signedBy === session.user.id;
      const canViewSigned = report.status === 'SIGNED';
      
      if (!isOwner && !isParticipant && !canViewSigned) {
        console.log('User does not own this report:', session.user.id, 'openedBy:', report.openedBy, 'createdBy:', report.createdBy);
        return json({ success: false, error: 'Permission denied' }, { status: 403 });
      }
    }
    
    console.log('Found report:', report.id, 'Patient:', patientFirstName, patientLastName, 'Age:', report.patientAge, 'AgeUnit:', report.patientAgeUnit);

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

    // Fetch creator user details for PDF signature (use role name as designation)
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

    // Fetch signer user details for PDF signature (if report is signed)
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

    // Fetch reviewer user details for PDF signature (if report was co-signed)
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
    
    // isOwner is determined purely by who created the report - NOT by openedBy
    // This ensures specialists who opened/returned reports are NOT considered owners
    const isOwner = report.createdBy === session.user.id;
    const isAssignedSpecialist = report.assignedSpecialistId === session.user.id;
    const isSigner = report.signedBy === session.user.id;
    const isReviewer = report.reviewedBy === session.user.id;
    const isCompleted = report.status === 'SIGNED';
    const isSubmitted = report.status === 'SUBMITTED';
    
    const participation = await checkReportParticipation(session.user.id, id);
    
    // 15-minute "Undo Sign Off" window - only available to the signer
    let canUndoSign = false;
    let undoSignExpiresAt = null;
    const UNDO_SIGN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    
    if (report.signedAt && report.status === 'SIGNED' && isSigner) {
      const signedTime = new Date(report.signedAt).getTime();
      const now = Date.now();
      canUndoSign = (now - signedTime) < UNDO_SIGN_WINDOW_MS;
      undoSignExpiresAt = new Date(signedTime + UNDO_SIGN_WINDOW_MS).toISOString();
    }
    
    // Is user an author of this report (participated in creation/signing)?
    const isReportAuthor = isOwner || isSigner || isReviewer;
    
    let canEdit = false;
    
    // SIGNED reports: always read-only (use "Undo Sign Off" to revert first)
    if (isCompleted) {
      canEdit = false;
    }
    // SUBMITTED reports: only assigned specialist can edit
    else if (isSubmitted) {
      canEdit = isAssignedSpecialist && (hasEditPermission || hasEditOwnPermission);
    }
    // DRAFT reports: only owner can edit
    else {
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
    console.error('Get report error:', error);
    return json({ success: false, error: 'Failed to get report' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const hasDeletePermission = await checkPermission(session.user.id, 'reports.delete');
    const hasDeleteOwnPermission = await checkPermission(session.user.id, 'reports.delete_own');
    
    if (!hasDeletePermission && !hasDeleteOwnPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const [report] = await db
      .select({
        openedBy: schema.reports.openedBy,
        createdBy: schema.reports.createdBy
      })
      .from(schema.reports)
      .where(eq(schema.reports.id, id))
      .limit(1);
    
    if (!report) {
      return json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    
    if (!hasDeletePermission && hasDeleteOwnPermission) {
      // Only the creator can delete - NOT someone who merely opened the report
      const isOwner = report.createdBy === session.user.id;
      if (!isOwner) {
        return json({ success: false, error: 'You can only delete your own reports' }, { status: 403 });
      }
    }

    await db.delete(schema.reports).where(eq(schema.reports.id, id));

    return json({ success: true });
  } catch (error) {
    console.error('Delete report error:', error);
    return json({ success: false, error: 'Failed to delete report' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
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

    // Optimistic concurrency control: Check if report was modified by someone else
    if (ifMatchVersion) {
      const [currentReport] = await db
        .select({ updatedAt: schema.reports.updatedAt })
        .from(schema.reports)
        .where(eq(schema.reports.id, id))
        .limit(1);
      
      if (currentReport) {
        const expectedVersion = new Date(ifMatchVersion).getTime();
        const actualVersion = currentReport.updatedAt ? new Date(currentReport.updatedAt).getTime() : 0;
        
        // Allow 1 second tolerance for slight timing differences
        if (Math.abs(expectedVersion - actualVersion) > 1000) {
          return json({ 
            success: false, 
            error: 'This report has been modified by another user. Please refresh to see the latest changes.',
            conflictType: 'VERSION_MISMATCH',
            currentVersion: currentReport.updatedAt?.toISOString()
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
