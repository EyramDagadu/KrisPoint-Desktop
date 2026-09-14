// @ts-nocheck
import { get } from 'svelte/store';
import { licenseState } from '../../stores/licenseStore.js';
import { settingsService } from '../../services/SettingsService.js';
import { ollamaService } from '../../services/OllamaService.js';

function signedLicenceEnvelope() {
  const { license } = get(licenseState);
  if (!license) return null;
  return {
    key: license.key || null,
    machineId: license.machineId || null,
    payload: license.payload || null,
    signature: license.signature || null
  };
}

function clinicalTemplateText(template) {
  if (!template || typeof template !== 'object') return '';
  if (typeof template.content === 'string' && template.content.trim()) {
    return template.content;
  }
  return [
    template.comparisonHtml,
    template.techniqueHtml,
    template.findingsHtml,
    template.impressionHtml
  ].filter(part => typeof part === 'string' && part.trim()).join('\n');
}

class AiProviderError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AiProviderError';
    this.code = code;
    this.blocked = true;
  }
}

async function assertProviderReady(mode, signal) {
  const response = await fetch(`/api/ai/status?mode=${encodeURIComponent(mode)}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ready !== true) {
    throw new AiProviderError(
      payload.message || 'The selected AI provider is not ready; no report data was transmitted',
      'PROVIDER_NOT_READY'
    );
  }
}

async function runOllama({ action, content, indication, signal }) {
  const ai = settingsService.settings?.ai || {};
  ollamaService.setConfig(ai.ollamaUrl, ai.ollamaModel);
  const available = await ollamaService.checkAvailability();
  if (!available) {
    throw new AiProviderError('Private Ollama is not available; no report data was transmitted', 'OLLAMA_NOT_READY');
  }
  if (signal?.aborted) throw new DOMException('The request was aborted', 'AbortError');
  // OllamaService owns the local request and its constrained prompts. Never
  // send a private Ollama request through the hosted API route.
  const proposedContent = action === 'impression'
    ? await ollamaService.generateImpression(indication || '', content)
    : await ollamaService.polishReport(content);
  return {
    proposedContent,
    blocked: false,
    warnings: [],
    safetyMessage: ''
  };
}

export async function polishReport({
  content,
  indication,
  modality,
  bodyRegion,
  template,
  signal,
  action = 'polish',
  identifierReviewConfirmed = false
}) {
  const providerMode = settingsService.settings?.ai?.providerMode || 'hosted';
  if (providerMode === 'disabled') {
    throw new AiProviderError('AI is disabled in settings; no report data was transmitted', 'PROVIDER_DISABLED');
  }
  if (providerMode === 'ollama') {
    return runOllama({ action, content, indication, signal });
  }
  if (providerMode === 'byo') {
    // BYO is still server-managed. Readiness must be established before the
    // report is placed in a request body.
    await assertProviderReady('byo', signal);
  } else if (providerMode !== 'hosted') {
    throw new AiProviderError('Unknown AI provider; no report data was transmitted', 'PROVIDER_INVALID');
  }

  const response = await fetch('/api/ai/polish', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      content,
      indication: indication || '',
      modality: modality || '',
      bodyRegion: bodyRegion || '',
      action: action === 'impression' ? 'impression' : 'polish',
      providerMode,
      templateText: clinicalTemplateText(template),
      templateId: template?.id || null,
      templateIdentity: template?.identity || null,
      identifierReviewConfirmed,
      licence: signedLicenceEnvelope()
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (response.status === 422 && payload.candidate) {
    return {
      proposedContent: payload.candidate,
      blocked: true,
      warnings: payload.warnings || [],
      safetyMessage: payload.error || 'The proposal requires clinical safety review'
    };
  }
  if (!response.ok) {
    const error = new Error(payload.error || payload.message || 'Polish request could not be completed');
    error.identifierReviewRequired = payload.policy === 'IDENTIFIER_REVIEW_REQUIRED';
    error.blocked = Boolean(payload.blocked || payload.safety?.blocked || payload.warnings?.length);
    error.warnings = payload.warnings || payload.safety?.warnings || [];
    throw error;
  }
  return {
    proposedContent: payload.proposedContent || payload.polishedText || payload.content || payload.result || payload.candidate || '',
    blocked: Boolean(payload.blocked || payload.safety?.blocked),
    warnings: payload.warnings || payload.safety?.warnings || [],
    safetyMessage: payload.safetyMessage || payload.safety?.message || ''
  };
}
