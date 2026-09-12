import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { validateSessionFromRequest, checkPermission } from '$lib/server/auth';

const INSTITUTION_KEY = 'organization_institution';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [setting] = await db
      .select()
      .from(schema.organizationSettings)
      .where(eq(schema.organizationSettings.key, INSTITUTION_KEY))
      .limit(1);

    const institution = setting?.value || '';

    return json({ 
      success: true, 
      institution 
    });
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return json({ success: false, error: 'Failed to fetch organization settings' }, { status: 500 });
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
      return json({ success: false, error: 'Permission denied. Only administrators can update organization settings.' }, { status: 403 });
    }

    const body = await request.json();
    const { institution } = body;

    if (typeof institution !== 'string') {
      return json({ success: false, error: 'Institution name is required' }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: schema.organizationSettings.id })
      .from(schema.organizationSettings)
      .where(eq(schema.organizationSettings.key, INSTITUTION_KEY))
      .limit(1);

    if (existing) {
      await db
        .update(schema.organizationSettings)
        .set({
          value: institution.trim(),
          updatedBy: session.user.id,
          updatedAt: new Date()
        })
        .where(eq(schema.organizationSettings.key, INSTITUTION_KEY));
    } else {
      await db.insert(schema.organizationSettings).values({
        key: INSTITUTION_KEY,
        value: institution.trim(),
        description: 'Organization/Institution name displayed on reports',
        updatedBy: session.user.id
      });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return json({ success: false, error: 'Failed to update organization settings' }, { status: 500 });
  }
};
