const express = require('express');
const router = express.Router();
const paystackService = require('../services/paystack');
const pool = require('../db/pool');
const config = require('../config');

router.post('/initialize', async (req, res) => {
  try {
    const { email, planId, customerName, organization, licenseKey } = req.body;

    if (!email || !planId) {
      return res.status(400).json({ error: 'Email and plan ID are required' });
    }

    const result = await paystackService.initializeTransaction(email, planId, {
      customer_name: customerName,
      organization,
      license_key: licenseKey || undefined,
    });

    if (!result.status) {
      return res.status(400).json({ error: result.message || 'Failed to initialize transaction' });
    }

    res.json({
      success: true,
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
      accessCode: result.data.access_code,
    });
  } catch (err) {
    console.error('Initialize error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/callback', async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.redirect(`${config.server.url}/payment/failed?error=no_reference`);
    }

    const result = await paystackService.verifyTransaction(reference);

    if (result.status && result.data.status === 'success') {
      try {
        await paystackService.handleChargeSuccess(result.data);
      } catch (processErr) {
        console.error('Callback payment processing error:', processErr);
      }
      return res.redirect(`${config.server.url}/payment/success?reference=${reference}`);
    }

    res.redirect(`${config.server.url}/payment/failed?error=payment_failed`);
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect(`${config.server.url}/payment/failed?error=verification_failed`);
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    
    let body = req.body;
    if (Buffer.isBuffer(body)) {
      body = JSON.parse(body.toString());
    }

    if (!paystackService.verifyWebhookSignature(body, signature)) {
      console.warn('Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    await paystackService.handleWebhook(body);
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Webhook processing failed');
  }
});

router.get('/plans', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price_cedis, interval, features FROM plans WHERE is_active = true ORDER BY price_cedis'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Plans error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/verify/:reference', async (req, res) => {
  try {
    const result = await paystackService.verifyTransaction(req.params.reference);
    
    if (result.status && result.data.status === 'success') {
      const payment = await pool.query(
        `SELECT p.*, l.license_key 
         FROM payments p 
         LEFT JOIN licenses l ON p.license_id = l.id 
         WHERE p.paystack_reference = $1`,
        [req.params.reference]
      );

      res.json({
        success: true,
        licenseKey: payment.rows[0]?.license_key,
        email: result.data.customer.email,
      });
    } else {
      res.json({ success: false, error: 'Payment not successful' });
    }
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/subscription/status/:licenseKey', async (req, res) => {
  try {
    const status = await paystackService.getSubscriptionStatus(req.params.licenseKey);
    res.json(status);
  } catch (err) {
    console.error('Subscription status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/subscription/plans', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price_cedis, interval, features FROM plans WHERE is_active = true ORDER BY price_cedis'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Subscription plans error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/subscription/create', async (req, res) => {
  try {
    const { licenseKey, planId } = req.body;

    if (!licenseKey || !planId) {
      return res.status(400).json({ error: 'licenseKey and planId are required' });
    }

    const ownerCheck = await pool.query(
      `SELECT c.email FROM licenses l JOIN customers c ON l.customer_id = c.id WHERE l.license_key = $1`,
      [licenseKey]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }
    const email = ownerCheck.rows[0].email;

    const result = await paystackService.createSubscription(licenseKey, email, planId);
    res.json(result);
  } catch (err) {
    console.error('Create subscription error:', err);
    res.status(400).json({ error: err.message || 'Failed to create subscription' });
  }
});

router.post('/subscription/change-plan', async (req, res) => {
  try {
    const { licenseKey, newPlanId } = req.body;

    if (!licenseKey || !newPlanId) {
      return res.status(400).json({ error: 'licenseKey and newPlanId are required' });
    }

    const ownerCheck = await pool.query(
      `SELECT c.email FROM licenses l JOIN customers c ON l.customer_id = c.id WHERE l.license_key = $1`,
      [licenseKey]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    const result = await paystackService.changePlan(licenseKey, newPlanId);
    res.json(result);
  } catch (err) {
    console.error('Change plan error:', err);
    res.status(400).json({ error: err.message || 'Failed to change plan' });
  }
});

router.post('/subscription/toggle', async (req, res) => {
  try {
    const { licenseKey, enable } = req.body;

    if (!licenseKey || typeof enable !== 'boolean') {
      return res.status(400).json({ error: 'licenseKey and enable (boolean) are required' });
    }

    const ownerCheck = await pool.query(
      `SELECT c.email FROM licenses l JOIN customers c ON l.customer_id = c.id WHERE l.license_key = $1`,
      [licenseKey]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    const result = await paystackService.toggleAutoRenew(licenseKey, enable);
    res.json(result);
  } catch (err) {
    console.error('Toggle auto-renew error:', err);
    res.status(400).json({ error: err.message || 'Failed to toggle auto-renewal' });
  }
});

module.exports = router;
