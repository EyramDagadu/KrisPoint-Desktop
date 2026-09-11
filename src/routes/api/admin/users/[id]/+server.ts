import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ params, request }) => {
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

    const data = await request.json();
    
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

    // Validate role exists if updating role
    if (data.roleId) {
      const roleExists = await db
        .select()
        .from(schema.roles)
        .where(eq(schema.roles.id, data.roleId))
        .limit(1);
      
      if (!roleExists.length) {
        return json({ success: false, error: 'Invalid role' }, { status: 400 });
      }
    }

    // Build update data - only include fields that were provided
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const oldData: Record<string, unknown> = {};

    if (data.firstName !== undefined) {
      oldData.firstName = existingUser[0].firstName;
      updateData.firstName = data.firstName;
    }
    if (data.lastName !== undefined) {
      oldData.lastName = existingUser[0].lastName;
      updateData.lastName = data.lastName;
    }
    if (data.title !== undefined) {
      oldData.title = existingUser[0].title;
      updateData.title = data.title;
    }
    if (data.designation !== undefined) {
      oldData.designation = existingUser[0].designation;
      updateData.designation = data.designation;
    }
    if (data.roleId !== undefined) {
      oldData.roleId = existingUser[0].roleId;
      updateData.roleId = data.roleId;
    }
    if (data.email !== undefined) {
      oldData.email = existingUser[0].email;
      updateData.email = data.email;
    }

    const [updatedUser] = await db
      .update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, userId))
      .returning();

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      action: 'USER_UPDATED',
      category: 'USERS',
      severity: 'INFO',
      description: `User updated: ${existingUser[0].username}`,
      resourceType: 'USER',
      resourceId: String(userId),
      oldValue: oldData,
      newValue: updateData
    });

    const role = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, updatedUser.roleId))
      .limit(1);

    const { password: _, securityAnswer: __, ...userWithoutSensitive } = updatedUser;

    return json({ 
      success: true, 
      user: { 
        ...userWithoutSensitive, 
        roleName: role[0]?.name, 
        roleDisplayName: role[0]?.displayName 
      } 
    });
  } catch (error) {
    console.error('Update user API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, request }) => {
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
      return json({ success: false, error: 'Cannot deactivate your own account' }, { status: 400 });
    }

    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!existingUser.length) {
      return json({ success: false, error: 'User not found' }, { status: 404 });
    }

    await db
      .update(schema.users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      action: 'USER_DEACTIVATED',
      category: 'USERS',
      severity: 'WARNING',
      description: `User deactivated: ${existingUser[0].username}`,
      resourceType: 'USER',
      resourceId: String(userId)
    });

    return json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
