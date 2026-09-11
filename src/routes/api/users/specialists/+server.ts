import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest } from '$lib/server/auth';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
  try {
    console.log('GET /api/users/specialists called');
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      console.log('Specialists endpoint: Unauthorized');
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const radiologistRole = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.name, 'radiologist'))
      .limit(1);

    console.log('Radiologist role found:', radiologistRole);

    if (!radiologistRole.length) {
      console.log('No radiologist role found in database');
      return json({ success: true, specialists: [] });
    }

    const specialists = await db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        title: schema.users.title,
        specialty: schema.users.specialty,
        department: schema.users.department
      })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.roleId, radiologistRole[0].id),
          eq(schema.users.isActive, true)
        )
      );

    console.log('Found specialists:', specialists.length);

    return json({ 
      success: true, 
      specialists: specialists.map(s => ({
        id: s.id,
        name: s.title ? `${s.title} ${s.fullName}` : s.fullName,
        specialty: s.specialty || '',
        department: s.department || ''
      }))
    });
  } catch (error) {
    console.error('Get specialists error:', error);
    return json({ success: false, error: 'Failed to fetch specialists' }, { status: 500 });
  }
};
