import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { userPresence } from '../../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { validateSessionFromRequest } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { isOnline, status } = body;

    const existing = await db.select()
      .from(userPresence)
      .where(eq(userPresence.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userPresence).values({
        userId,
        isOnline: isOnline ?? true,
        status: status ?? 'available',
        lastSeenAt: new Date()
      });
    } else {
      await db.update(userPresence)
        .set({
          isOnline: isOnline ?? true,
          status: status ?? existing[0].status,
          lastSeenAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(userPresence.userId, userId));
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error updating presence:', error);
    return json({ error: 'Failed to update presence' }, { status: 500 });
  }
};
