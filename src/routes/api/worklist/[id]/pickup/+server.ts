import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { reportEvents } from '$lib/server/reportEvents';
import { eq } from 'drizzle-orm';
import { PatientsRepository } from '$lib/server/PatientsRepository';

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'worklist.pickup');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const [worklistItem] = await db
      .select({
        id: schema.worklist.id,
        patientId: schema.worklist.patientId,
        modality: schema.worklist.modality,
        bodyRegion: schema.worklist.bodyRegion,
        accessionNumber: schema.worklist.accessionNumber,
        studyDate: schema.worklist.studyDate,
        priority: schema.worklist.priority,
        indication: schema.worklist.indication,
        referringPhysician: schema.worklist.referringPhysician,
        status: schema.worklist.status,
        patientFirstName: schema.patients.firstName,
        patientLastName: schema.patients.lastName,
        patientHospitalNumber: schema.patients.mrn,
        patientGender: schema.patients.gender,
        patientDateOfBirth: schema.patients.dateOfBirth
      })
      .from(schema.worklist)
      .leftJoin(schema.patients, eq(schema.worklist.patientId, schema.patients.id))
      .where(eq(schema.worklist.id, id))
      .limit(1);

    if (!worklistItem) {
      return json({ success: false, error: 'Worklist item not found' }, { status: 404 });
    }
    
    // Decrypt patient PHI fields
    const decryptedItem = PatientsRepository.decryptPatientFields(worklistItem);

    if (decryptedItem.status !== 'PENDING') {
      return json({ success: false, error: 'This item has already been picked up' }, { status: 400 });
    }

    const now = new Date();

    const [report] = await db.insert(schema.reports).values({
      patientId: worklistItem.patientId,
      accessionNumber: worklistItem.accessionNumber,
      modality: worklistItem.modality,
      bodyRegion: worklistItem.bodyRegion,
      studyDate: worklistItem.studyDate,
      indication: worklistItem.indication,
      status: 'DRAFT',
      priority: worklistItem.priority,
      isFromWorklist: true,
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
      .set({
        status: 'IN_PROGRESS',
        reportId: report.id,
        pickedUpBy: session.user.id,
        pickedUpAt: now,
        updatedAt: now
      })
      .where(eq(schema.worklist.id, id));

    // Notify SSE clients of status change
    reportEvents.notifyReportStatusChange(report.id, id, 'IN_PROGRESS', 'DRAFT');

    // Audit log for worklist pickup (also logs report creation)
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'WORKLIST_PICKUP',
      category: 'WORKLIST',
      severity: 'INFO',
      resourceType: 'WORKLIST',
      resourceId: String(id),
      description: `Worklist item picked up, report ${report.id} created`,
      metadata: { reportId: report.id, accessionNumber: worklistItem.accessionNumber }
    });

    return json({ 
      success: true, 
      reportId: report.id,
      patientData: {
        name: `${decryptedItem.patientFirstName || ''} ${decryptedItem.patientLastName || ''}`.trim(),
        hospitalNumber: decryptedItem.patientHospitalNumber || '',
        gender: decryptedItem.patientGender || '',
        dateOfBirth: decryptedItem.patientDateOfBirth || '',
        examType: decryptedItem.modality || '',
        examSubtype: decryptedItem.bodyRegion || '',
        indication: decryptedItem.indication || '',
        referringPhysician: decryptedItem.referringPhysician || '',
        studyDate: decryptedItem.studyDate ? new Date(decryptedItem.studyDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      },
      message: 'Report created from worklist item'
    });
  } catch (error) {
    console.error('Pickup worklist item error:', error);
    return json({ success: false, error: 'Failed to pick up worklist item' }, { status: 500 });
  }
};
