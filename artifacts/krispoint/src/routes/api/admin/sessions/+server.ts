import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { eq, and, desc, gt } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'users.manage');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const now = new Date();
    const activeSessions = await db
      .select({
        id: schema.sessions.id,
        userId: schema.sessions.userId,
        ipAddress: schema.sessions.ipAddress,
        userAgent: schema.sessions.userAgent,
        deviceInfo: schema.sessions.deviceInfo,
        createdAt: schema.sessions.createdAt,
        expiresAt: schema.sessions.expiresAt,
        isValid: schema.sessions.isValid,
        userName: schema.users.fullName,
        username: schema.users.username,
        roleName: schema.roles.name
      })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
      .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(
        and(
          eq(schema.sessions.isValid, true),
          gt(schema.sessions.expiresAt, now)
        )
      )
      .orderBy(desc(schema.sessions.createdAt));

    const currentSessionId = session.sessionId;
    
    return json({ 
      success: true, 
      sessions: activeSessions.map(s => ({
        ...s,
        isCurrent: s.id === currentSessionId
      })),
      currentSessionId
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return json({ success: false, error: 'Failed to fetch sessions' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'users.manage');
    if (!hasPermission) {
      return json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const { sessionId, userId, revokeAll } = await request.json();

    if (revokeAll && userId) {
      await db
        .update(schema.sessions)
        .set({ 
          isValid: false, 
          revokedAt: new Date(),
          revokedReason: 'admin_force_logout_all'
        })
        .where(eq(schema.sessions.userId, userId));

      await logAudit({
        userId: session.user.id,
        username: session.user.username,
        userRole: session.user.roleName,
        action: 'FORCE_LOGOUT_ALL',
        category: 'SECURITY',
        severity: 'WARNING',
        resourceType: 'USER',
        resourceId: String(userId),
        description: `Admin forced logout of all sessions for user ID ${userId}`
      });

      return json({ success: true, message: 'All user sessions revoked' });
    }

    if (sessionId) {
      if (sessionId === session.sessionId) {
        return json({ success: false, error: 'Cannot terminate your own session' }, { status: 400 });
      }

      const targetSession = await db
        .select({ userId: schema.sessions.userId })
        .from(schema.sessions)
        .where(eq(schema.sessions.id, sessionId))
        .limit(1);

      if (targetSession.length === 0) {
        return json({ success: false, error: 'Session not found' }, { status: 404 });
      }

      await db
        .update(schema.sessions)
        .set({ 
          isValid: false, 
          revokedAt: new Date(),
          revokedReason: 'admin_force_logout'
        })
        .where(eq(schema.sessions.id, sessionId));

      await logAudit({
        userId: session.user.id,
        username: session.user.username,
        userRole: session.user.roleName,
        action: 'FORCE_LOGOUT',
        category: 'SECURITY',
        severity: 'WARNING',
        resourceType: 'SESSION',
        resourceId: String(sessionId),
        description: `Admin forced logout of session ID ${sessionId}`
      });

      return json({ success: true, message: 'Session revoked' });
    }

    return json({ success: false, error: 'Session ID or user ID required' }, { status: 400 });
  } catch (error) {
    console.error('Revoke session error:', error);
    return json({ success: false, error: 'Failed to revoke session' }, { status: 500 });
  }
};
