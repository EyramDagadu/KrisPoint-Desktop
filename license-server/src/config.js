require('dotenv').config();

module.exports = {
  database: {
    url: process.env.LICENSE_DATABASE_URL || process.env.DATABASE_URL,
  },
  paystack: {
    secretKey: process.env.PAYSTACK_TEST_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_TEST_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY,
  },
  server: {
    port: parseInt(process.env.PORT || process.env.LICENSE_SERVER_PORT || '3001', 10),
    url: process.env.LICENSE_SERVER_URL || `http://localhost:${process.env.LICENSE_SERVER_PORT || '3001'}`,
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@krispoint.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-dev-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
};
