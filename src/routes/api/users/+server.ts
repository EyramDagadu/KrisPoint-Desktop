import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSession, getUsers } from '$lib/server/auth';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const sessionResult = await validateSession(token);
    
    if (!sessionResult.success) {
      return json(sessionResult, { status: 401 });
    }

    if (!sessionResult.permissions?.includes('users.view')) {
      return json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const users = await getUsers();
    return json({ success: true, users });
  } catch (error) {
    console.error('Get users API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
