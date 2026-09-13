import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionFromRequest, logAudit } from '$lib/server/auth';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, request }) => {
  try {
    const sessionResult = await validateSessionFromRequest(request);
    
    if (!sessionResult.success || !sessionResult.user) {
      return json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const userId = parseInt(params.id);
    
    if (sessionResult.user?.id !== userId && !sessionResult.permissions?.includes('users.view')) {
      return json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const user = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        fullName: schema.users.fullName,
        email: schema.users.email,
        title: schema.users.title,
        licenseNumber: schema.users.licenseNumber,
        specialty: schema.users.specialty,
        department: schema.users.department,
        institution: schema.users.institution,
        designation: schema.users.designation,
        roleId: schema.users.roleId,
        roleName: schema.roles.name,
        roleDisplayName: schema.roles.displayName,
        signatureUrl: schema.users.signatureUrl,
        signatureName: schema.users.signatureName,
        isActive: schema.users.isActive,
        lastLoginAt: schema.users.lastLoginAt,
        createdAt: schema.users.createdAt
      })
      .from(schema.users)
      .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user.length) {
      return json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return json({ success: true, user: user[0] });
  } catch (error) {
    console.error('Get user API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const sessionResult = await validateSessionFromRequest(request);
    
    if (!sessionResult.success || !sessionResult.user) {
      return json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const userId = parseInt(params.id);
    const updates = await request.json();

    const isSelf = sessionResult.user?.id === userId;
    const canEditOthers = sessionResult.permissions?.includes('users.edit');

    if (!isSelf && !canEditOthers) {
      return json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const allowedFields = isSelf 
      ? ['fullName', 'email', 'title', 'specialty', 'department', 'institution', 'designation', 'signatureUrl', 'signatureName']
      : ['fullName', 'email', 'title', 'licenseNumber', 'specialty', 'department', 'institution', 'designation', 'roleId', 'isActive', 'signatureUrl', 'signatureName'];

    const filteredUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        if (key === 'roleId') {
          const ownerRole = await db
            .select()
            .from(schema.roles)
            .where(eq(schema.roles.name, 'owner'))
            .limit(1);
          
          if (ownerRole.length && updates[key] === ownerRole[0].id) {
            const existingOwner = await db
              .select()
              .from(schema.users)
              .where(eq(schema.users.roleId, ownerRole[0].id))
              .limit(1);
            
            if (existingOwner.length && existingOwner[0].id !== userId) {
              return json({ success: false, error: 'Only one user can have the System Owner role' }, { status: 400 });
            }
          }
        }
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    filteredUpdates.updatedAt = new Date();

    const oldUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    await db
      .update(schema.users)
      .set(filteredUpdates)
      .where(eq(schema.users.id, userId));

    await logAudit({
      userId: sessionResult.user?.id,
      username: sessionResult.user?.username,
      action: 'USER_UPDATED',
      category: 'USERS',
      severity: 'INFO',
      resourceType: 'USER',
      resourceId: String(userId),
      description: `User ${oldUser[0]?.username} updated`,
      oldValue: oldUser[0] ? { fullName: oldUser[0].fullName, email: oldUser[0].email } : null,
      newValue: filteredUpdates
    });

    return json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, request }) => {
  try {
    const sessionResult = await validateSessionFromRequest(request);
    
    if (!sessionResult.success || !sessionResult.user) {
      return json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    if (!sessionResult.permissions?.includes('users.delete')) {
      return json({ success: false, error: 'Only System Owner can permanently delete users' }, { status: 403 });
    }

    const userId = parseInt(params.id);

    if (sessionResult.user?.id === userId) {
      return json({ success: false, error: 'Cannot delete your own account' }, { status: 400 });
    }

    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user.length) {
      return json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user[0].isActive) {
      return json({ success: false, error: 'User must be deactivated before permanent deletion' }, { status: 400 });
    }

    if (user[0].deletedAt) {
      return json({ success: false, error: 'User is already deleted' }, { status: 400 });
    }

    await db
      .update(schema.users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    await db
      .delete(schema.sessions)
      .where(eq(schema.sessions.userId, userId));

    await logAudit({
      userId: sessionResult.user?.id,
      username: sessionResult.user?.username,
      action: 'USER_DELETED',
      category: 'USERS',
      severity: 'CRITICAL',
      resourceType: 'USER',
      resourceId: String(userId),
      description: `User ${user[0].username} permanently deleted by System Owner`
    });

    return json({ success: true, message: 'User permanently deleted' });
  } catch (error) {
    console.error('Delete user API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
