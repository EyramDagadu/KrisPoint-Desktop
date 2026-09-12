import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { validatePassword } from '$lib/server/passwordPolicy';
import { logAudit } from '$lib/server/auth';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { username, newPassword } = await request.json();

        if (!username || !newPassword) {
            return json({ success: false, error: 'Username and new password are required' }, { status: 400 });
        }

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return json({ success: false, error: passwordValidation.errors.join('. ') }, { status: 400 });
        }

        const user = await db.select({
            id: schema.users.id
        })
        .from(schema.users)
        .where(eq(schema.users.username, username.trim()))
        .limit(1);

        if (user.length === 0) {
            return json({ success: false, error: 'Username not found' }, { status: 404 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.update(schema.users)
            .set({ 
                password: hashedPassword,
                lastPasswordChangeAt: new Date(),
                mustChangePassword: false,
                failedLoginAttempts: 0,
                lockedUntil: null,
                updatedAt: new Date()
            })
            .where(eq(schema.users.id, user[0].id));

        await db.update(schema.sessions)
            .set({ 
                isValid: false,
                revokedAt: new Date(),
                revokedReason: 'Password reset'
            })
            .where(eq(schema.sessions.userId, user[0].id));

        // Audit log for password reset via security question
        await logAudit({
            userId: user[0].id,
            username: username.trim(),
            action: 'PASSWORD_RESET_COMPLETED',
            category: 'SECURITY',
            severity: 'WARNING',
            resourceType: 'USER',
            resourceId: String(user[0].id),
            description: 'Password reset via security question, all sessions invalidated'
        });

        return json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        return json({ success: false, error: 'An error occurred' }, { status: 500 });
    }
};
