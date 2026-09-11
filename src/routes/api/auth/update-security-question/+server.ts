import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { validateSessionFromRequest, logAudit } from '$lib/server/auth';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const authResult = await validateSessionFromRequest(request);
        
        if (!authResult.success || !authResult.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const { securityQuestion, securityAnswer } = await request.json();

        if (!securityQuestion || !securityAnswer) {
            return json({ success: false, error: 'Security question and answer are required' }, { status: 400 });
        }

        if (securityQuestion.trim().length < 5) {
            return json({ success: false, error: 'Security question must be at least 5 characters' }, { status: 400 });
        }

        if (securityAnswer.trim().length < 2) {
            return json({ success: false, error: 'Security answer must be at least 2 characters' }, { status: 400 });
        }

        const normalizedAnswer = securityAnswer.trim().toLowerCase();
        const hashedAnswer = await bcrypt.hash(normalizedAnswer, 10);

        await db.update(schema.users)
            .set({ 
                securityQuestion: securityQuestion.trim(),
                securityAnswer: hashedAnswer,
                updatedAt: new Date()
            })
            .where(eq(schema.users.id, authResult.user.id));

        // Audit log for security question update
        await logAudit({
            userId: authResult.user.id,
            username: authResult.user.username,
            userRole: authResult.user.roleName,
            action: 'SECURITY_QUESTION_UPDATED',
            category: 'SECURITY',
            severity: 'INFO',
            resourceType: 'USER',
            resourceId: String(authResult.user.id),
            description: 'User updated their security question'
        });

        return json({ success: true, message: 'Security question updated successfully' });

    } catch (error) {
        console.error('Update security question error:', error);
        return json({ success: false, error: 'An error occurred' }, { status: 500 });
    }
};
