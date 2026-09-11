const crypto = require('crypto');
const config = require('../config');
const pool = require('../db/pool');
const licenseService = require('./license');
const emailService = require('./email');

class PaystackService {
  constructor() {
    this.baseUrl = 'https://api.paystack.co';
  }

  async request(endpoint, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${config.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    return response.json();
  }

  async initializeTransaction(email, planId, metadata = {}) {
    const planResult = await pool.query('SELECT * FROM plans WHERE id = $1', [planId]);
    const plan = planResult.rows[0];

    if (!plan) {
      throw new Error('Plan not found');
    }

    const txMetadata = {
      ...metadata,
      plan_id: planId,
      plan_name: plan.name,
    };

    if (metadata.license_key) {
      txMetadata.license_key = metadata.license_key;
    }

    const result = await this.request('/transaction/initialize', 'POST', {
      email,
      amount: plan.price_cedis,
      currency: 'GHS',
      plan: plan.paystack_plan_code || undefined,
      callback_url: `${config.server.url}/api/paystack/callback`,
      metadata: txMetadata,
    });

    return result;
  }

  async verifyTransaction(reference) {
    return this.request(`/transaction/verify/${reference}`);
  }

  async createPlan(name, amount, interval) {
    return this.request('/plan', 'POST', {
      name,
      amount,
      interval,
      currency: 'GHS',
    });
  }

  async syncPlans() {
    const plans = await pool.query('SELECT * FROM plans WHERE paystack_plan_code IS NULL');
    
    for (const plan of plans.rows) {
      const result = await this.createPlan(plan.name, plan.price_cedis, plan.interval);
      if (result.status && result.data) {
        await pool.query(
          'UPDATE plans SET paystack_plan_code = $1 WHERE id = $2',
          [result.data.plan_code, plan.id]
        );
      }
    }
  }

  verifyWebhookSignature(body, signature) {
    const hash = crypto
      .createHmac('sha512', config.paystack.secretKey)
      .update(JSON.stringify(body))
      .digest('hex');
    return hash === signature;
  }

  async handleWebhook(event) {
    const { event: eventType, data } = event;

    switch (eventType) {
      case 'charge.success':
        return this.handleChargeSuccess(data);
      case 'subscription.create':
        return this.handleSubscriptionCreate(data);
      case 'subscription.disable':
        return this.handleSubscriptionDisable(data);
      case 'invoice.payment_failed':
        return this.handlePaymentFailed(data);
      default:
        console.log('Unhandled webhook event:', eventType);
    }
  }

  async handleChargeSuccess(data) {
    const { reference, customer, amount, metadata, authorization } = data;

    const existingPayment = await pool.query(
      'SELECT p.*, l.license_key FROM payments p LEFT JOIN licenses l ON p.license_id = l.id WHERE p.paystack_reference = $1',
      [reference]
    );
    if (existingPayment.rows.length > 0) {
      return { success: true, license: { license_key: existingPayment.rows[0].license_key } };
    }

    let customerRecord = await pool.query(
      'SELECT * FROM customers WHERE email = $1',
      [customer.email]
    );

    if (customerRecord.rows.length === 0) {
      customerRecord = await pool.query(
        `INSERT INTO customers (email, name, paystack_customer_code)
         VALUES ($1, $2, $3) RETURNING *`,
        [customer.email, metadata?.customer_name || customer.email.split('@')[0], customer.customer_code]
      );
    }
    const customerId = customerRecord.rows[0].id;

    const planId = metadata?.plan_id || 1;
    const planResult = await pool.query('SELECT * FROM plans WHERE id = $1', [planId]);
    const plan = planResult.rows[0];

    let expiresAt = new Date();
    if (plan.interval === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (plan.interval === 'annually') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    let existingLicense;
    if (metadata?.license_key) {
      existingLicense = await pool.query(
        `SELECT * FROM licenses WHERE license_key = $1 AND customer_id = $2`,
        [metadata.license_key, customerId]
      );
    }

    if (!existingLicense || existingLicense.rows.length === 0) {
      existingLicense = await pool.query(
        `SELECT * FROM licenses WHERE customer_id = $1 AND status IN ('active', 'expired') ORDER BY created_at DESC LIMIT 1`,
        [customerId]
      );
    }

    let license;
    if (existingLicense.rows.length > 0) {
      const existing = existingLicense.rows[0];
      const currentExpiry = new Date(existing.expires_at);
      const now = new Date();

      if (currentExpiry > now) {
        if (plan.interval === 'monthly') {
          expiresAt = new Date(currentExpiry);
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else if (plan.interval === 'annually') {
          expiresAt = new Date(currentExpiry);
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }
      }

      await licenseService.renewLicense(existing.license_key, expiresAt);
      await pool.query(
        `UPDATE licenses SET plan_id = $1 WHERE id = $2`,
        [planId, existing.id]
      );
      license = { ...existing, expires_at: expiresAt };
    } else {
      license = await licenseService.createLicense(customerId, planId, expiresAt);
    }

    await pool.query(
      `INSERT INTO payments (customer_id, license_id, amount_cedis, paystack_reference, paystack_authorization_code, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [customerId, license.id, amount, reference, authorization?.authorization_code, 'success', JSON.stringify(data)]
    );

    const licenseKey = license.license_key;
    await emailService.sendLicenseEmail(customer.email, licenseKey, plan.name, expiresAt);

    return { success: true, license };
  }

  async handleSubscriptionCreate(data) {
    const { customer, plan, subscription_code, email_token, next_payment_date } = data;

    const customerResult = await pool.query(
      'SELECT * FROM customers WHERE paystack_customer_code = $1',
      [customer.customer_code]
    );

    if (customerResult.rows.length === 0) return;

    const customerId = customerResult.rows[0].id;
    const licenseResult = await pool.query(
      'SELECT * FROM licenses WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1',
      [customerId]
    );

    if (licenseResult.rows.length === 0) return;

    const planResult = await pool.query(
      'SELECT * FROM plans WHERE paystack_plan_code = $1',
      [plan.plan_code]
    );

    await pool.query(
      `INSERT INTO subscriptions (customer_id, license_id, plan_id, paystack_subscription_code, paystack_email_token, next_payment_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [customerId, licenseResult.rows[0].id, planResult.rows[0]?.id, subscription_code, email_token, next_payment_date]
    );
  }

  async handleSubscriptionDisable(data) {
    await pool.query(
      `UPDATE subscriptions SET status = 'cancelled' WHERE paystack_subscription_code = $1`,
      [data.subscription_code]
    );
  }

  async handlePaymentFailed(data) {
    const { subscription } = data;
    
    await pool.query(
      `UPDATE subscriptions SET status = 'attention' WHERE paystack_subscription_code = $1`,
      [subscription.subscription_code]
    );
  }

  async getSubscriptionStatus(licenseKey) {
    const licenseResult = await pool.query(
      'SELECT id, customer_id FROM licenses WHERE license_key = $1',
      [licenseKey]
    );

    if (licenseResult.rows.length === 0) {
      return { hasSubscription: false, availablePlans: [] };
    }

    const plansResult = await pool.query(
      'SELECT id, name, description, price_cedis, interval, features FROM plans WHERE is_active = true ORDER BY price_cedis'
    );
    const availablePlans = plansResult.rows;

    const sub = await pool.query(
      `SELECT s.*, p.name as plan_name, p.interval as plan_interval, p.price_cedis
       FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.license_id = $1
       ORDER BY s.created_at DESC LIMIT 1`,
      [licenseResult.rows[0].id]
    );

    if (sub.rows.length === 0) {
      return { hasSubscription: false, availablePlans };
    }

    const subscription = sub.rows[0];
    return {
      hasSubscription: true,
      autoRenew: subscription.status === 'active',
      status: subscription.status,
      planId: subscription.plan_id,
      planName: subscription.plan_name,
      planInterval: subscription.plan_interval,
      nextPaymentDate: subscription.next_payment_date,
      availablePlans,
    };
  }

  async createSubscription(licenseKey, email, planId) {
    const licenseResult = await pool.query(
      'SELECT l.*, c.paystack_customer_code, c.id as cust_id FROM licenses l JOIN customers c ON l.customer_id = c.id WHERE l.license_key = $1',
      [licenseKey]
    );

    if (licenseResult.rows.length === 0) {
      throw new Error('License not found');
    }

    const license = licenseResult.rows[0];

    const planResult = await pool.query('SELECT * FROM plans WHERE id = $1', [planId]);
    if (planResult.rows.length === 0) {
      throw new Error('Plan not found');
    }

    const plan = planResult.rows[0];
    if (!plan.paystack_plan_code) {
      throw new Error('Plan not synced with Paystack. Admin must sync plans first.');
    }

    const hasAuthorization = license.paystack_customer_code ? true : false;
    let customerHasAuth = false;

    if (hasAuthorization) {
      try {
        const custData = await this.request(`/customer/${license.paystack_customer_code}`);
        if (custData.status && custData.data && custData.data.authorizations && custData.data.authorizations.length > 0) {
          customerHasAuth = true;
        }
      } catch (e) {
        customerHasAuth = false;
      }
    }

    if (customerHasAuth) {
      const startDate = license.expires_at ? new Date(license.expires_at).toISOString() : new Date().toISOString();

      const result = await this.request('/subscription', 'POST', {
        customer: license.paystack_customer_code,
        plan: plan.paystack_plan_code,
        start_date: startDate,
      });

      if (!result.status) {
        throw new Error(result.message || 'Failed to create subscription on Paystack');
      }

      const subData = result.data;

      await pool.query(
        `INSERT INTO subscriptions (customer_id, license_id, plan_id, paystack_subscription_code, paystack_email_token, status, next_payment_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [license.cust_id, license.id, planId, subData.subscription_code, subData.email_token, 'active', subData.next_payment_date || startDate]
      );

      return {
        success: true,
        subscriptionCode: subData.subscription_code,
        nextPaymentDate: subData.next_payment_date || startDate,
        planName: plan.name,
        planInterval: plan.interval,
      };
    }

    const result = await this.request('/transaction/initialize', 'POST', {
      email,
      amount: plan.price_cedis,
      currency: 'GHS',
      plan: plan.paystack_plan_code,
      callback_url: `${config.server.url}/api/paystack/callback`,
      metadata: {
        license_key: licenseKey,
        plan_id: planId,
        plan_name: plan.name,
        auto_renewal_setup: true,
      },
    });

    if (!result.status) {
      throw new Error(result.message || 'Failed to initialize subscription payment');
    }

    return {
      success: true,
      requiresPayment: true,
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
      message: 'Please complete the payment to activate auto-renewal. Your card will be saved for future renewals.',
    };
  }

  async changePlan(licenseKey, newPlanId) {
    const licenseResult = await pool.query(
      'SELECT l.*, c.paystack_customer_code, c.email, c.id as cust_id FROM licenses l JOIN customers c ON l.customer_id = c.id WHERE l.license_key = $1',
      [licenseKey]
    );

    if (licenseResult.rows.length === 0) {
      throw new Error('License not found');
    }

    const license = licenseResult.rows[0];

    const existingSub = await pool.query(
      `SELECT * FROM subscriptions WHERE license_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [license.id]
    );

    const newSub = await this.createSubscription(licenseKey, license.email, newPlanId);

    if (existingSub.rows.length > 0) {
      const sub = existingSub.rows[0];
      if (sub.paystack_subscription_code && sub.paystack_email_token) {
        try {
          await this.request('/subscription/disable', 'POST', {
            code: sub.paystack_subscription_code,
            token: sub.paystack_email_token,
          });
        } catch (disableErr) {
          console.error('Failed to disable old subscription:', disableErr);
        }
      }
      await pool.query(
        `UPDATE subscriptions SET status = 'cancelled' WHERE id = $1`,
        [sub.id]
      );
    }

    return newSub;
  }

  async toggleAutoRenew(licenseKey, enable) {
    const licenseResult = await pool.query(
      'SELECT id FROM licenses WHERE license_key = $1',
      [licenseKey]
    );

    if (licenseResult.rows.length === 0) {
      throw new Error('License not found');
    }

    const sub = await pool.query(
      `SELECT * FROM subscriptions WHERE license_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [licenseResult.rows[0].id]
    );

    if (sub.rows.length === 0) {
      throw new Error('No subscription found for this license');
    }

    const subscription = sub.rows[0];
    
    if (!subscription.paystack_subscription_code || !subscription.paystack_email_token) {
      throw new Error('Subscription details incomplete');
    }

    const endpoint = enable ? '/subscription/enable' : '/subscription/disable';
    const result = await this.request(endpoint, 'POST', {
      code: subscription.paystack_subscription_code,
      token: subscription.paystack_email_token,
    });

    if (!result.status) {
      throw new Error(result.message || `Failed to ${enable ? 'enable' : 'disable'} subscription`);
    }

    const newStatus = enable ? 'active' : 'cancelled';
    await pool.query(
      `UPDATE subscriptions SET status = $1 WHERE id = $2`,
      [newStatus, subscription.id]
    );

    return { success: true, autoRenew: enable, status: newStatus };
  }
}

module.exports = new PaystackService();
