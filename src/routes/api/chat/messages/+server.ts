import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { chatMessages, users } from '../../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { validateSessionFromRequest, logAudit } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const senderId = session.user.id;
    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content?.trim()) {
      return json({ error: 'Missing receiverId or content' }, { status: 400 });
    }

    const [newMessage] = await db.insert(chatMessages).values({
      senderId,
      receiverId: parseInt(receiverId),
      content: content.trim()
    }).returning();

    const sender = await db.select({
      fullName: users.fullName,
      title: users.title
    }).from(users).where(eq(users.id, senderId)).limit(1);

    // Get receiver username for audit log
    const receiver = await db.select({
      username: users.username
    }).from(users).where(eq(users.id, parseInt(receiverId))).limit(1);

    // Audit log for chat message (no PHI logged, just metadata)
    await logAudit({
      userId: senderId,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'CHAT_MESSAGE_SENT',
      category: 'COMM',
      severity: 'INFO',
      resourceType: 'CHAT_MESSAGE',
      resourceId: String(newMessage.id),
      description: `Chat message sent to ${receiver[0]?.username || 'unknown'}`,
      metadata: { receiverUsername: receiver[0]?.username }
    });

    return json({ 
      message: {
        ...newMessage,
        senderName: sender[0]?.fullName,
        senderTitle: sender[0]?.title
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return json({ error: 'Failed to send message' }, { status: 500 });
  }
};
