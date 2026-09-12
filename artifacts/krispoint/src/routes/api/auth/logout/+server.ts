import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logout } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
  try {
    const token = cookies.get('session_token');

    if (!token) {
      return json({ success: false, error: 'No session token provided' }, { status: 400 });
    }

    // logout() function handles audit logging internally
    const result = await logout(token);
    
    cookies.delete('session_token', { path: '/' });
    cookies.delete('refresh_token', { path: '/' });
    
    return json(result);
  } catch (error) {
    console.error('Logout API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
