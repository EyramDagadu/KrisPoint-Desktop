require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const migrate = require('./db/migrate');

const licenseRoutes = require('./routes/license');
const paystackRoutes = require('./routes/paystack');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use((req, res, next) => {
  if (req.path === '/api/paystack/webhook') {
    return next();
  }
  express.json()(req, res, next);
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/license', licenseRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  res.json({
    paystackPublicKey: config.paystack.publicKey,
    serverUrl: config.server.url,
  });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/payment/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/payment/failed', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = config.server.port;

migrate()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`KrisPoint License Server running on port ${PORT}`);
      console.log(`Admin dashboard: ${config.server.url}/admin`);
      console.log(`Purchase page: ${config.server.url}/`);
    });
  })
  .catch((err) => {
    console.error('Failed to run migrations, aborting startup:', err);
    process.exit(1);
  });
