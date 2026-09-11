import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUsers, register, validateSession, logAudit, getUserPermissions } from '$lib/server/auth';

async function checkAdminPermission(cookies: any): Promise<{ authorized: boolean; userId?: number; error?: string }> {
  const token = cookies.get('session_token');
  if (!token) {
    return { authorized: false, error: 'No session token' };
  }

  const session = await validateSession(token);
  
  if (!session.success || !session.user) {
    return { authorized: false, error: 'Invalid session' };
  }

  const permissions = session.permissions || [];
  if (!permissions.includes('users.manage')) {
    return { authorized: false, error: 'Insufficient permissions' };
  }

  return { authorized: true, userId: session.user.id };
}

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const authCheck = await checkAdminPermission(cookies);
    if (!authCheck.authorized) {
      return json({ success: false, error: authCheck.error }, { status: 403 });
    }

    const users = await getUsers();
    return json({ success: true, users });
  } catch (error) {
    console.error('Get users API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const authCheck = await checkAdminPermission(cookies);
    if (!authCheck.authorized) {
      return json({ success: false, error: authCheck.error }, { status: 403 });
    }

    const data = await request.json();
    
    if (!data.username || !data.password || !data.fullName || !data.roleId) {
      return json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await register({
      username: data.username,
      password: data.password,
      fullName: data.fullName,
      email: data.email,
      roleId: data.roleId,
      title: data.title,
      specialty: data.specialty,
      department: data.department,
      createdBy: authCheck.userId
    });

    if (!result.success) {
      return json({ success: false, error: result.error }, { status: 400 });
    }

    return json({ success: true, user: result.user });
  } catch (error) {
    console.error('Create user API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
