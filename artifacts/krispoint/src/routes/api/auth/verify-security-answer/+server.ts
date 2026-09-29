import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createRecoveryProof } from '$lib/server/recoveryProof';
import { reserveRecoveryAttempt } from '$lib/server/recoveryAttempts';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { username, answer } = await request.json();

        if (typeof username !== 'string' || typeof answer !== 'string' || !username.trim() || !answer.trim() || username.length > 255 || answer.length > 500) {
            return json({ success: false, error: 'Username and answer are required' }, { status: 400 });
        }
        const user = await db.select({
            id: schema.users.id,
            password: schema.users.password,
            securityAnswer: schema.users.securityAnswer
        })
        .from(schema.users)
        .where(eq(schema.users.username, username.trim()))
        .limit(1);

        if (user.length === 0) {
            return json({ success: false, error: 'Username not found' }, { status: 404 });
        }

        if (!user[0].securityAnswer) {
            return json({ 
                success: false, 
                error: 'No security answer set for this account' 
            }, { status: 400 });
        }

        if (!await reserveRecoveryAttempt(user[0].id)) {
            return json({ success: false, error: 'Too many attempts. Please try again later.' }, { status: 429 });
        }

        const normalizedAnswer = answer.trim().toLowerCase();
        const isValid = await bcrypt.compare(normalizedAnswer, user[0].securityAnswer);

        if (!isValid) {
            return json({ success: false, error: 'Incorrect answer' }, { status: 401 });
        }

        return json({ success: true, recoveryToken: createRecoveryProof(user[0].id, user[0].password, user[0].securityAnswer) });

    } catch (error) {
        console.error('Verify security answer error:', error);
        return json({ success: false, error: 'An error occurred' }, { status: 500 });
    }
};
