import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { count } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
  try {
    const result = await db
      .select({ count: count() })
      .from(schema.users);
    
    const userCount = result[0]?.count || 0;
    
    return json({ 
      success: true, 
      hasUsers: userCount > 0,
      userCount,
      edition: process.env.VITE_KRISPOINT_EDITION === 'solo' ? 'solo' : 'hospital',
      singleOwner: process.env.VITE_KRISPOINT_EDITION === 'solo'
    });
  } catch (error) {
    console.error('Check users API error:', error);
    return json({ success: false, error: 'Internal server error', hasUsers: false }, { status: 500 });
  }
};
