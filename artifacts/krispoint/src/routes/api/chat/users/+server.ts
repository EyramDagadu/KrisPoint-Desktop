import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, userPresence } from '../../../../../shared/schema';
import { eq, ne, and, sql } from 'drizzle-orm';
import { validateSessionFromRequest } from '$lib/server/auth';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    
    const presenceTimeout = 2 * 60 * 1000;
    const now = Date.now();

    const allUsers = await db.select({
      id: users.id,
      fullName: users.fullName,
      title: users.title,
      roleId: users.roleId,
      isOnline: userPresence.isOnline,
      lastSeenAt: userPresence.lastSeenAt,
      status: userPresence.status
    })
    .from(users)
    .leftJoin(userPresence, eq(users.id, userPresence.userId))
    .where(and(
      eq(users.isActive, true),
      ne(users.id, currentUserId)
    ))
    .orderBy(sql`CASE WHEN ${userPresence.isOnline} = true THEN 0 ELSE 1 END`, users.fullName);
    
    const usersWithTimeout = allUsers.map(user => {
      if (user.isOnline && user.lastSeenAt) {
        const lastSeen = new Date(user.lastSeenAt).getTime();
        if (now - lastSeen > presenceTimeout) {
          return { ...user, isOnline: false };
        }
      }
      return user;
    });

    return json({ users: usersWithTimeout });
  } catch (error) {
    console.error('Error fetching chat users:', error);
    return json({ error: 'Failed to fetch users' }, { status: 500 });
  }
};
