import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  const expected = process.env.KRISPOINT_LAUNCH_SECRET;
  if (!expected || request.headers.get('x-krispoint-launch-secret') !== expected) {
    return json({ ready: false }, { status: 404 });
  }
  return json({ ready: true });
};