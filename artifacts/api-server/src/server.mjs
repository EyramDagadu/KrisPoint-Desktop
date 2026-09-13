import { createPublicKey, verify as verifySignature } from 'node:crypto';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { findExplicitIdentifiersInRequest } from './policy.mjs';
import { checkClinicalSafety, checkImpressionSafety } from './safety.mjs';

export const MAX_REPORT_BYTES = 120_000;
export const MAX_TEMPLATE_BYTES = 50_000;
export const MAX_JSON_BYTES = 512_000;
export const AI_TIMEOUT_MS = 30_000;
const LICENSE_TIMEOUT_MS = 5_000;
const MAX_LICENSE_FIELD = 16_384;
const PROMPT = `You are a radiology report drafting assistant. Produce a clear, complete, professional report
using the source text, indication, modality, body region, and selected template.
Return JSON with exactly this shape: {"polishedText":"string","changes":["string"]}.
Use the selected template's section order, headings, formatting, and normal-report language. You may expand
clinical shorthand, populate a full normal template from an explicit normal-study statement, improve
organization, and draft an impression supported by the supplied context. Preserve explicit abnormalities,
measurements, units, laterality, negation, dates, and qualifications from the source. Do not contradict those
explicit details. The output is a proposal for mandatory clinician review, not a finalized report.`;
const IMPRESSION_PROMPT = `You are a radiologist drafting only the IMPRESSION from the supplied report facts.
Return JSON with exactly this shape: {"polishedText":"string","changes":["string"]}.
Write a concise impression using only facts explicitly present in the report and indication.
Never invent, infer, or add a diagnosis, recommendation, comparison, or certainty. Preserve every
measurement, unit, laterality, negation, anatomy, and degree of certainty that appears in the source.
Do not repeat the full findings or technique. If a safe impression cannot be derived, return the
source report unchanged.`;

function decodeBase64(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value) ||
      value.length === 0 || value.length % 4 !== 0) throw new Error('Invalid license encoding');
  const decoded = Buffer.from(value, 'base64');
  if (!decoded.length) throw new Error('Invalid license encoding');
  return decoded;
}

function getPublicKey(value) {
  if (!value) throw new Error('License verification is not configured');
  if (value.includes('BEGIN PUBLIC KEY')) return createPublicKey(value);
  const raw = decodeBase64(value);
  if (raw.length === 32) {
    return createPublicKey({
      key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]),
      format: 'der',
      type: 'spki'
    });
  }
  return createPublicKey({ key: raw, format: 'der', type: 'spki' });
}

function parseLicense(envelope, publicKey) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw new Error('A signed license envelope is required');
  }
  const { key, machineId, payload, signature } = envelope;
  if (typeof key !== 'string' || !key || key.length > MAX_LICENSE_FIELD ||
      typeof machineId !== 'string' || !machineId || machineId.length > MAX_LICENSE_FIELD ||
      typeof payload !== 'string' || typeof signature !== 'string' ||
      payload.length > MAX_LICENSE_FIELD || signature.length > MAX_LICENSE_FIELD) {
    throw new Error('Invalid license envelope');
  }
  const message = decodeBase64(payload);
  const signed = decodeBase64(signature);
  if (signed.length !== 64 || !verifySignature(null, message, publicKey, signed)) {
    throw new Error('Invalid license signature');
  }
  let parsed;
  try {
    parsed = JSON.parse(message.toString('utf8'));
  } catch {
    throw new Error('Invalid signed license payload');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) ||
      parsed.key !== key || typeof parsed.expiresAt !== 'string' ||
      !Number.isFinite(Date.parse(parsed.expiresAt)) || Date.parse(parsed.expiresAt) <= Date.now() ||
      !Array.isArray(parsed.features) || !parsed.features.includes('ai_polish')) {
    throw new Error('License is invalid or AI polish is not enabled');
  }
  return { licenseKey: key, machineId, payload, signature };
}

async function readResponse(response, maxBytes) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error('Response exceeded its size limit');
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

async function validateLicense(envelope, config) {
  const metadata = parseLicense(envelope, config.publicKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LICENSE_TIMEOUT_MS);
  try {
    const response = await config.fetch(`${config.licenseServerUrl}/api/license/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      redirect: 'error',
      // Never add report/template/request fields to this object.
      body: JSON.stringify(metadata),
      signal: controller.signal
    });
    if (!response.ok) {
      throw Object.assign(new Error('License authority unavailable'), { status: 503 });
    }
    const result = JSON.parse(await readResponse(response, 32_000));
    if (result?.valid !== true) {
      throw Object.assign(new Error('License is not active for this device'), { status: 403 });
    }
    return metadata;
  } catch (error) {
    if (error?.status === 403 || error?.status === 503) throw error;
    throw Object.assign(new Error('License authority unavailable'), { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}

function parseProviderResult(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('AI returned invalid output');
  const keys = Object.keys(value);
  if (!keys.every(key => key === 'polishedText' || key === 'changes') ||
      typeof value.polishedText !== 'string' ||
      (value.changes !== undefined && (!Array.isArray(value.changes) || value.changes.length > 100 ||
       value.changes.some(change => typeof change !== 'string' || Buffer.byteLength(change, 'utf8') > 1_000)))) {
    throw new Error('AI returned invalid structured response');
  }
  if (!value.polishedText.trim() || Buffer.byteLength(value.polishedText, 'utf8') > MAX_REPORT_BYTES) {
    throw new Error('AI returned an invalid report');
  }
  return value.polishedText;
}

function authorizesTemplateExpansion(report, modality, bodyRegion, template) {
  if (typeof report !== 'string' || typeof template !== 'string' || !template.trim()) return false;
  const text = report
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!text || text.length > 160 || /\d/.test(text) ||
      /\b(?:abnormal|not normal|except|but|however|mass|lesion|stone|calculus|dilat|enlarg|reduc|increas)\b/i.test(text)) {
    return false;
  }
  if (!/\bnormal\b/.test(text)) return false;
  const modalityAliases = {
    ultrasound: ['ultrasound', 'sonogram', 'sonography', ' us '],
    ct: [' ct ', 'computed tomography'],
    mri: [' mri ', 'magnetic resonance'],
    'x-ray': ['x-ray', 'xray', 'radiograph']
  };
  const normalizedModality = String(modality || '').trim().toLowerCase();
  const padded = ` ${text} `;
  const modalityTerms = modalityAliases[normalizedModality] || [normalizedModality];
  const modalityPresent = modalityTerms.filter(Boolean).some(term => padded.includes(term));
  const region = String(bodyRegion || '').trim().toLowerCase();
  const regionRoot = region.replace(/(?:al|ic)$/i, '');
  const regionPresent = Boolean(region) && (
    text.includes(region) ||
    (regionRoot.length >= 4 && text.includes(regionRoot))
  );
  return modalityPresent && regionPresent;
}

function normalizeAdapter(adapter) {
  return typeof adapter === 'function' ? { polish: adapter } : adapter;
}

export const groqProviderAdapter = {
  async polish(input, context) {
    if (!context.apiKey) throw new Error('AI service is not configured');
    const { signal, fetch: fetchImpl, model, apiKey, timeoutMs } = context;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    try {
      const models = [...new Set([
        model === 'llama-3.3-70b-versatile' ? 'openai/gpt-oss-120b' : model,
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b'
      ].filter(Boolean))];
      let response;
      for (const candidateModel of models) {
        response = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
          redirect: 'error',
          body: JSON.stringify({
            model: candidateModel,
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: input.action === 'impression' ? IMPRESSION_PROMPT : PROMPT },
              { role: 'user', content: JSON.stringify(input) }
            ]
          }),
          signal: controller.signal
        });
        if (response.ok || response.status !== 404) break;
      }
        if (!response.ok) {
          const providerMessage = response.status === 401 || response.status === 403
            ? 'AI provider credential was rejected; no changes were made'
            : response.status === 404
              ? 'AI provider model is unavailable; no changes were made'
              : response.status === 429
                ? 'AI provider rate limit exceeded; no changes were made'
                : 'AI provider request failed; no changes were made';
          throw Object.assign(new Error(providerMessage), {
            status: response.status === 429 ? 429 : 503,
            publicMessage: providerMessage
          });
        }
        const result = JSON.parse(await readResponse(response, MAX_JSON_BYTES));
        const content = result?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') throw new Error('AI returned no structured response');
        let parsed;
        try {
          parsed = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim());
        } catch {
          throw new Error('AI returned invalid JSON');
        }
      return parseProviderResult(parsed);
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }
};

class Limiter {
  constructor(maxRequests, windowMs, maxConcurrent) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.maxConcurrent = maxConcurrent;
    this.states = new Map();
  }
  acquire(identity) {
    const now = Date.now();
    const state = this.states.get(identity) || { started: [], active: 0 };
    state.started = state.started.filter(start => now - start < this.windowMs);
    if (state.started.length >= this.maxRequests) throw new Error('AI polish rate limit exceeded');
    if (state.active >= this.maxConcurrent) throw new Error('AI polish concurrency limit exceeded');
    state.started.push(now);
    state.active++;
    this.states.set(identity, state);
    return () => {
      const current = this.states.get(identity);
      if (!current) return;
      current.active = Math.max(0, current.active - 1);
      current.started = current.started.filter(start => Date.now() - start < this.windowMs);
      if (!current.active && !current.started.length) this.states.delete(identity);
    };
  }
}

function jsonResponse(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  response.end(body);
}

function clientAllowed(request, config) {
  const origin = request.headers.origin;
  if (request.headers['sec-fetch-site'] === 'cross-site') return false;
  if (!origin) return true;
  return config.allowedOrigins.has(origin);
}

async function readRequest(request, maxBytes) {
  const declared = Number(request.headers['content-length'] || 0);
  if (declared > maxBytes) throw Object.assign(new Error('Request is too large'), { status: 413 });
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maxBytes) throw Object.assign(new Error('Request is too large'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, bytes).toString('utf8');
}

export function createGatewayServer(options = {}) {
  const numericSetting = (value, fallback, minimum) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
  };
  const configuredOrigins = options.allowedOrigins || process.env.GATEWAY_ALLOWED_ORIGINS || '';
  const configuredAdapters = {
    groq: groqProviderAdapter,
    ...(options.providerAdapters || {}),
    ...(options.providerAdapter ? {
      [options.provider || process.env.AI_PROVIDER || 'groq']: options.providerAdapter
    } : {})
  };
  const config = {
    fetch: options.fetchImpl || globalThis.fetch,
    publicKey: options.publicKey || getPublicKey(process.env.KRISPOINT_LICENSE_PUBLIC_KEY),
    licenseServerUrl: (options.licenseServerUrl || process.env.KRISPOINT_LICENSE_SERVER_URL || '').replace(/\/+$/, ''),
    groqApiKey: options.groqApiKey ?? process.env.GROQ_API_KEY,
    provider: options.provider || process.env.AI_PROVIDER || 'groq',
    model: options.model || options.groqModel || process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    providerAdapters: Object.fromEntries(
      Object.entries(configuredAdapters).map(([name, adapter]) => [name, normalizeAdapter(adapter)])
    ),
    timeoutMs: options.timeoutMs || AI_TIMEOUT_MS,
    allowedOrigins: new Set((Array.isArray(configuredOrigins) ? configuredOrigins : configuredOrigins.split(','))
      .map(value => value.trim()).filter(Boolean)),
    limiter: options.limiter || new Limiter(
      numericSetting(process.env.AI_RATE_LIMIT || 10, 10, 1), 5 * 60_000,
      numericSetting(process.env.AI_MAX_CONCURRENT || 8, 8, 1)
    )
  };
  if (!config.licenseServerUrl) throw new Error('KRISPOINT_LICENSE_SERVER_URL is required');
  if (process.env.NODE_ENV === 'production' && !config.licenseServerUrl.startsWith('https://')) {
    throw new Error('KRISPOINT_LICENSE_SERVER_URL must use HTTPS');
  }
  const providerAdapter = config.providerAdapters[config.provider];
  if (!providerAdapter || typeof providerAdapter.polish !== 'function') {
    throw new Error('Unsupported AI provider');
  }

  return createServer(async (request, response) => {
    try {
      if (request.method === 'GET' && (request.url === '/health' || request.url === '/health/')) {
        return jsonResponse(response, 200, { ok: true, provider: config.provider });
      }
      if (request.method !== 'POST' || request.url !== '/v1/polish') {
        return jsonResponse(response, 404, { success: false, error: 'Not found' });
      }
      if (!clientAllowed(request, config)) {
        return jsonResponse(response, 403, { success: false, error: 'Server-to-server request required' });
      }
      if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || '')) {
        return jsonResponse(response, 415, { success: false, error: 'JSON content type required' });
      }
      const raw = await readRequest(request, MAX_JSON_BYTES);
        let body;
        try {
          body = JSON.parse(raw);
        } catch {
          return jsonResponse(response, 400, { success: false, error: 'Invalid JSON request' });
        }
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return jsonResponse(response, 400, { success: false, error: 'Invalid request' });
        }
        const input = body;
        const action = input.action === undefined ? 'polish' : input.action;
        if (action !== 'polish' && action !== 'impression') {
          return jsonResponse(response, 400, { success: false, error: 'Unsupported AI action' });
        }
        const verifiedLicense = await validateLicense(
          input.licenseEnvelope || input.license || input.licence,
          config
        );
        const release = config.limiter.acquire(
          `${verifiedLicense.licenseKey}:${verifiedLicense.machineId}`
        );
        try {
          if (process.env.KRISPOINT_AI_ALLOW_IDENTIFIERS?.toLowerCase() !== 'true') {
            const identifiers = findExplicitIdentifiersInRequest(input);
            if (identifiers.length) {
              return jsonResponse(response, 422, {
                success: false,
                error: 'Report contains explicit patient identifiers; remove them before using hosted AI',
                policy: 'IDENTIFIERS_BLOCKED'
              });
            }
          }
        const report = input.report ?? input.reportText ?? input.content;
        let template = input.template ?? input.templateText;
        const modality = typeof input.modality === 'string' ? input.modality.slice(0, 100) : '';
        const bodyRegion = typeof input.bodyRegion === 'string' ? input.bodyRegion.slice(0, 100) : '';
        if (template && typeof template === 'object' && !Array.isArray(template)) {
          if (Buffer.byteLength(JSON.stringify(template), 'utf8') > MAX_TEMPLATE_BYTES) {
            return jsonResponse(response, 413, { success: false, error: 'Template is too large' });
          }
          const record = template;
          template = typeof record.content === 'string' && record.content.trim()
            ? record.content
            : [record.comparisonHtml, record.techniqueHtml, record.findingsHtml, record.impressionHtml]
              .filter(part => typeof part === 'string' && part.trim()).join('\n');
        }
        if (typeof report !== 'string' || !report.trim()) {
          return jsonResponse(response, 400, { success: false, error: 'Report text is required' });
        }
        if (Buffer.byteLength(report, 'utf8') > MAX_REPORT_BYTES ||
            (template !== undefined && (typeof template !== 'string' ||
              Buffer.byteLength(template, 'utf8') > MAX_TEMPLATE_BYTES))) {
          return jsonResponse(response, 413, { success: false, error: 'Report or template is too large' });
        }
        const requestController = new AbortController();
        const abortRequest = () => requestController.abort();
        const closeRequest = () => {
          if (!request.complete) requestController.abort();
        };
        const closeResponse = () => {
          if (!response.writableEnded) requestController.abort();
        };
        request.once('aborted', abortRequest);
        request.once('close', closeRequest);
        response.once('close', closeResponse);
        let polished;
        const templateExpansionAuthorized = action === 'polish' &&
          authorizesTemplateExpansion(report, modality, bodyRegion, template);
        try {
          polished = await providerAdapter.polish(
            {
              report,
              template: template || '',
              modality,
              bodyRegion,
              indication: typeof input.indication === 'string' ? input.indication.slice(0, 100) : '',
              action,
              templateExpansionAuthorized
            },
            {
              signal: requestController.signal,
              fetch: config.fetch,
              model: config.model,
              apiKey: config.groqApiKey,
              timeoutMs: config.timeoutMs
            }
          );
        } finally {
          request.removeListener('aborted', abortRequest);
          request.removeListener('close', closeRequest);
          response.removeListener('close', closeResponse);
        }
        if (typeof polished !== 'string') throw new Error('AI provider returned invalid output');
        const safetySource = templateExpansionAuthorized ? template : report;
        const warnings = action === 'impression'
          ? checkImpressionSafety(report, polished)
          : checkClinicalSafety(safetySource, polished);
        return jsonResponse(response, 200, {
          success: true,
          accepted: true,
          polishedText: polished,
          proposedContent: polished,
          blocked: false,
          warnings,
          safetyMessage: warnings.length
            ? 'AI changes require clinician review before acceptance'
            : 'Review the complete proposal before acceptance'
        });
        } finally {
          release();
        }
    } catch (error) {
      const status = error?.status ||
        (error?.message?.includes('rate limit') || error?.message?.includes('concurrency limit') ? 429 :
          error?.message?.includes('License') || error?.message?.includes('license') ? 403 :
            error?.name === 'AbortError' ? 504 : 503);
      const unavailableStage = status === 503
        ? (error?.message === 'License authority unavailable' ? 'license_authority' : 'provider')
        : null;
      if (unavailableStage) {
        console.error('AI request dependency unavailable', {
          stage: unavailableStage,
          error: typeof error?.message === 'string' ? error.message.slice(0, 160) : 'Unknown error'
        });
      }
      const message = error?.publicMessage || (status === 429 ? error.message :
        status === 403 ? error.message : status === 504 ? 'AI polish timed out; no changes were made' :
          unavailableStage === 'license_authority'
            ? 'License verification is temporarily unavailable; no changes were made'
            : 'AI provider is temporarily unavailable; no changes were made');
      return jsonResponse(response, status, { success: false, error: message });
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 8787);
  const server = createGatewayServer();
  server.on('error', (error) => {
    console.error(`KrisPoint AI gateway failed to start: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, host, () => {
    console.log(`KrisPoint AI gateway listening on ${host}:${port}`);
  });
}