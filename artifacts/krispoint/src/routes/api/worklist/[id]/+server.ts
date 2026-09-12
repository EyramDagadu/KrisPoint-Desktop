import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

// Normalize modality to canonical form
function normalizeModality(modality: string | null): string | null {
  if (!modality) return null;
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

export const GET: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'worklist.read');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const [item] = await db
      .select()
      .from(schema.worklist)
      .where(eq(schema.worklist.id, id))
      .limit(1);

    if (!item) {
      return json({ success: false, error: 'Worklist item not found' }, { status: 404 });
    }

    return json({ success: true, item });
  } catch (error) {
    console.error('Get worklist item error:', error);
    return json({ success: false, error: 'Failed to get worklist item' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'worklist.update');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const data = await request.json();
    const { modality, bodyRegion, studyDescription, priority, indication, referringPhysician } = data;

    const [item] = await db
      .update(schema.worklist)
      .set({
        modality: normalizeModality(modality),
        bodyRegion,
        studyDescription,
        priority,
        indication,
        referringPhysician,
        updatedAt: new Date()
      })
      .where(eq(schema.worklist.id, id))
      .returning();

    if (!item) {
      return json({ success: false, error: 'Worklist item not found' }, { status: 404 });
    }

    // Audit log for worklist update
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'WORKLIST_UPDATED',
      category: 'WORKLIST',
      severity: 'INFO',
      resourceType: 'WORKLIST',
      resourceId: String(id),
      description: `Worklist item updated`,
      metadata: { modality, bodyRegion, priority }
    });

    return json({ success: true, item });
  } catch (error) {
    console.error('Update worklist item error:', error);
    return json({ success: false, error: 'Failed to update worklist item' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'worklist.delete');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const [item] = await db
      .delete(schema.worklist)
      .where(eq(schema.worklist.id, id))
      .returning();

    if (!item) {
      return json({ success: false, error: 'Worklist item not found' }, { status: 404 });
    }

    // Audit log for worklist deletion
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'WORKLIST_DELETED',
      category: 'WORKLIST',
      severity: 'WARNING',
      resourceType: 'WORKLIST',
      resourceId: String(id),
      description: `Worklist item deleted`,
      metadata: { accessionNumber: item.accessionNumber, patientId: item.patientId }
    });

    return json({ success: true, message: 'Worklist item deleted' });
  } catch (error) {
    console.error('Delete worklist item error:', error);
    return json({ success: false, error: 'Failed to delete worklist item' }, { status: 500 });
  }
};
