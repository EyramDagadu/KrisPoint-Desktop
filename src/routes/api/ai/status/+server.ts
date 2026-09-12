import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionFromRequest } from '$lib/server/auth';

const isSolo = process.env.VITE_KRISPOINT_EDITION === 'solo';
const VALID_MODES = new Set(['hosted', 'byo', 'ollama', 'disabled']);

function result(data: unknown, status = 200) {
  return json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

function sameOrigin(request: Request, origin: string): boolean {
  const expected = process.env.KRISPOINT_APP_ORIGIN || origin;
  const requestOrigin = request.headers.get('origin');
  return (!requestOrigin || requestOrigin === expected) &&
    request.headers.get('sec-fetch-site') !== 'cross-site';
}

async function boundedText(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error('AI gateway response is too large');
    }
    chunks.push(value);
  }
  const output = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(output);
}

async function hostedStatus(request: Request): Promise<Response> {
  if (process.env.KRISPOINT_REMOTE_AI_ENABLED?.toLowerCase() === 'false') {
    return result({ ready: false, status: 'not-ready', message: 'Remote AI is disabled by policy' });
  }
  const configured = process.env.KRISPOINT_AI_GATEWAY_URL?.trim();
  if (!configured) {
    return result({ ready: false, status: 'not-ready', message: 'Hosted AI gateway is not configured' }, 503);
  }
  let gatewayUrl: URL;
  try {
    gatewayUrl = new URL('/health', configured);
  } catch {
    return result({ ready: false, status: 'not-ready', message: 'Hosted AI gateway URL is invalid' }, 503);
  }
  if (gatewayUrl.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    return result({ ready: false, status: 'not-ready', message: 'Hosted AI gateway must use HTTPS' }, 503);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  const abort = () => controller.abort();
  request.signal.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetch(gatewayUrl, {
      method: 'GET',
      headers: { accept: 'application/json' },
      redirect: 'error',
      signal: controller.signal
    });
    if (!response.ok) {
      return result({ ready: false, status: 'not-ready', message: 'Hosted AI gateway is not ready' }, 503);
    }
    const payload = JSON.parse(await boundedText(response, 8_192)) as { ok?: unknown };
    if (payload.ok !== true) {
      return result({ ready: false, status: 'not-ready', message: 'Hosted AI gateway is not ready' }, 503);
    }
    return result({ ready: true, status: 'ready', message: 'Hosted AI gateway ready' });
  } catch {
    return result({ ready: false, status: 'not-ready', message: 'Hosted AI gateway is unavailable' }, 503);
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', abort);
  }
}

function byoReady(): boolean {
  const base = process.env.BYO_AI_BASE_URL?.trim();
  const key = process.env.BYO_AI_API_KEY?.trim();
  const model = process.env.BYO_AI_MODEL?.trim();
  if (!base || !key || !model) return false;
  try {
    const url = new URL('/v1/chat/completions', base);
    return process.env.NODE_ENV !== 'production' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const GET: RequestHandler = async ({ request, url }) => {
  if (!sameOrigin(request, url.origin)) {
    return result({ ready: false, error: 'Same-origin request required' }, 403);
  }
  const session = await validateSessionFromRequest(request);
  if (!session.success || !session.user) {
    return result({ ready: false, error: 'Authentication required' }, 401);
  }

  const requestedMode = url.searchParams.get('mode') ||
    request.headers.get('x-krispoint-ai-mode') || 'hosted';
  if (!VALID_MODES.has(requestedMode)) {
    return result({ ready: false, error: 'Unsupported AI provider mode' }, 400);
  }
  if (isSolo) {
    if (requestedMode !== 'hosted') {
      return result({
        ready: false,
        status: 'not-ready',
        message: 'Solo edition only permits the hosted KrisPoint AI gateway'
      }, 409);
    }
    return hostedStatus(request);
  }

  // Readiness is intentionally metadata-only. Provider names, model names,
  // and credential state are never returned to the browser.
  const ready = requestedMode === 'hosted'
    ? (process.env.AI_PROVIDER || 'groq') === 'groq' && Boolean(process.env.GROQ_API_KEY)
    : requestedMode === 'byo'
      ? byoReady()
      : false;
  const message = requestedMode === 'ollama'
    ? 'Private Ollama readiness is checked by the local client'
    : requestedMode === 'disabled'
      ? 'AI is disabled in settings'
      : ready
        ? requestedMode === 'byo' ? 'BYO AI provider ready' : 'Managed AI provider ready'
        : requestedMode === 'byo' ? 'BYO AI provider is not configured' : 'Managed AI provider is not configured';
  return result({
    ready,
    status: ready ? 'ready' : 'not-ready',
    message
  }, ready ? 200 : 503);
};