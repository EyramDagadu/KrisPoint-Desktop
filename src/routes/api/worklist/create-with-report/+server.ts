import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { PatientsRepository } from '$lib/server/PatientsRepository';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check for reports.create permission - this allows doctors to create ad-hoc reports
    // OR worklist.create for front desk creating worklist items
    const hasReportsCreate = await checkPermission(session.user.id, 'reports.create');
    const hasWorklistCreate = await checkPermission(session.user.id, 'worklist.create');
    if (!hasReportsCreate && !hasWorklistCreate) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const data = await request.json();
    const { 
      firstName, lastName, hospitalNumber, gender, dateOfBirth, age, ageUnit,
      modality, bodyRegion, priority, studyDate, indication, referringPhysician 
    } = data;

    if (!firstName || !lastName) {
      return json({ success: false, error: 'Patient first name and last name are required' }, { status: 400 });
    }
    if (!hospitalNumber) {
      return json({ success: false, error: 'Hospital number is required' }, { status: 400 });
    }
    if (!gender) {
      return json({ success: false, error: 'Patient sex is required' }, { status: 400 });
    }
    if (!modality) {
      return json({ success: false, error: 'Modality is required' }, { status: 400 });
    }
    if (!bodyRegion) {
      return json({ success: false, error: 'Body region is required' }, { status: 400 });
    }

    const modalityMap: Record<string, string> = {
      'ct': 'CT', 'mri': 'MRI', 'xray': 'X-Ray', 'us': 'Ultrasound',
      'mg': 'Mammography', 'fl': 'Fluoroscopy', 'nm': 'Nuclear Medicine', 'petct': 'PET-CT'
    };
    const worklistModality = modalityMap[modality.toLowerCase()] || modality;

    let patientId: number;
    const existingPatient = await PatientsRepository.findByMrn(hospitalNumber);

    if (existingPatient) {
      patientId = existingPatient.id;
      
      const existingDob = existingPatient.dateOfBirth;
      const dobIsInvalid = !existingDob || existingDob.toString().startsWith('0001');
      
      if (dobIsInvalid && (dateOfBirth || age)) {
        let newDob = dateOfBirth || null;
        if (!newDob && age) {
          const today = new Date();
          const ageValue = parseInt(age);
          if (!isNaN(ageValue)) {
            if (ageUnit === 'months') {
              today.setMonth(today.getMonth() - ageValue);
            } else if (ageUnit === 'days') {
              today.setDate(today.getDate() - ageValue);
            } else {
              today.setFullYear(today.getFullYear() - ageValue);
            }
            newDob = today.toISOString().split('T')[0];
          }
        }
        if (newDob) {
          await PatientsRepository.update(patientId, { dateOfBirth: newDob });
        }
      }
    } else {
      let calculatedDob = dateOfBirth || null;
      if (!calculatedDob && age) {
        const today = new Date();
        const ageValue = parseInt(age);
        if (!isNaN(ageValue)) {
          if (ageUnit === 'months') {
            today.setMonth(today.getMonth() - ageValue);
          } else if (ageUnit === 'days') {
            today.setDate(today.getDate() - ageValue);
          } else {
            today.setFullYear(today.getFullYear() - ageValue);
          }
          calculatedDob = today.toISOString().split('T')[0];
        }
      }
      
      const newPatient = await PatientsRepository.create({
        firstName,
        lastName,
        mrn: hospitalNumber,
        dateOfBirth: calculatedDob || undefined,
        gender,
        createdBy: session.user.id
      });

      patientId = newPatient.id;
    }

    const now = new Date();
    const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const accessionNumber = `ACC-${datePart}-${randomPart}`;

    const [worklistItem] = await db.insert(schema.worklist).values({
      patientId,
      modality: worklistModality,
      bodyRegion,
      accessionNumber,
      studyDate: studyDate ? new Date(studyDate) : now,
      priority: priority || 'ROUTINE',
      indication,
      referringPhysician,
      status: 'IN_PROGRESS',
      pickedUpBy: session.user.id,
      pickedUpAt: now,
      createdBy: session.user.id
    }).returning();

    const [report] = await db.insert(schema.reports).values({
      patientId,
      accessionNumber,
      modality: worklistModality,
      bodyRegion,
      studyDate: studyDate ? new Date(studyDate) : now,
      indication,
      status: 'DRAFT',
      priority: priority || 'ROUTINE',
      isFromWorklist: true,
      patientAge: age ? parseInt(age) : null,
      patientAgeUnit: ageUnit || 'years',
      createdBy: session.user.id,
      openedBy: session.user.id,
      openedAt: now
    }).returning();

    await db.insert(schema.reportWorkflows).values({
      reportId: report.id,
      event: 'OPENED',
      userId: session.user.id,
      userRole: session.user.roleName,
      occurredAt: now
    });

    await db
      .update(schema.worklist)
      .set({ reportId: report.id, updatedAt: now })
      .where(eq(schema.worklist.id, worklistItem.id));

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'WORKLIST_CREATED',
      category: 'WORKLIST',
      severity: 'INFO',
      resourceType: 'WORKLIST',
      resourceId: String(worklistItem.id),
      description: `Study created: ${hospitalNumber} ${worklistModality} ${bodyRegion}`,
      metadata: { patientId, modality: worklistModality, bodyRegion, reportId: report.id }
    });

    return json({ 
      success: true, 
      reportId: report.id,
      worklistId: worklistItem.id,
      accessionNumber,
      message: 'Worklist item and report created successfully'
    });
  } catch (error) {
    console.error('Create worklist with report error:', error);
    return json({ success: false, error: 'Failed to create worklist item and report' }, { status: 500 });
  }
};
