import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionFromRequest } from '$lib/server/auth';
import {
  aiLimiter,
  checkClinicalSafety,
  checkImpressionSafety,
  GroqPolishProvider,
  MAX_JSON_BYTES,
  MAX_REPORT_BYTES,
  MAX_TEMPLATE_BYTES
} from '$lib/server/aiPolish';
import { verifyAiLicense } from '$lib/server/aiLicense';
import { findExplicitIdentifiersInRequest } from '../../../../../../api-server/src/policy.mjs';
import { ByoPolishProvider, resolveByoConfig } from '$lib/server/aiByo';

const managedProvider = new GroqPolishProvider();
const isSolo = process.env.VITE_KRISPOINT_EDITION === 'solo';
const MAX_PROXY_RESPONSE_BYTES = MAX_JSON_BYTES;

function response(data: unknown, status = 200) {
  return json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

function sameOrigin(request: Request, origin: string): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;

  const requestOrigin = request.headers.get('origin');
  if (!requestOrigin) return false;

  const configuredOrigin = process.env.KRISPOINT_APP_ORIGIN;
  if (configuredOrigin) return requestOrigin === configuredOrigin;
  if (requestOrigin === origin) return true;

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (forwardedHost && forwardedProto &&
      requestOrigin === `${forwardedProto}://${forwardedHost}`) {
    return true;
  }

  // Browsers set this header and do not let page scripts forge it. This keeps
  // CSRF protection intact when a trusted reverse proxy rewrites host details.
  return fetchSite === 'same-origin';
}

function serverProviderReady(): boolean {
  if (isSolo) {
    return process.env.KRISPOINT_REMOTE_AI_ENABLED?.toLowerCase() !== 'false' &&
      Boolean(process.env.KRISPOINT_AI_GATEWAY_URL?.trim());
  }
  return (process.env.AI_PROVIDER || 'groq') === 'groq' && Boolean(process.env.GROQ_API_KEY);
}

async function readBoundedResponse(response: Response, maxBytes: number): Promise<string> {
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

async function proxyToHostedGateway(request: Request, body: Uint8Array): Promise<Response> {
  const configured = process.env.KRISPOINT_AI_GATEWAY_URL?.trim();
  if (!configured) throw new Error('Hosted AI gateway is not configured');
  let baseUrl: URL;
  try {
    baseUrl = new URL(configured);
  } catch {
    throw new Error('Hosted AI gateway URL is invalid');
  }
  if (baseUrl.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new Error('Hosted AI gateway must use HTTPS');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35_000);
  const abort = () => controller.abort();
  request.signal.addEventListener('abort', abort, { once: true });
  try {
    const gatewayUrl = new URL('/v1/polish', baseUrl);
    const gatewayResponse = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body,
      signal: controller.signal
    });
    const text = await readBoundedResponse(gatewayResponse, MAX_PROXY_RESPONSE_BYTES);
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error('Hosted AI gateway returned invalid JSON');
    }
    if (!gatewayResponse.ok) {
      const gatewayError = payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error?: unknown }).error || 'Unknown gateway error')
        : 'Unknown gateway error';
      console.warn('Hosted AI gateway rejected request', {
        status: gatewayResponse.status,
        error: gatewayError
      });
    }
    return response(payload, gatewayResponse.status);
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', abort);
  }
}

const byoProvider = new ByoPolishProvider();

export const POST: RequestHandler = async ({ request, url }) => {
  if (!sameOrigin(request, url.origin)) {
    return response({ success: false, error: 'Same-origin request required' }, 403);
  }
  const session = await validateSessionFromRequest(request);
  if (!session.success || !session.user) {
    return response({ success: false, error: 'Authentication required' }, 401);
  }

  let release: (() => void) | undefined;
  try {
    release = aiLimiter.acquire(session.user.id);
    const length = Number(request.headers.get('content-length') || 0);
    if (length > MAX_JSON_BYTES) {
      return response({ success: false, error: 'Request is too large' }, 413);
    }
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.byteLength > MAX_JSON_BYTES) {
      return response({ success: false, error: 'Request is too large' }, 413);
    }
    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch {
      return response({ success: false, error: 'Invalid JSON request' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return response({ success: false, error: 'Invalid request' }, 400);
    }
    const input = body as Record<string, unknown>;
    const action = input.action === undefined ? 'polish' : input.action;
    if (action !== 'polish' && action !== 'impression') {
      return response({ success: false, error: 'Unsupported AI action' }, 400);
    }
    const requestedProvider = typeof input.providerMode === 'string' ? input.providerMode : null;
    if (!requestedProvider) {
      return response({
        success: false,
        error: 'AI provider mode is required',
        code: 'PROVIDER_MISMATCH'
      }, 400);
    }
    if (!['hosted', 'byo'].includes(requestedProvider)) {
      return response({
        success: false,
        error: 'The selected provider cannot use the hosted AI route',
        code: 'PROVIDER_MISMATCH'
      }, 409);
    }
    if (isSolo && requestedProvider !== 'hosted') {
      return response({
        success: false,
        error: 'Solo edition only permits the hosted KrisPoint AI gateway',
        code: 'PROVIDER_MISMATCH'
      }, 409);
    }
    if (requestedProvider === 'hosted' && !isSolo && !serverProviderReady()) {
      return response({
        success: false,
        error: 'The managed AI provider is not configured',
        code: 'PROVIDER_NOT_READY'
      }, 503);
    }
    const byoConfig = requestedProvider === 'byo' ? resolveByoConfig() : null;
    if (requestedProvider === 'byo' && !byoConfig) {
      return response({
        success: false,
        error: 'The server-managed BYO provider is not configured',
        code: 'PROVIDER_NOT_READY'
      }, 503);
    }
    if (isSolo) {
      if (process.env.KRISPOINT_REMOTE_AI_ENABLED?.toLowerCase() === 'false') {
        return response({
          success: false,
          error: 'Remote AI is disabled by policy; no report data was transmitted'
        }, 422);
      }
      if (process.env.KRISPOINT_AI_ALLOW_IDENTIFIERS?.toLowerCase() !== 'true') {
        const identifiers = findExplicitIdentifiersInRequest(input);
        if (identifiers.length) {
          return response({
            success: false,
            error: 'Report contains explicit patient identifiers; remove them before using hosted AI',
            policy: 'IDENTIFIERS_BLOCKED'
          }, 422);
        }
      }
      return await proxyToHostedGateway(request, bytes);
    }
    // Verify the signed licence and authority status before touching report
    // or template fields. Only metadata is sent to the licensing authority.
    await verifyAiLicense(input.licenseEnvelope || input.license || input.licence);
    if (process.env.KRISPOINT_AI_ALLOW_IDENTIFIERS?.toLowerCase() !== 'true') {
      const identifiers = findExplicitIdentifiersInRequest(input);
      if (identifiers.length) {
        return response({
          success: false,
          error: 'Report contains explicit patient identifiers; remove them before using AI',
          policy: 'IDENTIFIERS_BLOCKED'
        }, 422);
      }
    }

    const report = input.report ?? input.reportText ?? input.content;
    let template = input.template ?? input.templateText;
    const modality = typeof input.modality === 'string' ? input.modality.slice(0, 100) : '';
    const bodyRegion = typeof input.bodyRegion === 'string' ? input.bodyRegion.slice(0, 100) : '';
    const indication = typeof input.indication === 'string' ? input.indication.slice(0, 100) : '';
    // Keep the endpoint compatible with the template records used by the
    // editor without allowing arbitrary client objects into the provider.
    if (template && typeof template === 'object' && !Array.isArray(template)) {
      if (Buffer.byteLength(JSON.stringify(template), 'utf8') > MAX_TEMPLATE_BYTES) {
        return response({ success: false, error: 'Template is too large' }, 413);
      }
      const templateRecord = template as Record<string, unknown>;
      const templateText = typeof templateRecord.content === 'string' && templateRecord.content.trim()
        ? templateRecord.content
        : [
            templateRecord.comparisonHtml,
            templateRecord.techniqueHtml,
            templateRecord.findingsHtml,
            templateRecord.impressionHtml
          ].filter(part => typeof part === 'string' && part.trim()).join('\n');
      template = typeof templateText === 'string' ? templateText : '';
    }
    if (typeof report !== 'string' || !report.trim()) {
      return response({ success: false, error: 'Report text is required' }, 400);
    }
    if (Buffer.byteLength(report, 'utf8') > MAX_REPORT_BYTES) {
      return response({ success: false, error: 'Report is too large' }, 413);
    }
    if (template !== undefined && (typeof template !== 'string' ||
      Buffer.byteLength(template, 'utf8') > MAX_TEMPLATE_BYTES)) {
      return response({ success: false, error: 'Template is too large or invalid' }, 413);
    }

    const providerInput = {
      report,
      template: template as string | undefined,
      modality,
      bodyRegion,
      indication,
      action
    };
    const polished = requestedProvider === 'byo'
      ? await byoProvider.polish(providerInput, byoConfig!, request.signal)
      : await managedProvider.polish(providerInput, request.signal);
    const warnings = action === 'impression'
      ? checkImpressionSafety(report, polished)
      : checkClinicalSafety(report, polished);
    if (warnings.length) {
      return response({
        success: false,
        accepted: false,
        error: 'The proposed edit contains blocking clinical safety warnings',
        warnings,
        candidate: polished
      }, 422);
    }
    return response({
      success: true,
      accepted: true,
      polishedText: polished,
      proposedContent: polished,
      warnings: []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('rate limit') || message.includes('concurrency limit')) {
      return response({ success: false, error: message }, 429);
    }
    if (message.includes('License') || message.includes('license') || message.includes('AI polish')) {
      return response({ success: false, error: message }, 403);
    }
    if (message.includes('aborted') || message.includes('timeout')) {
      return response({ success: false, error: 'AI polish timed out; no changes were made' }, 504);
    }
    return response({ success: false, error: 'AI polish is temporarily unavailable; no changes were made' }, 503);
  } finally {
    release?.();
  }
};