const express = require('express');
const router = express.Router();
const licenseService = require('../services/license');
const pool = require('../db/pool');

router.get('/public-key', (_req, res) => {
  res.json({ algorithm: 'Ed25519', publicKey: licenseService.getPublicKey() });
});

router.post('/activate', async (req, res) => {
  try {
    const { licenseKey, machineId } = req.body;

    if (!licenseKey || !machineId) {
      return res.status(400).json({ error: 'License key and machine ID are required' });
    }

    const result = await licenseService.activateLicense(licenseKey, machineId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error('Activation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { licenseKey, machineId, payload, signature } = req.body;

    if (!licenseKey || !machineId) {
      return res.status(400).json({ valid: false, error: 'License key and machine ID are required' });
    }

    if (payload && signature) {
      const result = await licenseService.validateLicense(licenseKey, machineId, payload, signature);
      return res.json(result);
    }

    const license = await licenseService.getLicenseByKey(licenseKey);
    
    if (!license) {
      return res.json({ valid: false, error: 'License not found' });
    }

    if (license.status === 'revoked') {
      return res.json({ valid: false, error: 'License has been revoked' });
    }

    if (license.machine_id !== machineId) {
      return res.json({ valid: false, error: 'License not activated for this device' });
    }

    if (new Date(license.expires_at) < new Date()) {
      return res.json({ valid: false, error: 'License has expired' });
    }

    await pool.query(
      'UPDATE licenses SET last_validated_at = CURRENT_TIMESTAMP WHERE license_key = $1',
      [licenseKey]
    );

    const validatedAt = new Date();
    const offlineGraceUntil = new Date(validatedAt.getTime() + 72 * 60 * 60 * 1000);
    const signedLicense = licenseService.signLicense({
      key: licenseKey,
      email: license.email,
      plan: license.plan_name,
      features: license.features,
      expiresAt: license.expires_at,
      machineId,
      validatedAt: validatedAt.toISOString(),
      offlineGraceUntil: offlineGraceUntil.toISOString(),
    });

    res.json({
      valid: true,
      license: {
        key: licenseKey,
        plan: license.plan_name,
        features: license.features,
        expiresAt: license.expires_at,
        validatedAt: validatedAt.toISOString(),
        offlineGraceUntil: offlineGraceUntil.toISOString(),
        ...signedLicense,
      },
    });
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

router.post('/deactivate', async (req, res) => {
  try {
    const { licenseKey, machineId } = req.body;

    if (!licenseKey || !machineId) {
      return res.status(400).json({ error: 'License key and machine ID are required' });
    }

    const license = await licenseService.getLicenseByKey(licenseKey);
    
    if (!license || license.machine_id !== machineId) {
      return res.status(400).json({ error: 'Invalid license or machine ID' });
    }

    await licenseService.deactivateLicense(licenseKey);
    res.json({ success: true, message: 'License deactivated successfully' });
  } catch (err) {
    console.error('Deactivation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/info/:licenseKey', async (req, res) => {
  try {
    const license = await licenseService.getLicenseByKey(req.params.licenseKey);
    
    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json({
      status: license.status,
      plan: license.plan_name,
      features: license.features,
      expiresAt: license.expires_at,
      isActivated: !!license.machine_id,
    });
  } catch (err) {
    console.error('License info error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/offline-verify', async (req, res) => {
  try {
    const { payload, signature } = req.body;

    if (!payload || !signature) {
      return res.status(400).json({ valid: false, error: 'Payload and signature required' });
    }

    const result = licenseService.verifyLicenseSignature(payload, signature);
    res.json(result);
  } catch (err) {
    console.error('Offline verify error:', err);
    res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

module.exports = router;
