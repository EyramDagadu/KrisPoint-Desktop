import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

const LICENSE_STORAGE_KEY = 'krispoint_license';
const LICENSE_SERVER_URL_KEY = 'krispoint_license_server_url';
const PUBLIC_KEY_STORAGE_KEY = 'krispoint_license_public_key';
const PINNED_PUBLIC_KEY = (import.meta.env.VITE_KRISPOINT_LICENSE_PUBLIC_KEY || '').trim();
const LAST_SEEN_STORAGE_KEY = 'krispoint_license_last_seen_at';
const VALIDATION_INTERVAL_MS = 6 * 60 * 60 * 1000;
const POLICY_CHECK_INTERVAL_MS = 60 * 1000;
const OFFLINE_GRACE_MS = 72 * 60 * 60 * 1000;
const CLOCK_ROLLBACK_TOLERANCE_MS = 5 * 60 * 1000;

let validationTimer = null;
let policyTimer = null;
let validationInFlight = null;

function normalizeServerUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  const withProtocol = /^(https?:\/\/|\/)/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

function base64ToBytes(base64) {
  const binString = atob(base64);
  return Uint8Array.from(binString, (c) => c.charCodeAt(0));
}

function bytesToString(bytes) {
  return new TextDecoder().decode(bytes);
}

async function verifyEd25519Signature(payload, signature, publicKeyBase64) {
  try {
    const publicKeyBytes = base64ToBytes(publicKeyBase64);
    const messageBytes = base64ToBytes(payload);
    const signatureBytes = base64ToBytes(signature);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: 'Ed25519' },
      false,
      ['verify']
    );
    
    const valid = await crypto.subtle.verify(
      'Ed25519',
      cryptoKey,
      signatureBytes,
      messageBytes
    );
    
    if (valid) {
      const data = JSON.parse(bytesToString(messageBytes));
      return { valid: true, data };
    }
    return { valid: false, error: 'Invalid signature' };
  } catch (e) {
    console.warn('Ed25519 verification failed:', e.message);
    return { valid: false, error: e.message };
  }
}

const initialLicenseState = {
  isActivated: false,
  license: null,
  features: [],
  expiresAt: null,
  lastValidated: null,
  offlineGraceUntil: null,
  validationStatus: 'inactive',
  error: null,
  isLoading: false,
  serverUrl: ''
};

export const licenseState = writable(initialLicenseState);

export const isLicenseActive = derived(licenseState, $state => {
  if (!$state.isActivated || !$state.license) return false;
  if ($state.expiresAt && new Date($state.expiresAt) < new Date()) return false;
  if ($state.offlineGraceUntil && new Date($state.offlineGraceUntil) < new Date()) return false;
  return true;
});

export const isLicenseExpired = derived(licenseState, $state => {
  if (!$state.license) return false;
  if ($state.expiresAt && new Date($state.expiresAt) < new Date()) return true;
  return false;
});

export const licenseFeatures = derived(licenseState, $state => $state.features || []);

export const hasFeature = (feature) => {
  const state = get(licenseState);
  if (!state.isActivated) return false;
  if (state.expiresAt && new Date(state.expiresAt) < new Date()) return false;
  if (state.offlineGraceUntil && new Date(state.offlineGraceUntil) < new Date()) return false;
  return state.features?.includes(feature) || false;
};

function isTauriRuntime() {
  return browser && Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__?.core);
}

function getBrowserMachineId() {
  if (!browser) return 'server';
  
  let machineId = localStorage.getItem('krispoint_machine_id');
  if (!machineId) {
    const nav = window.navigator;
    const screen = window.screen;
    const components = [
      nav.userAgent,
      nav.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      nav.hardwareConcurrency || 0
    ];
    
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    machineId = 'KP-' + Math.abs(hash).toString(36).toUpperCase().padStart(12, '0');
    localStorage.setItem('krispoint_machine_id', machineId);
  }
  return machineId;
}

async function getMachineId() {
  if (!isTauriRuntime()) return getBrowserMachineId();
  const { invoke } = await import('@tauri-apps/api/core');
  const machineId = await invoke('get_solo_machine_id');
  if (typeof machineId !== 'string' || !/^KP2-[A-F0-9]{32}$/.test(machineId)) {
    throw new Error('Secure device identity is unavailable');
  }
  return machineId;
}

function parseTime(value) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function legacyGraceUntil(license, signedData) {
  const signedGrace = parseTime(signedData?.offlineGraceUntil);
  if (signedGrace) return new Date(signedGrace).toISOString();
  const lastValidated = parseTime(license.lastValidated) || parseTime(signedData?.issuedAt);
  return lastValidated ? new Date(lastValidated + OFFLINE_GRACE_MS).toISOString() : null;
}

function inspectLocalPolicy(license, signedData = {}) {
  const now = Date.now();
  const expiresAt = parseTime(signedData.expiresAt || license.expiresAt);
  const offlineGraceUntil = legacyGraceUntil(license, signedData);
  const graceTime = parseTime(offlineGraceUntil);
  const lastSeen = parseTime(localStorage.getItem(LAST_SEEN_STORAGE_KEY));
  const clockRolledBack = Boolean(lastSeen && now + CLOCK_ROLLBACK_TOLERANCE_MS < lastSeen);

  if (!clockRolledBack && (!lastSeen || now > lastSeen)) {
    localStorage.setItem(LAST_SEEN_STORAGE_KEY, new Date(now).toISOString());
  }

  if (clockRolledBack) {
    return { active: false, offlineGraceUntil, error: 'System clock moved backwards. Connect to validate your license.' };
  }
  if (expiresAt && expiresAt < now) {
    return { active: false, offlineGraceUntil, error: 'License has expired' };
  }
  if (!graceTime || graceTime < now) {
    return {
      active: false,
      offlineGraceUntil,
      error: 'License validation is overdue. Connect to the internet to continue using licensed features.'
    };
  }
  return { active: true, offlineGraceUntil, error: null };
}

async function verifyLicenseEnvelope(license, publicKey, expectedMachineId) {
  if (!license?.payload || !license?.signature || !publicKey) {
    return { valid: false, error: 'Signed license evidence is missing' };
  }
  const verification = await verifyEd25519Signature(license.payload, license.signature, publicKey);
  if (!verification.valid) return verification;
  const data = verification.data;
  if (data.key !== license.key) {
    return { valid: false, error: 'Signed license key does not match this license' };
  }
  if (data.machineId && data.machineId !== expectedMachineId) {
    return { valid: false, error: 'License is activated for another device' };
  }
  return { valid: true, data };
}

function trustedPublicKey(candidate = '') {
  if (PINNED_PUBLIC_KEY) {
    if (candidate && candidate !== PINNED_PUBLIC_KEY) {
      throw new Error('License authority key does not match this KrisPoint release');
    }
    return PINNED_PUBLIC_KEY;
  }
  return candidate || localStorage.getItem(PUBLIC_KEY_STORAGE_KEY) || '';
}

function stopValidationSchedule() {
  if (validationTimer) clearInterval(validationTimer);
  if (policyTimer) clearInterval(policyTimer);
  validationTimer = null;
  policyTimer = null;
}

function enforceLocalPolicy() {
  const state = get(licenseState);
  if (!state.license) return;
  const policy = inspectLocalPolicy(state.license, {
    expiresAt: state.expiresAt,
    offlineGraceUntil: state.offlineGraceUntil
  });
  licenseState.update(current => ({
    ...current,
    isActivated: policy.active,
    features: policy.active ? current.license?.features || [] : [],
    offlineGraceUntil: policy.offlineGraceUntil,
    validationStatus: policy.active ? current.validationStatus : 'required',
    error: policy.error || current.error
  }));
}

function startValidationSchedule(actions) {
  stopValidationSchedule();
  validationTimer = setInterval(() => actions.validateOnline(), VALIDATION_INTERVAL_MS);
  policyTimer = setInterval(enforceLocalPolicy, POLICY_CHECK_INTERVAL_MS);
}

export const licenseActions = {
  async initialize() {
    if (!browser) return;
    
    const storedServerUrl = localStorage.getItem(LICENSE_SERVER_URL_KEY) || '';
    const serverUrl = normalizeServerUrl(storedServerUrl);
    if (serverUrl !== storedServerUrl) {
      localStorage.setItem(LICENSE_SERVER_URL_KEY, serverUrl);
    }
    const storedLicense = localStorage.getItem(LICENSE_STORAGE_KEY);
    const publicKey = trustedPublicKey();
    
    if (storedLicense && publicKey) {
      try {
        const license = JSON.parse(storedLicense);
        const machineId = await getMachineId();
        const verification = await verifyLicenseEnvelope(license, publicKey, machineId);
        if (!verification.valid) {
          console.error('License signature verification failed');
          this.clear();
          licenseState.update(state => ({ ...state, error: verification.error }));
          return;
        }
        const signedData = verification.data;
        const normalizedLicense = {
          ...license,
          machineId,
          features: signedData.features || [],
          expiresAt: signedData.expiresAt,
          offlineGraceUntil: legacyGraceUntil(license, signedData)
        };
        const policy = inspectLocalPolicy(normalizedLicense, signedData);

        licenseState.set({
          isActivated: policy.active,
          license: normalizedLicense,
          features: policy.active ? normalizedLicense.features : [],
          expiresAt: normalizedLicense.expiresAt,
          lastValidated: signedData.validatedAt || license.lastValidated,
          offlineGraceUntil: policy.offlineGraceUntil,
          validationStatus: policy.active ? 'offline-grace' : 'required',
          error: policy.error,
          isLoading: false,
          serverUrl
        });

        startValidationSchedule(this);
        if (serverUrl) {
          if (isTauriRuntime() && !signedData.machineId) {
            this.activate(license.key);
          } else {
            this.validateOnline();
          }
        }
      } catch (e) {
        console.error('Failed to parse stored license:', e);
        this.clear();
      }
    } else {
      licenseState.update(s => ({ ...s, serverUrl }));
    }
  },

  setServerUrl(url) {
    if (!browser) return;
    const cleanUrl = normalizeServerUrl(url);
    localStorage.setItem(LICENSE_SERVER_URL_KEY, cleanUrl);
    licenseState.update(s => ({ ...s, serverUrl: cleanUrl }));
  },

  async activate(licenseKey) {
    if (!browser) return { success: false, error: 'Not in browser' };
    
    const state = get(licenseState);
    if (!state.serverUrl) {
      return { success: false, error: 'License server URL not configured' };
    }

    licenseState.update(s => ({ ...s, isLoading: true, error: null }));

    try {
      const machineId = await getMachineId();
      
      const response = await fetch(`${state.serverUrl}/api/license/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, machineId })
      });

      const data = await response.json();

      if (data.success) {
        const publicKey = trustedPublicKey(data.license.publicKey);
        const verification = await verifyLicenseEnvelope(data.license, publicKey, machineId);
        if (!verification.valid) {
          throw new Error(verification.error);
        }
        const signedData = verification.data;
        const license = {
          key: data.license.key,
          email: data.license.email,
          plan: data.license.plan,
          features: signedData.features || [],
          expiresAt: signedData.expiresAt,
          payload: data.license.payload,
          signature: data.license.signature,
          machineId,
          lastValidated: signedData.validatedAt || signedData.issuedAt,
          offlineGraceUntil: legacyGraceUntil(data.license, signedData)
        };

        localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(license));
        
        localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, publicKey);

        licenseState.set({
          isActivated: true,
          license,
          features: license.features,
          expiresAt: license.expiresAt,
          lastValidated: license.lastValidated,
          offlineGraceUntil: license.offlineGraceUntil,
          validationStatus: 'online',
          error: null,
          isLoading: false,
          serverUrl: state.serverUrl
        });
        startValidationSchedule(this);

        return { success: true };
      } else {
        licenseState.update(s => ({
          ...s,
          isLoading: false,
          error: data.error || 'Activation failed'
        }));
        return { success: false, error: data.error };
      }
    } catch (e) {
      const error = e?.message || 'Could not connect to license server';
      licenseState.update(s => ({ ...s, isLoading: false, error }));
      return { success: false, error };
    }
  },

  async validateOnline() {
    if (!browser) return;
    if (validationInFlight) return validationInFlight;
    
    const state = get(licenseState);
    if (!state.license || !state.serverUrl) return;

    validationInFlight = (async () => {
      try {
        const machineId = await getMachineId();
      
        const response = await fetch(`${state.serverUrl}/api/license/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseKey: state.license.key,
            machineId,
            payload: state.license.payload,
            signature: state.license.signature
          })
        });

        const data = await response.json();

        if (data.valid) {
          const publicKey = trustedPublicKey(data.license.publicKey);
          const verification = await verifyLicenseEnvelope(data.license, publicKey, machineId);
          if (!verification.valid) throw new Error(verification.error);
          const signedData = verification.data;
          const updatedLicense = {
            ...state.license,
            machineId,
            features: signedData.features || [],
            expiresAt: signedData.expiresAt,
            payload: data.license.payload,
            signature: data.license.signature,
            lastValidated: signedData.validatedAt || signedData.issuedAt,
            offlineGraceUntil: legacyGraceUntil(data.license, signedData)
          };

          localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(updatedLicense));
          localStorage.setItem(LAST_SEEN_STORAGE_KEY, signedData.validatedAt);

          licenseState.update(s => ({
            ...s,
            isActivated: true,
            license: updatedLicense,
            features: updatedLicense.features,
            expiresAt: updatedLicense.expiresAt,
            lastValidated: updatedLicense.lastValidated,
            offlineGraceUntil: updatedLicense.offlineGraceUntil,
            validationStatus: 'online',
            error: null
          }));
          return { success: true };
        }
        stopValidationSchedule();
        licenseState.update(s => ({
          ...s,
          isActivated: false,
          features: [],
          validationStatus: 'invalid',
          error: data.error || 'License validation failed'
        }));
        return { success: false, error: data.error };
      } catch (e) {
        console.warn('Offline validation mode - could not reach license server');
        enforceLocalPolicy();
        licenseState.update(s => ({
          ...s,
          validationStatus: s.isActivated ? 'offline-grace' : 'required',
          error: s.isActivated ? null : s.error
        }));
        return { success: false, offline: true };
      } finally {
        validationInFlight = null;
      }
    })();
    return validationInFlight;
  },

  async deactivate() {
    if (!browser) return { success: false };
    
    const state = get(licenseState);
    if (!state.license || !state.serverUrl) {
      this.clear();
      return { success: true };
    }

    try {
      const machineId = await getMachineId();
      
      await fetch(`${state.serverUrl}/api/license/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: state.license.key,
          machineId
        })
      });
    } catch (e) {
      console.warn('Could not notify server of deactivation');
    }

    this.clear();
    return { success: true };
  },

  clear() {
    if (!browser) return;
    stopValidationSchedule();
    localStorage.removeItem(LICENSE_STORAGE_KEY);
    const serverUrl = localStorage.getItem(LICENSE_SERVER_URL_KEY) || '';
    licenseState.set({ ...initialLicenseState, serverUrl });
  },

  getDaysRemaining() {
    const state = get(licenseState);
    if (!state.expiresAt) return null;
    const diff = new Date(state.expiresAt) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  async getSubscriptionStatus() {
    if (!browser) return null;
    const state = get(licenseState);
    if (!state.license?.key || !state.serverUrl) return null;

    try {
      const response = await fetch(
        `${state.serverUrl}/api/paystack/subscription/status/${encodeURIComponent(state.license.key)}`
      );
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.warn('Could not fetch subscription status');
      return null;
    }
  },

  async setupAutoRenew(planId) {
    if (!browser) return { success: false, error: 'Not in browser' };
    const state = get(licenseState);
    if (!state.license?.key || !state.serverUrl) {
      return { success: false, error: 'No license or server URL' };
    }

    try {
      const response = await fetch(`${state.serverUrl}/api/paystack/subscription/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: state.license.key,
          planId
        })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to set up auto-renewal' };
      }
      if (data.requiresPayment && data.authorizationUrl) {
        window.open(data.authorizationUrl, '_blank');
        return { success: true, requiresPayment: true, message: data.message };
      }
      return { success: true, ...data };
    } catch (e) {
      return { success: false, error: 'Could not connect to license server' };
    }
  },

  async changeAutoRenewPlan(newPlanId) {
    if (!browser) return { success: false, error: 'Not in browser' };
    const state = get(licenseState);
    if (!state.license?.key || !state.serverUrl) {
      return { success: false, error: 'No license or server URL' };
    }

    try {
      const response = await fetch(`${state.serverUrl}/api/paystack/subscription/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: state.license.key,
          email: state.license.email || '',
          newPlanId
        })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to change plan' };
      }
      return { success: true, ...data };
    } catch (e) {
      return { success: false, error: 'Could not connect to license server' };
    }
  },

  getTopUpUrl(planId) {
    const state = get(licenseState);
    if (!state.serverUrl || !state.license?.key) return null;
    let url = state.serverUrl;
    const params = new URLSearchParams();
    params.set('license_key', state.license.key);
    if (planId) params.set('plan_id', String(planId));
    return `${url}?${params.toString()}`;
  },

  async toggleAutoRenew(enable) {
    if (!browser) return { success: false, error: 'Not in browser' };
    const state = get(licenseState);
    if (!state.license?.key || !state.serverUrl) {
      return { success: false, error: 'No license or server URL' };
    }

    try {
      const response = await fetch(`${state.serverUrl}/api/paystack/subscription/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: state.license.key,
          email: state.license.email || '',
          enable
        })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Toggle failed' };
      }
      return { success: true, autoRenew: data.autoRenew };
    } catch (e) {
      return { success: false, error: 'Could not connect to license server' };
    }
  }
};

if (browser) {
  licenseActions.initialize();
}
