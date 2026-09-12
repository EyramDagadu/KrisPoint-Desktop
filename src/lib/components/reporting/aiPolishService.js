// @ts-nocheck
import { get } from 'svelte/store';
import { licenseState } from '../../stores/licenseStore.js';

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

export async function polishReport({ content, indication, modality, bodyRegion, template, signal }) {
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
      template: template || null,
      templateId: template?.id || null,
      templateIdentity: template?.identity || null,
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
