import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as schema from '../../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';

const LETTERHEAD_KEY = 'organization_letterhead';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [setting] = await db
      .select()
      .from(schema.organizationSettings)
      .where(eq(schema.organizationSettings.key, LETTERHEAD_KEY))
      .limit(1);

    if (!setting || !setting.value) {
      return json({ success: true, letterhead: null });
    }

    const letterheadData = JSON.parse(setting.value);
    return json({ success: true, letterhead: letterheadData });
  } catch (error) {
    console.error('Get letterhead error:', error);
    return json({ success: false, error: 'Failed to get letterhead' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'settings.manage');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied. Only admins can manage letterhead.' }, { status: 403 });
    }

    const data = await request.json();
    const { letterhead, settings } = data;

    const valueToStore = JSON.stringify({
      currentLetterhead: letterhead,
      settings: settings || {
        height: 120,
        opacity: 1.0,
        position: 'top',
        margin: 20,
        topMargin: 10
      }
    });

    const [existing] = await db
      .select({ id: schema.organizationSettings.id })
      .from(schema.organizationSettings)
      .where(eq(schema.organizationSettings.key, LETTERHEAD_KEY))
      .limit(1);

    if (existing) {
      await db
        .update(schema.organizationSettings)
        .set({
          value: valueToStore,
          updatedBy: session.user.id,
          updatedAt: new Date()
        })
        .where(eq(schema.organizationSettings.key, LETTERHEAD_KEY));
    } else {
      await db.insert(schema.organizationSettings).values({
        key: LETTERHEAD_KEY,
        value: valueToStore,
        description: 'Organization letterhead for PDF exports',
        updatedBy: session.user.id
      });
    }

    // Audit log for letterhead update
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'LETTERHEAD_UPDATED',
      category: 'SETTINGS',
      severity: 'INFO',
      resourceType: 'SETTING',
      resourceId: 'organization_letterhead',
      description: 'Organization letterhead updated'
    });

    return json({ success: true });
  } catch (error) {
    console.error('Save letterhead error:', error);
    return json({ success: false, error: 'Failed to save letterhead' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'settings.manage');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    await db
      .delete(schema.organizationSettings)
      .where(eq(schema.organizationSettings.key, LETTERHEAD_KEY));

    // Audit log for letterhead deletion
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'LETTERHEAD_DELETED',
      category: 'SETTINGS',
      severity: 'WARNING',
      resourceType: 'SETTING',
      resourceId: 'organization_letterhead',
      description: 'Organization letterhead deleted'
    });

    return json({ success: true });
  } catch (error) {
    console.error('Delete letterhead error:', error);
    return json({ success: false, error: 'Failed to delete letterhead' }, { status: 500 });
  }
};
