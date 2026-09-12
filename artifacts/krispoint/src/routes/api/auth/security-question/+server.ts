import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { username } = await request.json();

        if (!username) {
            return json({ success: false, error: 'Username is required' }, { status: 400 });
        }

        const user = await db.select({
            securityQuestion: schema.users.securityQuestion
        })
        .from(schema.users)
        .where(eq(schema.users.username, username.trim()))
        .limit(1);

        if (user.length === 0) {
            return json({ success: false, error: 'Username not found' }, { status: 404 });
        }

        if (!user[0].securityQuestion) {
            return json({ 
                success: false, 
                error: 'No security question set for this account. Please contact an administrator.' 
            }, { status: 400 });
        }

        return json({ 
            success: true, 
            question: user[0].securityQuestion 
        });

    } catch (error) {
        console.error('Get security question error:', error);
        return json({ success: false, error: 'An error occurred' }, { status: 500 });
    }
};
