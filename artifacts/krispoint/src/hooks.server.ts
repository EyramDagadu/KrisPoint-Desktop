import 'dotenv/config';
import type { Handle } from '@sveltejs/kit';
import { logEnvironmentStatus } from '$lib/server/validateEnvironment';
import { ensurePermissionsSync, seedDatabase, validateSystemTemplatesAndMacros } from '$lib/server/seed';

logEnvironmentStatus();

const isSolo = process.env.VITE_KRISPOINT_EDITION === 'solo';
const parentPid = Number(process.env.KRISPOINT_PARENT_PID);
if (isSolo && Number.isInteger(parentPid) && parentPid > 0) {
  const parentWatch = setInterval(() => {
    try {
      process.kill(parentPid, 0);
    } catch {
      process.exit(0);
    }
  }, 2000);
  parentWatch.unref();
}
const databaseReady = isSolo
  ? seedDatabase()
  : ensurePermissionsSync();

// Solo needs its owner role before first-run registration. Hospital retains
// the existing non-destructive permission sync behavior.
databaseReady.then(result => {
  if (result.success && result.synced && result.synced > 0) {
    console.log(`🔐 Permission sync: Added ${result.synced} missing role-permission links`);
  }
}).catch(err => {
  console.error('Permission sync error:', err);
});

// Validate system templates and macros on startup
validateSystemTemplatesAndMacros().then(result => {
  if (result.valid) {
    console.log(`📋 System content: ${result.templatesCount} templates, ${result.macrosCount} macros available`);
  }
}).catch(err => {
  console.error('Template validation error:', err);
});

const LICENSE_SERVER_URL = 'http://localhost:3001';

export const handle: Handle = async ({ event, resolve }) => {
  const launchSecret = process.env.KRISPOINT_LAUNCH_SECRET;
  const appOrigin = process.env.KRISPOINT_APP_ORIGIN;
  const origin = event.request.headers.get('origin');
  const url = event.url;

  if (isSolo && appOrigin && origin && origin !== appOrigin) {
    return new Response('Forbidden', { status: 403 });
  }

  if (isSolo && launchSecret && event.url.pathname !== '/api/health/solo') {
    const bootstrapToken = event.url.searchParams.get('desktop_token');
    if (bootstrapToken === launchSecret) {
      const cleanUrl = new URL(event.url);
      cleanUrl.searchParams.delete('desktop_token');
      return new Response(null, {
        status: 303,
        headers: {
          location: `${cleanUrl.pathname}${cleanUrl.search}`,
          'set-cookie': `krispoint_launch=${launchSecret}; Path=/; HttpOnly; SameSite=Strict`
        }
      });
    }
    if (event.cookies.get('krispoint_launch') !== launchSecret) {
      return new Response('Not found', { status: 404 });
    }
  }

  if (url.pathname.startsWith('/license-server/') || url.pathname === '/license-server') {
    const targetPath = url.pathname.replace('/license-server', '') || '/';
    const targetUrl = `${LICENSE_SERVER_URL}${targetPath}${url.search}`;

    try {
      const headers: Record<string, string> = {
        'host': 'localhost:3001',
      };
      const contentType = event.request.headers.get('content-type');
      if (contentType) headers['content-type'] = contentType;
      const authorization = event.request.headers.get('authorization');
      if (authorization) headers['authorization'] = authorization;
      const paystackSig = event.request.headers.get('x-paystack-signature');
      if (paystackSig) headers['x-paystack-signature'] = paystackSig;

      const fetchOptions: RequestInit = {
        method: event.request.method,
        headers,
        redirect: 'manual',
      };

      if (['POST', 'PUT', 'PATCH'].includes(event.request.method)) {
        fetchOptions.body = await event.request.text();
      }

      const proxyResponse = await fetch(targetUrl, fetchOptions);
      const responseHeaders = new Headers();
      proxyResponse.headers.forEach((value, key) => {
        if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
          responseHeaders.set(key, value);
        }
      });

      if (origin) {
        responseHeaders.set('Access-Control-Allow-Origin', origin);
        responseHeaders.set('Access-Control-Allow-Credentials', 'true');
      }

      return new Response(proxyResponse.body, {
        status: proxyResponse.status,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response('License server unavailable', { status: 502 });
    }
  }

  await databaseReady;

  if (isSolo && isCollaborationOnlyApi(event.url.pathname)) {
    return new Response('Not found', { status: 404 });
  }
  if (isSolo && event.url.pathname === '/api/reports') {
    const action = event.url.searchParams.get('action');
    if (action && ['submit', 'return', 'request-review', 'addendum-submit', 'addendum-return', 'presence'].includes(action)) {
      return new Response('Not found', { status: 404 });
    }
  }

  // Handle preflight OPTIONS requests for CORS
  if (event.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isSolo ? (appOrigin || '') : (origin || '*'),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  const response = await resolve(event);
  
  // Add CORS headers to all responses for LAN access
  if (origin && (!isSolo || origin === appOrigin)) {
    response.headers.set('Access-Control-Allow-Origin', isSolo ? appOrigin! : origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return response;
};

function isCollaborationOnlyApi(pathname: string): boolean {
  // Solo creates a local worklist row alongside each new report so the shared
  // report-creation endpoint must remain available. Other worklist operations
  // are Hospital-only collaboration features.
  if (pathname === '/api/worklist/create-with-report') {
    return false;
  }
  return pathname.startsWith('/api/chat') ||
    pathname.startsWith('/api/worklist') ||
    pathname.startsWith('/api/admin/users') ||
    pathname === '/api/reports/pending-reviews' ||
    pathname === '/api/reports/returned' ||
    /^\/api\/reports\/\d+\/(submit|return|request-review)$/.test(pathname) ||
    /^\/api\/reports\/\d+\/addendums\/\d+\/(submit|return)$/.test(pathname);
}
