import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { validateSessionFromRequest, logAudit } from '$lib/server/auth';
import { validatePassword } from '$lib/server/passwordPolicy';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const authResult = await validateSessionFromRequest(request);
        
        if (!authResult.success || !authResult.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return json({ success: false, error: 'Current password and new password are required' }, { status: 400 });
        }

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return json({ success: false, error: passwordValidation.errors.join('. ') }, { status: 400 });
        }

        const user = await db.select({
            id: schema.users.id,
            password: schema.users.password
        })
        .from(schema.users)
        .where(eq(schema.users.id, authResult.user.id))
        .limit(1);

        if (user.length === 0) {
            return json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user[0].password);
        
        if (!isCurrentPasswordValid) {
            return json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await db.update(schema.users)
            .set({ 
                password: hashedNewPassword,
                lastPasswordChangeAt: new Date(),
                mustChangePassword: false,
                updatedAt: new Date()
            })
            .where(eq(schema.users.id, authResult.user.id));

        // Audit log for password change
        await logAudit({
            userId: authResult.user.id,
            username: authResult.user.username,
            userRole: authResult.user.roleName,
            action: 'PASSWORD_CHANGED',
            category: 'SECURITY',
            severity: 'INFO',
            resourceType: 'USER',
            resourceId: String(authResult.user.id),
            description: 'User changed their password'
        });

        return json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        return json({ success: false, error: 'An error occurred' }, { status: 500 });
    }
};
