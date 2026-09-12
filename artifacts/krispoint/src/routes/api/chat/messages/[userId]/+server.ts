import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chatMessages, users } from '../../../../../../shared/schema';
import { eq, and, or } from 'drizzle-orm';
import { validateSessionFromRequest } from '$lib/server/auth';

export const GET: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const otherUserId = parseInt(params.userId);

    if (isNaN(otherUserId) || otherUserId === currentUserId) {
      return json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const otherUser = await db.select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, otherUserId), eq(users.isActive, true)))
      .limit(1);
    
    if (otherUser.length === 0) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    const messages = await db.select({
      id: chatMessages.id,
      senderId: chatMessages.senderId,
      receiverId: chatMessages.receiverId,
      content: chatMessages.content,
      isRead: chatMessages.isRead,
      readAt: chatMessages.readAt,
      createdAt: chatMessages.createdAt
    })
    .from(chatMessages)
    .where(
      or(
        and(
          eq(chatMessages.senderId, currentUserId),
          eq(chatMessages.receiverId, otherUserId)
        ),
        and(
          eq(chatMessages.senderId, otherUserId),
          eq(chatMessages.receiverId, currentUserId)
        )
      )
    )
    .orderBy(chatMessages.createdAt)
    .limit(100);

    await db.update(chatMessages)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(chatMessages.senderId, otherUserId),
        eq(chatMessages.receiverId, currentUserId),
        eq(chatMessages.isRead, false)
      ));

    return json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
};
