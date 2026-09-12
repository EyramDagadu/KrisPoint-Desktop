import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomBytes } from 'crypto';

export const POST: RequestHandler = async () => {
  if (process.env.ENCRYPTION_KEY || process.env.SOLO_ENCRYPTION_KEY) {
    return json({ 
      success: false, 
      error: 'Encryption key is already configured' 
    }, { status: 400 });
  }

  const key = randomBytes(32).toString('hex');
  
  return json({
    success: true,
    key
  });
};
