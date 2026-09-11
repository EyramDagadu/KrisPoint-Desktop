# KrisPoint License Server

A self-hosted license server for KrisPoint with Paystack payment integration. Deploy this on your own infrastructure (Ghana Data Centre, Africa Data Centres, VPS, etc.) to manage subscriptions and licenses independently.

## Features

- **Paystack Integration**: Accept payments via Paystack (Ghana Cedis, Mobile Money)
- **License Management**: Generate, activate, validate, revoke, and renew licenses
- **Ed25519 Cryptographic Signing**: Licenses are asymmetrically signed for secure offline validation
- **Admin Dashboard**: Web-based dashboard to manage licenses, customers, and payments
- **Email Notifications**: Automatic license key delivery via email
- **Subscription Support**: Monthly and yearly recurring subscriptions
- **Machine Binding**: Licenses are bound to specific devices to prevent sharing

## Requirements

- Node.js 18+
- PostgreSQL database
- Paystack account (Ghana)
- SMTP email service (Gmail, SendGrid, etc.)

## Installation

### 1. Clone and Install Dependencies

```bash
cd license-server
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your settings:

```bash
cp .env.example .env
```

Key configurations:

- `DATABASE_URL`: Your PostgreSQL connection string
- `PAYSTACK_SECRET_KEY`: From Paystack dashboard (Settings > API Keys)
- `PAYSTACK_PUBLIC_KEY`: From Paystack dashboard
- `SMTP_*`: Your email service settings
- `ADMIN_PASSWORD`: Admin dashboard password

Note: Ed25519 signing keys are auto-generated on first start and stored in `keys/` folder. Back up these keys - they're needed to validate existing licenses.

### 3. Run Database Migration

```bash
npm run migrate
```

This creates the required tables and default plans.

### 4. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Deployment Options

### Option 1: Ghana Local Hosting (Recommended for Production)

For compliance with Ghana's Data Protection Act and hospital credibility:

**Recommended Providers:**
- Africa Data Centres (Accra) - Enterprise-grade
- Ghana Data Center (GDC) - Government-preferred
- NCS (Network Computer Systems) - Corporate focus

**Setup on Ubuntu VPS:**

```bash
# Install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm postgresql nginx certbot

# Clone and setup
git clone <your-repo>
cd license-server
npm install

# Setup environment
cp .env.example .env
nano .env  # Configure your settings

# Run migration
npm run migrate

# Use PM2 for process management
npm install -g pm2
pm2 start src/index.js --name krispoint-license
pm2 save
pm2 startup
```

**Cost estimate:** ~GH₵ 315/month for VPS + domain + backups

### Option 2: Replit Deployment (Development/Early Stage)

1. Create a new Replit project
2. Copy license-server contents
3. Add environment secrets in Replit
4. Click Deploy

### Nginx Reverse Proxy (Production)

```nginx
server {
    listen 80;
    server_name license.yourdomain.com.gh;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Add SSL with Let's Encrypt:
```bash
sudo certbot --nginx -d license.yourdomain.com.gh
```

### Paystack Webhook Configuration

In Paystack Dashboard > Settings > Webhooks, add:
```
https://license.yourdomain.com.gh/api/paystack/webhook
```

## API Endpoints

### Public Endpoints

- `GET /` - Checkout page
- `GET /admin` - Admin dashboard
- `GET /api/paystack/plans` - List available plans
- `POST /api/paystack/initialize` - Start payment flow
- `GET /api/paystack/callback` - Payment callback

### License Endpoints (for KrisPoint app)

- `POST /api/license/activate` - Activate a license
- `POST /api/license/validate` - Validate an active license
- `POST /api/license/deactivate` - Deactivate a license
- `GET /api/license` - Get public key for offline validation

### Admin Endpoints (requires auth)

- `POST /api/admin/login` - Admin login
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/licenses` - List all licenses
- `POST /api/admin/licenses` - Create manual license
- `PUT /api/admin/licenses/:id/revoke` - Revoke a license
- `GET /api/admin/customers` - List customers
- `GET /api/admin/payments` - List payments

## Premium Features

The following features require a valid license in KrisPoint:

- Voice Dictation
- AI Report Polish
- Inter-User Chat
- Templates Management
- Macros Management

## Security Architecture

### Ed25519 Asymmetric Signing

- **Private key**: Stays on license server only (in `keys/` folder)
- **Public key**: Distributed to KrisPoint installations
- **Benefit**: Clients can verify licenses offline without knowing the signing secret

### Machine Binding

Each license is bound to a specific device fingerprint, preventing license sharing across multiple installations.

### Webhook Verification

Paystack webhooks are verified using HMAC-SHA512 signatures to prevent spoofed payment events.

## Backup Strategy

Critical files to backup:
1. PostgreSQL database (daily)
2. `keys/` folder (contains signing keys)
3. `.env` file

```bash
# Daily database backup
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz
```

## Ghana-Specific Notes

- Prices are configured in Ghana Cedis (GHS)
- Paystack handles MTN Mobile Money, Vodafone Cash, and card payments
- Consider WhatsApp Business API for customer support
- Register a .com.gh domain for credibility with hospitals
