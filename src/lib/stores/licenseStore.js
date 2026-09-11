import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

const LICENSE_STORAGE_KEY = 'krispoint_license';
const LICENSE_SERVER_URL_KEY = 'krispoint_license_server_url';
const PUBLIC_KEY_STORAGE_KEY = 'krispoint_license_public_key';

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
  error: null,
  isLoading: false,
  serverUrl: ''
};

export const licenseState = writable(initialLicenseState);

export const isLicenseActive = derived(licenseState, $state => {
  if (!$state.isActivated || !$state.license) return false;
  if ($state.expiresAt && new Date($state.expiresAt) < new Date()) return false;
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
  return state.features?.includes(feature) || false;
};

function getMachineId() {
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

export const licenseActions = {
  async initialize() {
    if (!browser) return;
    
    const serverUrl = localStorage.getItem(LICENSE_SERVER_URL_KEY) || '';
    const storedLicense = localStorage.getItem(LICENSE_STORAGE_KEY);
    const publicKey = localStorage.getItem(PUBLIC_KEY_STORAGE_KEY);
    
    if (storedLicense && publicKey) {
      try {
        const license = JSON.parse(storedLicense);
        
        const isExpired = license.expiresAt && new Date(license.expiresAt) < new Date();
        
        if (!isExpired && license.payload && license.signature) {
          const verification = await verifyEd25519Signature(
            license.payload,
            license.signature,
            publicKey
          );
          
          if (!verification.valid) {
            console.error('License signature verification failed');
            this.clear();
            return;
          }
        }
        
        licenseState.set({
          isActivated: !isExpired,
          license: license,
          features: license.features || [],
          expiresAt: license.expiresAt,
          lastValidated: license.lastValidated,
          error: isExpired ? 'License has expired' : null,
          isLoading: false,
          serverUrl
        });

        if (!isExpired && serverUrl) {
          this.validateOnline();
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
    const cleanUrl = url.replace(/\/$/, '');
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
      const machineId = getMachineId();
      
      const response = await fetch(`${state.serverUrl}/api/license/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, machineId })
      });

      const data = await response.json();

      if (data.success) {
        const license = {
          key: data.license.key,
          email: data.license.email,
          plan: data.license.plan,
          features: data.license.features,
          expiresAt: data.license.expiresAt,
          payload: data.license.payload,
          signature: data.license.signature,
          machineId,
          lastValidated: new Date().toISOString()
        };

        localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(license));
        
        if (data.license.publicKey) {
          localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, data.license.publicKey);
        }

        licenseState.set({
          isActivated: true,
          license,
          features: license.features,
          expiresAt: license.expiresAt,
          lastValidated: license.lastValidated,
          error: null,
          isLoading: false,
          serverUrl: state.serverUrl
        });

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
      const error = 'Could not connect to license server';
      licenseState.update(s => ({ ...s, isLoading: false, error }));
      return { success: false, error };
    }
  },

  async validateOnline() {
    if (!browser) return;
    
    const state = get(licenseState);
    if (!state.license || !state.serverUrl) return;

    try {
      const machineId = getMachineId();
      
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
        const updatedLicense = {
          ...state.license,
          features: data.license.features,
          expiresAt: data.license.expiresAt,
          payload: data.license.payload,
          signature: data.license.signature,
          lastValidated: new Date().toISOString()
        };

        localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(updatedLicense));

        licenseState.update(s => ({
          ...s,
          license: updatedLicense,
          features: updatedLicense.features,
          expiresAt: updatedLicense.expiresAt,
          lastValidated: updatedLicense.lastValidated,
          error: null
        }));
      } else {
        if (data.error === 'License has been revoked') {
          this.clear();
        }
        licenseState.update(s => ({ ...s, error: data.error }));
      }
    } catch (e) {
      console.warn('Offline validation mode - could not reach license server');
    }
  },

  async deactivate() {
    if (!browser) return { success: false };
    
    const state = get(licenseState);
    if (!state.license || !state.serverUrl) {
      this.clear();
      return { success: true };
    }

    try {
      const machineId = getMachineId();
      
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
