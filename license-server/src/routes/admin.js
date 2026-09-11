const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const config = require('../config');
const licenseService = require('../services/license');
const paystackService = require('../services/paystack');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.use(authMiddleware);

router.get('/dashboard', async (req, res) => {
  try {
    const [licenses, customers, payments, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM licenses'),
      pool.query('SELECT COUNT(*) FROM customers'),
      pool.query('SELECT COUNT(*) FROM payments WHERE status = $1', ['success']),
      pool.query('SELECT COALESCE(SUM(amount_cedis), 0) as total FROM payments WHERE status = $1', ['success']),
    ]);

    const recentPayments = await pool.query(`
      SELECT p.*, c.email, c.name 
      FROM payments p 
      JOIN customers c ON p.customer_id = c.id 
      ORDER BY p.created_at DESC 
      LIMIT 10
    `);

    const expiringLicenses = await pool.query(`
      SELECT l.*, c.email, c.name 
      FROM licenses l 
      JOIN customers c ON l.customer_id = c.id 
      WHERE l.expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      AND l.status = 'active'
      ORDER BY l.expires_at
    `);

    res.json({
      stats: {
        totalLicenses: parseInt(licenses.rows[0].count),
        totalCustomers: parseInt(customers.rows[0].count),
        totalPayments: parseInt(payments.rows[0].count),
        totalRevenue: parseInt(revenue.rows[0].total),
      },
      recentPayments: recentPayments.rows,
      expiringLicenses: expiringLicenses.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/licenses', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT l.*, c.email, c.name, c.organization, p.name as plan_name
      FROM licenses l
      JOIN customers c ON l.customer_id = c.id
      JOIN plans p ON l.plan_id = p.id
    `;

    const params = [];
    if (status) {
      query += ' WHERE l.status = $1';
      params.push(status);
    }

    query += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM licenses' + (status ? ' WHERE status = $1' : ''), status ? [status] : []);

    res.json({
      licenses: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (err) {
    console.error('Licenses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/licenses/create', async (req, res) => {
  try {
    const { email, name, organization, planId, expiresAt } = req.body;

    let customerResult = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    
    if (customerResult.rows.length === 0) {
      customerResult = await pool.query(
        'INSERT INTO customers (email, name, organization) VALUES ($1, $2, $3) RETURNING *',
        [email, name, organization]
      );
    }

    const customerId = customerResult.rows[0].id;
    const license = await licenseService.createLicense(customerId, planId, new Date(expiresAt));

    res.json({ success: true, license });
  } catch (err) {
    console.error('Create license error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/licenses/:id/revoke', async (req, res) => {
  try {
    const license = await pool.query('SELECT license_key FROM licenses WHERE id = $1', [req.params.id]);
    
    if (license.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    await licenseService.revokeLicense(license.rows[0].license_key);
    res.json({ success: true });
  } catch (err) {
    console.error('Revoke error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/licenses/:id/renew', async (req, res) => {
  try {
    const { expiresAt } = req.body;
    const license = await pool.query('SELECT license_key FROM licenses WHERE id = $1', [req.params.id]);
    
    if (license.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    await licenseService.renewLicense(license.rows[0].license_key, new Date(expiresAt));
    res.json({ success: true });
  } catch (err) {
    console.error('Renew error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/licenses/:id/deactivate', async (req, res) => {
  try {
    const license = await pool.query('SELECT license_key FROM licenses WHERE id = $1', [req.params.id]);
    
    if (license.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    await licenseService.deactivateLicense(license.rows[0].license_key);
    res.json({ success: true });
  } catch (err) {
    console.error('Deactivate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/customers', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM licenses WHERE customer_id = c.id) as license_count,
        (SELECT SUM(amount_cedis) FROM payments WHERE customer_id = c.id AND status = 'success') as total_paid
       FROM customers c
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM customers');

    res.json({
      customers: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (err) {
    console.error('Customers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT p.*, c.email, c.name, l.license_key
       FROM payments p
       JOIN customers c ON p.customer_id = c.id
       LEFT JOIN licenses l ON p.license_id = l.id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM payments');

    res.json({
      payments: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (err) {
    console.error('Payments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plans ORDER BY price_cedis');
    res.json(result.rows);
  } catch (err) {
    console.error('Plans error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const { name, description, priceCedis, interval, features } = req.body;

    const result = await pool.query(
      `INSERT INTO plans (name, description, price_cedis, interval, features)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, priceCedis, interval, JSON.stringify(features)]
    );

    res.json({ success: true, plan: result.rows[0] });
  } catch (err) {
    console.error('Create plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/plans/sync-paystack', async (req, res) => {
  try {
    await paystackService.syncPlans();
    res.json({ success: true, message: 'Plans synced with Paystack' });
  } catch (err) {
    console.error('Sync plans error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const result = await pool.query('SELECT * FROM admin_users WHERE id = $1', [req.admin.id]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [newHash, req.admin.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
