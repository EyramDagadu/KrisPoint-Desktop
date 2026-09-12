import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidLicenseServerUrl, validateEnvironment } from './validateEnvironment.ts';

const originalEnvironment = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(originalEnvironment)) {
    process.env[key] = value;
  }
});

describe('Hospital production environment validation', () => {
  it('requires a non-local HTTPS licensing service', () => {
    process.env.NODE_ENV = 'production';
    process.env.VITE_KRISPOINT_EDITION = 'hospital';
    process.env.DATABASE_URL = 'postgres://db.example/krispoint';
    process.env.ENCRYPTION_KEY = 'a'.repeat(32);
    process.env.LICENSE_SERVER_URL = 'http://localhost:3001';

    const result = validateEnvironment();

    assert.equal(result.valid, false);
    assert.ok(result.errors.includes(
      'LICENSE_SERVER_URL must be an HTTPS URL and must not point to localhost'
    ));
  });

  it('accepts the public service and explicit HTTPS service URLs', () => {
    process.env.NODE_ENV = 'production';
    assert.equal(isValidLicenseServerUrl('https://license.krispoint.com.gh'), true);
    assert.equal(isValidLicenseServerUrl('https://licensing.example.test/api'), true);
    assert.equal(isValidLicenseServerUrl('http://licensing.example.test'), false);
    assert.equal(isValidLicenseServerUrl('https://localhost:3001'), false);
  });
});

describe('Solo environment validation', () => {
  it('does not require a public licensing URL', () => {
    process.env.NODE_ENV = 'production';
    process.env.VITE_KRISPOINT_EDITION = 'solo';
    process.env.SOLO_ENCRYPTION_KEY = 'a'.repeat(32);
    delete process.env.DATABASE_URL;
    delete process.env.LICENSE_SERVER_URL;

    const result = validateEnvironment();

    assert.equal(result.errors.includes('LICENSE_SERVER_URL is required for Hospital production'), false);
    assert.equal(result.valid, true);
  });
});