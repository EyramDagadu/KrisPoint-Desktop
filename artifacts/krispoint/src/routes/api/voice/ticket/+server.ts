import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSession } from '$lib/server/auth';
import { issueVoiceTicket } from '$lib/server/voiceTicket.js';

export const GET: RequestHandler = async ({ cookies }) => {
  if (process.env.VITE_KRISPOINT_EDITION === 'solo') {
    return json({ success: false, error: 'Voice tickets are unavailable in Solo edition' }, { status: 404 });
  }

  const sessionToken = cookies.get('session_token');
  if (!sessionToken) {
    return json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const session = await validateSession(sessionToken);
  if (!session.success) {
    return json({ success: false, error: session.error }, { status: 401 });
  }

  try {
    return json({ ticket: issueVoiceTicket() });
  } catch {
    // Do not disclose configuration details or the signing key.
    return json({ success: false, error: 'Voice service is unavailable' }, { status: 503 });
  }
};