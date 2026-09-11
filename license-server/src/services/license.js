const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const pool = require('../db/pool');
const fs = require('fs');
const path = require('path');

class LicenseService {
  constructor() {
    this.keyPair = null;
    this.loadOrGenerateKeyPair();
  }

  loadOrGenerateKeyPair() {
    const keyPath = path.join(__dirname, '../../keys');
    const privateKeyPath = path.join(keyPath, 'private.key');
    const publicKeyPath = path.join(keyPath, 'public.key');

    try {
      if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        this.keyPair = {
          secretKey: naclUtil.decodeBase64(privateKey),
          publicKey: naclUtil.decodeBase64(publicKey),
        };
        console.log('Loaded existing Ed25519 key pair');
      } else {
        this.keyPair = nacl.sign.keyPair();
        
        if (!fs.existsSync(keyPath)) {
          fs.mkdirSync(keyPath, { recursive: true });
        }
        
        fs.writeFileSync(privateKeyPath, naclUtil.encodeBase64(this.keyPair.secretKey));
        fs.writeFileSync(publicKeyPath, naclUtil.encodeBase64(this.keyPair.publicKey));
        console.log('Generated new Ed25519 key pair');
      }
    } catch (err) {
      console.error('Key pair error, generating new:', err.message);
      this.keyPair = nacl.sign.keyPair();
    }
  }

  getPublicKey() {
    return naclUtil.encodeBase64(this.keyPair.publicKey);
  }

  generateLicenseKey() {
    const uuid = uuidv4().replace(/-/g, '').toUpperCase();
    const formatted = `KP-${uuid.slice(0, 4)}-${uuid.slice(4, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}`;
    return formatted;
  }

  signLicense(licenseData) {
    const payload = JSON.stringify({
      key: licenseData.key,
      email: licenseData.email,
      plan: licenseData.plan,
      features: licenseData.features,
      expiresAt: licenseData.expiresAt,
      issuedAt: new Date().toISOString(),
    });

    const messageBytes = naclUtil.decodeUTF8(payload);
    const signedMessage = nacl.sign(messageBytes, this.keyPair.secretKey);
    const signature = naclUtil.encodeBase64(signedMessage.slice(0, nacl.sign.signatureLength));

    return {
      payload: naclUtil.encodeBase64(messageBytes),
      signature,
      publicKey: this.getPublicKey(),
    };
  }

  verifyLicenseSignature(payload, signature, publicKeyBase64) {
    try {
      const publicKey = publicKeyBase64 
        ? naclUtil.decodeBase64(publicKeyBase64) 
        : this.keyPair.publicKey;
      
      const messageBytes = naclUtil.decodeBase64(payload);
      const signatureBytes = naclUtil.decodeBase64(signature);
      
      const signedMessage = new Uint8Array(signatureBytes.length + messageBytes.length);
      signedMessage.set(signatureBytes);
      signedMessage.set(messageBytes, signatureBytes.length);
      
      const opened = nacl.sign.open(signedMessage, publicKey);
      
      if (!opened) {
        return { valid: false, error: 'Invalid signature' };
      }

      const data = JSON.parse(naclUtil.encodeUTF8(opened));
      
      if (new Date(data.expiresAt) < new Date()) {
        return { valid: false, error: 'License expired', data };
      }

      return { valid: true, data };
    } catch (err) {
      return { valid: false, error: 'Invalid license format: ' + err.message };
    }
  }

  async createLicense(customerId, planId, expiresAt) {
    const licenseKey = this.generateLicenseKey();
    
    const result = await pool.query(
      `INSERT INTO licenses (license_key, customer_id, plan_id, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [licenseKey, customerId, planId, expiresAt]
    );

    return result.rows[0];
  }

  async getLicenseByKey(licenseKey) {
    const result = await pool.query(
      `SELECT l.*, c.email, c.name, c.organization, p.name as plan_name, p.features
       FROM licenses l
       JOIN customers c ON l.customer_id = c.id
       JOIN plans p ON l.plan_id = p.id
       WHERE l.license_key = $1`,
      [licenseKey]
    );
    return result.rows[0];
  }

  async activateLicense(licenseKey, machineId) {
    const license = await this.getLicenseByKey(licenseKey);
    
    if (!license) {
      return { success: false, error: 'License not found' };
    }

    if (license.status === 'revoked') {
      return { success: false, error: 'License has been revoked' };
    }

    if (new Date(license.expires_at) < new Date()) {
      return { success: false, error: 'License has expired' };
    }

    const isDeviceSwitch = license.machine_id && license.machine_id !== machineId;

    await pool.query(
      `UPDATE licenses 
       SET machine_id = $1, activated_at = ${isDeviceSwitch ? 'activated_at' : 'CURRENT_TIMESTAMP'}, last_validated_at = CURRENT_TIMESTAMP
       WHERE license_key = $2`,
      [machineId, licenseKey]
    );

    const signedLicense = this.signLicense({
      key: licenseKey,
      email: license.email,
      plan: license.plan_name,
      features: license.features,
      expiresAt: license.expires_at,
    });

    return {
      success: true,
      license: {
        key: licenseKey,
        email: license.email,
        plan: license.plan_name,
        features: license.features,
        expiresAt: license.expires_at,
        ...signedLicense,
      },
    };
  }

  async validateLicense(licenseKey, machineId, payload, signature) {
    const verification = this.verifyLicenseSignature(payload, signature);
    
    if (!verification.valid) {
      return { valid: false, error: verification.error };
    }

    const license = await this.getLicenseByKey(licenseKey);
    
    if (!license) {
      return { valid: false, error: 'License not found' };
    }

    if (license.status === 'revoked') {
      return { valid: false, error: 'License has been revoked' };
    }

    if (license.machine_id !== machineId) {
      return { valid: false, error: 'License not activated for this device' };
    }

    await pool.query(
      `UPDATE licenses SET last_validated_at = CURRENT_TIMESTAMP WHERE license_key = $1`,
      [licenseKey]
    );

    const newSignedLicense = this.signLicense({
      key: licenseKey,
      email: license.email,
      plan: license.plan_name,
      features: license.features,
      expiresAt: license.expires_at,
    });

    return {
      valid: true,
      license: {
        key: licenseKey,
        plan: license.plan_name,
        features: license.features,
        expiresAt: license.expires_at,
        ...newSignedLicense,
      },
    };
  }

  async deactivateLicense(licenseKey) {
    await pool.query(
      `UPDATE licenses SET machine_id = NULL, activated_at = NULL WHERE license_key = $1`,
      [licenseKey]
    );
    return { success: true };
  }

  async revokeLicense(licenseKey) {
    await pool.query(
      `UPDATE licenses SET status = 'revoked' WHERE license_key = $1`,
      [licenseKey]
    );
    return { success: true };
  }

  async renewLicense(licenseKey, newExpiresAt) {
    await pool.query(
      `UPDATE licenses SET expires_at = $1, status = 'active' WHERE license_key = $2`,
      [newExpiresAt, licenseKey]
    );
    return { success: true };
  }
}

module.exports = new LicenseService();
