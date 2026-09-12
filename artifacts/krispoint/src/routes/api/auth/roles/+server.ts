import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRoles } from '$lib/server/auth';

export const GET: RequestHandler = async () => {
  try {
    const roles = await getRoles();
    const visibleRoles = process.env.VITE_KRISPOINT_EDITION === 'solo'
      ? roles.filter(role => role.name === 'owner')
      : roles;
    return json({ success: true, roles: visibleRoles, singleOwner: process.env.VITE_KRISPOINT_EDITION === 'solo' });
  } catch (error) {
    console.error('Get roles API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
