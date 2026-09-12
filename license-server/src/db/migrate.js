const pool = require('./pool');
const bcrypt = require('bcryptjs');
const config = require('../config');

const migrations = `
-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  organization VARCHAR(255),
  paystack_customer_code VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_cedis INTEGER NOT NULL,
  interval VARCHAR(50) NOT NULL DEFAULT 'monthly',
  paystack_plan_code VARCHAR(100),
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES plans(id),
  status VARCHAR(50) DEFAULT 'active',
  machine_id VARCHAR(255),
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_validated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  license_id INTEGER REFERENCES licenses(id) ON DELETE SET NULL,
  amount_cedis INTEGER NOT NULL,
  paystack_reference VARCHAR(100) UNIQUE,
  paystack_authorization_code VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table (for recurring)
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  license_id INTEGER REFERENCES licenses(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES plans(id),
  paystack_subscription_code VARCHAR(100),
  paystack_email_token VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  next_payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_customer ON licenses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(paystack_reference);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    await client.query(migrations);
    console.log('Migrations completed successfully!');

    // Create default admin if not exists
    const adminCheck = await client.query(
      'SELECT id FROM admin_users WHERE email = $1',
      [config.admin.email]
    );

    if (adminCheck.rows.length === 0 && config.admin.email && config.admin.password) {
      const hash = await bcrypt.hash(config.admin.password, 12);
      await client.query(
        'INSERT INTO admin_users (email, password_hash, name) VALUES ($1, $2, $3)',
        [config.admin.email, hash, 'Admin']
      );
      console.log('Default admin user created.');
    }

    // Create default plans if none exist
    const plansCheck = await client.query('SELECT id FROM plans LIMIT 1');
    if (plansCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO plans (name, description, price_cedis, interval, features) VALUES
        ('Monthly', 'Full access to all premium features', 5000, 'monthly', '["voice", "ai_polish", "chat", "templates", "macros"]'),
        ('Yearly', 'Full access - 2 months free', 50000, 'annually', '["voice", "ai_polish", "chat", "templates", "macros"]')
      `);
      console.log('Default plans created.');
    }

  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrate;
