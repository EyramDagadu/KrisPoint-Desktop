import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chatMessages, users } from '../../../../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { validateSessionFromRequest } from '$lib/server/auth';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;

    const unreadCounts = await db.select({
      senderId: chatMessages.senderId,
      senderName: users.fullName,
      senderTitle: users.title,
      count: sql<number>`cast(count(*) as integer)`
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.senderId, users.id))
    .where(and(
      eq(chatMessages.receiverId, currentUserId),
      eq(chatMessages.isRead, false)
    ))
    .groupBy(chatMessages.senderId, users.fullName, users.title);

    const totalUnread = unreadCounts.reduce((sum, item) => sum + item.count, 0);

    return json({ 
      totalUnread,
      unreadBySender: unreadCounts
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
};
