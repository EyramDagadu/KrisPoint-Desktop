import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { validatePassword } from '$lib/server/passwordPolicy';
import { logAudit } from '$lib/server/auth';
import { verifyRecoveryProof } from '$lib/server/recoveryProof';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { username, newPassword, recoveryToken } = await request.json();

        if (typeof username !== 'string' || typeof newPassword !== 'string' || !username.trim() || !newPassword || typeof recoveryToken !== 'string') {
            return json({ success: false, error: 'A verified recovery answer is required to reset the password' }, { status: 400 });
        }

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return json({ success: false, error: passwordValidation.errors.join('. ') }, { status: 400 });
        }

        const user = await db.select({
            id: schema.users.id,
            password: schema.users.password,
            securityAnswer: schema.users.securityAnswer
        })
        .from(schema.users)
        .where(eq(schema.users.username, username.trim()))
        .limit(1);

        if (user.length === 0 || !user[0].securityAnswer ||
            !verifyRecoveryProof(recoveryToken, user[0].id, user[0].password, user[0].securityAnswer)) {
            return json({ success: false, error: 'Recovery verification expired or invalid. Please answer the security question again.' }, { status: 401 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const updated = await db.update(schema.users)
            .set({ 
                password: hashedPassword,
                lastPasswordChangeAt: new Date(),
                mustChangePassword: false,
                failedLoginAttempts: 0,
                lockedUntil: null,
                updatedAt: new Date()
            })
            .where(and(
                eq(schema.users.id, user[0].id),
                eq(schema.users.password, user[0].password),
                eq(schema.users.securityAnswer, user[0].securityAnswer)
            ))
            .returning({ id: schema.users.id });
        if (!updated.length) {
            return json({ success: false, error: 'Recovery verification expired or invalid. Please answer the security question again.' }, { status: 401 });
        }

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
