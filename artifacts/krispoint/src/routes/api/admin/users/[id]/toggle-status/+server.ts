import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'users.manage');
    if (!hasPermission) {
      return json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    if (userId === session.user.id) {
      return json({ success: false, error: 'Cannot toggle your own account status' }, { status: 400 });
    }

    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!existingUser.length) {
      return json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (existingUser[0].deletedAt) {
      return json({ success: false, error: 'Cannot modify a deleted user account' }, { status: 400 });
    }

    const newStatus = !existingUser[0].isActive;

    await db
      .update(schema.users)
      .set({ isActive: newStatus, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      action: newStatus ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      category: 'USERS',
      severity: newStatus ? 'INFO' : 'WARNING',
      description: `User ${newStatus ? 'activated' : 'deactivated'}: ${existingUser[0].username}`,
      resourceType: 'USER',
      resourceId: String(userId),
      oldValue: { isActive: existingUser[0].isActive },
      newValue: { isActive: newStatus }
    });

    return json({ 
      success: true, 
      isActive: newStatus,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    console.error('Toggle user status API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
