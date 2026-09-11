import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { login } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, getClientAddress, cookies }) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    const ipAddress = getClientAddress();
    const userAgent = request.headers.get('user-agent') || undefined;

    // login() function handles all audit logging internally
    const result = await login(username, password, ipAddress, userAgent);

    if (!result.success) {
      return json(result, { status: 401 });
    }

    if (result.session) {
      // For LAN/WiFi access over HTTP, we need permissive cookie settings
      // FORCE secure: false for hospital LAN deployments using HTTP
      // Set COOKIE_SECURE=true in production if using HTTPS
      const forceSecure = process.env.COOKIE_SECURE === 'true';
      
      cookies.set('session_token', result.session.token, {
        path: '/',
        httpOnly: true,
        secure: forceSecure,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24
      });

      cookies.set('refresh_token', result.session.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: forceSecure,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });
      
      console.log(`[Auth] Cookies set for session, secure=${forceSecure}, origin=${request.headers.get('origin') || 'none'}`);
    }

    const { session, ...resultWithoutTokens } = result;
    return json({
      ...resultWithoutTokens,
      session: session ? { expiresAt: session.expiresAt } : undefined
    });
  } catch (error) {
    console.error('Login API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
