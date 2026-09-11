import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const token = cookies.get('session_token');

    if (!token) {
      return json({ success: false, error: 'No session token provided' }, { status: 401 });
    }

    const result = await validateSession(token);

    if (!result.success) {
      return json(result, { status: 401 });
    }

    return json(result);
  } catch (error) {
    console.error('Session validation API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
