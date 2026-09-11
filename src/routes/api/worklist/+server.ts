import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission } from '$lib/server/auth';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { aliasedTable as alias } from 'drizzle-orm/alias';
import { PatientsRepository } from '$lib/server/PatientsRepository';

// Normalize modality to canonical form
function normalizeModality(modality: string | null): string {
  if (!modality) return '';
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

    const hasPermission = await checkPermission(session.user.id, 'worklist.read');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const modality = url.searchParams.get('modality');
    const status = url.searchParams.get('status');

    const pickedUpByUser = alias(schema.users, 'pickedUpByUser');
    const signedByUser = alias(schema.users, 'signedByUser');
    const reviewedByUser = alias(schema.users, 'reviewedByUser');

    let query = db
      .select({
        id: schema.worklist.id,
        patientId: schema.worklist.patientId,
        modality: schema.worklist.modality,
        bodyRegion: schema.worklist.bodyRegion,
        studyDescription: schema.worklist.studyDescription,
        accessionNumber: schema.worklist.accessionNumber,
        studyDate: schema.worklist.studyDate,
        priority: schema.worklist.priority,
        indication: schema.worklist.indication,
        referringPhysician: schema.worklist.referringPhysician,
        status: schema.worklist.status,
        reportId: schema.worklist.reportId,
        pickedUpBy: schema.worklist.pickedUpBy,
        pickedUpAt: schema.worklist.pickedUpAt,
        createdAt: schema.worklist.createdAt,
        patientFirstName: schema.patients.firstName,
        patientLastName: schema.patients.lastName,
        patientHospitalNumber: schema.patients.mrn,
        reportStatus: schema.reports.status,
        pickedUpByName: pickedUpByUser.fullName,
        signedByName: signedByUser.fullName,
        reviewedByName: reviewedByUser.fullName
      })
      .from(schema.worklist)
      .leftJoin(schema.patients, eq(schema.worklist.patientId, schema.patients.id))
      .leftJoin(schema.reports, eq(schema.worklist.reportId, schema.reports.id))
      .leftJoin(pickedUpByUser, eq(schema.worklist.pickedUpBy, pickedUpByUser.id))
      .leftJoin(signedByUser, eq(schema.reports.signedBy, signedByUser.id))
      .leftJoin(reviewedByUser, eq(schema.reports.reviewedBy, reviewedByUser.id))
      .orderBy(
        sql`CASE WHEN ${schema.worklist.status} = 'PENDING' THEN 1 WHEN ${schema.worklist.status} = 'IN_PROGRESS' THEN 2 ELSE 3 END`,
        sql`CASE WHEN ${schema.worklist.priority} = 'STAT' THEN 1 WHEN ${schema.worklist.priority} = 'URGENT' THEN 2 ELSE 3 END`,
        desc(schema.worklist.createdAt)
      );

    const conditions = [];
    if (status && status !== 'ALL') {
      // Handle report status filters (DRAFT, SUBMITTED, SIGNED)
      if (status === 'DRAFT') {
        conditions.push(eq(schema.worklist.status, 'IN_PROGRESS'));
        conditions.push(eq(schema.reports.status, 'DRAFT'));
      } else if (status === 'SUBMITTED') {
        conditions.push(eq(schema.worklist.status, 'IN_PROGRESS'));
        conditions.push(eq(schema.reports.status, 'SUBMITTED'));
      } else if (status === 'SIGNED') {
        conditions.push(eq(schema.worklist.status, 'COMPLETED'));
        conditions.push(eq(schema.reports.status, 'SIGNED'));
      } else {
        // Handle worklist status filters (PENDING, IN_PROGRESS, COMPLETED)
        conditions.push(eq(schema.worklist.status, status));
      }
    }
    if (modality) {
      const variations = getModalityVariations(modality);
      conditions.push(inArray(schema.worklist.modality, variations));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rawItems = await query;
    
    // Decrypt patient PHI fields
    const items = rawItems.map(item => PatientsRepository.decryptPatientFields(item));

    return json({ success: true, items });
  } catch (error) {
    console.error('Get worklist error:', error);
    return json({ success: false, error: 'Failed to get worklist' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  console.log('[Worklist API] POST request received');
  try {
    console.log('[Worklist API] Validating session...');
    const session = await validateSessionFromRequest(request);
    console.log('[Worklist API] Session result:', session.success ? 'valid' : 'invalid');
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Worklist API] Checking permission for user:', session.user.id);
    const hasPermission = await checkPermission(session.user.id, 'worklist.create');
    console.log('[Worklist API] Permission check result:', hasPermission);
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    console.log('[Worklist API] Parsing request body...');
    const data = await request.json();
    console.log('[Worklist API] Request data:', JSON.stringify(data, null, 2));
    const { patient, patientId, modality, bodyRegion, studyDescription, accessionNumber, studyDate, priority, indication, referringPhysician } = data;

    if (!modality) {
      return json({ success: false, error: 'Modality is required' }, { status: 400 });
    }

    let finalPatientId = patientId;

    if (patient && !patientId) {
      console.log('[Worklist API] Creating/finding patient...');
      const hospitalNumber = patient.hospitalNumber || patient.mrn;
      
      if (!patient.firstName || !patient.lastName || !hospitalNumber || !patient.sex) {
        return json({ success: false, error: 'Patient first name, last name, Hospital Number, and sex are required' }, { status: 400 });
      }

      console.log('[Worklist API] Looking for existing patient with MRN:', hospitalNumber);
      const existingPatient = await PatientsRepository.findByMrn(hospitalNumber);
      console.log('[Worklist API] Existing patient found:', existingPatient ? existingPatient.id : 'none');

      if (existingPatient) {
        finalPatientId = existingPatient.id;
        
        // Update date_of_birth if it's missing/invalid and age is provided
        const existingDob = existingPatient.dateOfBirth;
        const dobIsInvalid = !existingDob || existingDob.toString().startsWith('0001');
        
        if (dobIsInvalid && (patient.dateOfBirth || patient.age)) {
          let newDob = patient.dateOfBirth || null;
          if (!newDob && patient.age) {
            const today = new Date();
            const ageValue = parseInt(patient.age);
            if (!isNaN(ageValue)) {
              if (patient.ageUnit === 'months') {
                today.setMonth(today.getMonth() - ageValue);
              } else if (patient.ageUnit === 'days') {
                today.setDate(today.getDate() - ageValue);
              } else {
                today.setFullYear(today.getFullYear() - ageValue);
              }
              newDob = today.toISOString().split('T')[0];
            }
          }
          if (newDob) {
            await db.update(schema.patients)
              .set({ dateOfBirth: newDob })
              .where(eq(schema.patients.id, finalPatientId));
          }
        }
      } else {
        // Calculate dateOfBirth from age if no dateOfBirth provided
        let calculatedDob = patient.dateOfBirth || null;
        if (!calculatedDob && patient.age) {
          const today = new Date();
          const ageValue = parseInt(patient.age);
          if (!isNaN(ageValue)) {
            if (patient.ageUnit === 'months') {
              today.setMonth(today.getMonth() - ageValue);
            } else if (patient.ageUnit === 'days') {
              today.setDate(today.getDate() - ageValue);
            } else {
              today.setFullYear(today.getFullYear() - ageValue);
            }
            calculatedDob = today.toISOString().split('T')[0];
          }
        }
        
        console.log('[Worklist API] Creating new patient...');
        const newPatient = await PatientsRepository.create({
          firstName: patient.firstName,
          lastName: patient.lastName,
          mrn: hospitalNumber,
          dateOfBirth: calculatedDob || undefined,
          gender: patient.sex,
          createdBy: session.user.id
        });
        console.log('[Worklist API] New patient created with ID:', newPatient.id);

        finalPatientId = newPatient.id;
      }
    }

    if (!finalPatientId) {
      return json({ success: false, error: 'Patient information is required' }, { status: 400 });
    }

    console.log('[Worklist API] Creating worklist item for patient:', finalPatientId);
    // Normalize modality to canonical form for consistency
    const normalizedModality = normalizeModality(modality);
    
    const [item] = await db.insert(schema.worklist).values({
      patientId: finalPatientId,
      modality: normalizedModality,
      bodyRegion,
      studyDescription,
      accessionNumber,
      studyDate: studyDate ? new Date(studyDate) : null,
      priority: priority || 'ROUTINE',
      indication,
      referringPhysician,
      status: 'PENDING',
      createdBy: session.user.id
    }).returning();

    console.log('[Worklist API] Worklist item created successfully:', item.id);
    return json({ success: true, item });
  } catch (error) {
    console.error('[Worklist API] Create worklist item error:', error);
    return json({ success: false, error: 'Failed to create worklist item' }, { status: 500 });
  }
};
