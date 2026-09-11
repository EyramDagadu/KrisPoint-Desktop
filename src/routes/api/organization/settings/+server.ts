import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as schema from '../../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const key = url.searchParams.get('key');
    
    if (key) {
      const [setting] = await db
        .select()
        .from(schema.organizationSettings)
        .where(eq(schema.organizationSettings.key, key))
        .limit(1);

      if (!setting) {
        return json({ success: true, value: null });
      }

      try {
        return json({ success: true, value: JSON.parse(setting.value || '{}') });
      } catch {
        return json({ success: true, value: setting.value });
      }
    }

    const settings = await db.select().from(schema.organizationSettings);
    const parsed = settings.reduce((acc, s) => {
      try {
        acc[s.key] = JSON.parse(s.value || '{}');
      } catch {
        acc[s.key] = s.value;
      }
      return acc;
    }, {} as Record<string, any>);

    return json({ success: true, settings: parsed });
  } catch (error) {
    console.error('Get settings error:', error);
    return json({ success: false, error: 'Failed to get settings' }, { status: 500 });
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
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const data = await request.json();
    const { key, value } = data;

    if (!key) {
      return json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);

    const [existing] = await db
      .select({ id: schema.organizationSettings.id })
      .from(schema.organizationSettings)
      .where(eq(schema.organizationSettings.key, key))
      .limit(1);

    if (existing) {
      await db
        .update(schema.organizationSettings)
        .set({
          value: valueToStore,
          updatedBy: session.user.id,
          updatedAt: new Date()
        })
        .where(eq(schema.organizationSettings.key, key));
    } else {
      await db.insert(schema.organizationSettings).values({
        key,
        value: valueToStore,
        updatedBy: session.user.id
      });
    }

    // Audit log for organization setting change
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'ORGANIZATION_SETTING_UPDATED',
      category: 'SETTINGS',
      severity: 'INFO',
      resourceType: 'SETTING',
      resourceId: key,
      description: `Organization setting '${key}' updated`
    });

    return json({ success: true });
  } catch (error) {
    console.error('Save setting error:', error);
    return json({ success: false, error: 'Failed to save setting' }, { status: 500 });
  }
};
