import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest } from '$lib/server/auth';
import { eq, and, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const specialistRoles = await db
      .select({ id: schema.roles.id })
      .from(schema.roles)
      .where(
        inArray(schema.roles.name, ['radiologist', 'admin'])
      );

    const roleIds = specialistRoles.map(r => r.id);

    const specialists = await db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        title: schema.users.title,
        specialty: schema.users.specialty,
        department: schema.users.department,
        roleName: schema.roles.displayName
      })
      .from(schema.users)
      .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(
        and(
          inArray(schema.users.roleId, roleIds),
          eq(schema.users.isActive, true)
        )
      );

    return json({ success: true, specialists });
  } catch (error) {
    console.error('Get specialists error:', error);
    return json({ success: false, error: 'Failed to get specialists' }, { status: 500 });
  }
};
