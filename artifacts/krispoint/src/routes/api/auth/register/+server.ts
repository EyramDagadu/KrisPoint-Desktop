import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { register, validateSession } from '$lib/server/auth';
import { db, schema } from '$lib/server/db';
import { count, eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let createdBy: number | undefined;
    let isFirstUser = false;
    
    const userCount = await db.select({ count: count() }).from(schema.users);
    isFirstUser = (userCount[0]?.count || 0) === 0;

    // Solo is deliberately a single-owner workstation.  Do not allow the
    // normal Hospital administrator flow to create additional accounts.
    if (process.env.VITE_KRISPOINT_EDITION === 'solo' && !isFirstUser) {
      return json({
        success: false,
        error: 'This Solo workspace already has an owner. Additional users are not supported.'
      }, { status: 403 });
    }
    
    if (token) {
      const sessionResult = await validateSession(token);
      if (sessionResult.success && sessionResult.user) {
        createdBy = sessionResult.user.id;
        
        if (!sessionResult.permissions?.includes('users.create')) {
          return json({ success: false, error: 'Insufficient permissions to create users' }, { status: 403 });
        }
      }
    } else if (!isFirstUser) {
      return json({ 
        success: false, 
        error: 'Authentication required. Only the first user can self-register.' 
      }, { status: 401 });
    }

    const userData = await request.json();

    if (!userData.username || !userData.password || !userData.fullName) {
      return json({ 
        success: false, 
        error: 'Username, password, and full name are required' 
      }, { status: 400 });
    }
    
    if (isFirstUser) {
      const ownerRole = await db
        .select()
        .from(schema.roles)
        .where(eq(schema.roles.name, 'owner'))
        .limit(1);
      
      if (ownerRole.length) {
        userData.roleId = ownerRole[0].id;
      }
    }
    
    if (!userData.roleId) {
      return json({ 
        success: false, 
        error: 'Role is required' 
      }, { status: 400 });
    }

    if (!isFirstUser && userData.roleId) {
      const ownerRole = await db
        .select()
        .from(schema.roles)
        .where(eq(schema.roles.name, 'owner'))
        .limit(1);
      
      if (ownerRole.length && userData.roleId === ownerRole[0].id) {
        const existingOwner = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.roleId, ownerRole[0].id))
          .limit(1);
        
        if (existingOwner.length) {
          return json({ success: false, error: 'Only one user can have the System Owner role' }, { status: 400 });
        }
      }
    }

    if (userData.password.length < 8) {
      return json({ 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 });
    }

    const result = await register({
      ...userData,
      createdBy
    });

    if (!result.success) {
      return json(result, { status: 400 });
    }

    // register() function handles audit logging internally
    return json(result, { status: 201 });
  } catch (error) {
    console.error('Registration API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
