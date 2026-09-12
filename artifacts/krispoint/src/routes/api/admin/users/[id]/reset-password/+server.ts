import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionFromRequest, logAudit } from '$lib/server/auth';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const sessionResult = await validateSessionFromRequest(request);
    
    if (!sessionResult.success || !sessionResult.user) {
      return json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const hasPermission = sessionResult.permissions?.includes('users.edit') || 
                          sessionResult.permissions?.includes('users.manage');
    if (!hasPermission) {
      return json({ success: false, error: 'Only administrators can reset passwords' }, { status: 403 });
    }

    const userId = parseInt(params.id);
    
    if (sessionResult.user.id === userId) {
      return json({ success: false, error: 'Cannot reset your own password this way. Use the change password feature in Settings.' }, { status: 400 });
    }

    const [targetUser] = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        fullName: schema.users.fullName,
        roleId: schema.users.roleId
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!targetUser) {
      return json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const [targetRole] = await db
      .select({ name: schema.roles.name })
      .from(schema.roles)
      .where(eq(schema.roles.id, targetUser.roleId))
      .limit(1);

    if (targetRole?.name === 'owner') {
      const [adminRole] = await db
        .select({ name: schema.roles.name })
        .from(schema.roles)
        .where(eq(schema.roles.id, sessionResult.user.roleId))
        .limit(1);
      
      if (adminRole?.name !== 'owner') {
        return json({ success: false, error: 'Only the System Owner can reset another System Owner\'s password' }, { status: 403 });
      }
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    await db
      .update(schema.users)
      .set({
        password: hashedPassword,
        mustChangePassword: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastPasswordChangeAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, userId));

    await db
      .delete(schema.sessions)
      .where(eq(schema.sessions.userId, userId));

    await logAudit({
      userId: sessionResult.user.id,
      username: sessionResult.user.username,
      action: 'PASSWORD_RESET_BY_ADMIN',
      category: 'SECURITY',
      severity: 'WARNING',
      resourceType: 'USER',
      resourceId: String(userId),
      description: `Password reset by admin for user ${targetUser.username} (${targetUser.fullName}). User must change password on next login.`
    });

    return json({ 
      success: true, 
      temporaryPassword,
      message: `Password reset successful. The user must change their password on next login.`
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return json({ success: false, error: 'Failed to reset password' }, { status: 500 });
  }
};
