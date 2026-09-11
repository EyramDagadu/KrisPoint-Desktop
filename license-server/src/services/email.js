const nodemailer = require('nodemailer');
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = null;
    this.from = config.smtp.from || 'KrisPoint Licensing <info@krispoint.com.gh>';
    this._init();
  }

  _init() {
    const { host, user, pass, port, secure } = config.smtp;
    if (!host || !user || !pass) {
      console.warn('[Email] SMTP not fully configured — emails will be logged but not sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS.');
      return;
    }
    this.transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    console.log(`[Email] SMTP ready (${host}:${port})`);
  }

  _isConfigured() {
    return !!this.transporter;
  }

  async sendLicenseEmail(email, licenseKey, planName, expiresAt) {
    const expiryDate = new Date(expiresAt).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    if (!this._isConfigured()) {
      console.warn(`[Email] SMTP not configured. License key for ${email}: ${licenseKey} (expires ${expiryDate})`);
      return { success: true };
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your KrisPoint License Key</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1e293b;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:3px;text-transform:uppercase;">KrisPoint HealthTech Ltd.</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;">Your License is Ready ✓</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 24px;font-size:15px;color:#cbd5e1;line-height:1.7;">
                Thank you for subscribing to <strong style="color:#f1f5f9;">KrisPoint ${planName}</strong>.
                Your license key is below — keep it safe, as you will need it to activate KrisPoint on your hospital server.
              </p>

              <!-- License Key -->
              <div style="background:#0f172a;border:1px solid #334155;border-left:4px solid #0ea5e9;border-radius:8px;padding:22px 24px;margin:0 0 24px;text-align:center;">
                <p style="margin:0 0 10px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:2px;">License Key</p>
                <p style="margin:0;font-size:16px;font-weight:700;color:#0ea5e9;letter-spacing:3px;word-break:break-all;font-family:'Courier New',monospace;">${licenseKey}</p>
              </div>

              <!-- Plan Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;background:#0f172a;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 18px;border-bottom:1px solid #1e293b;">
                    <span style="font-size:13px;color:#64748b;">Plan</span>
                    <span style="float:right;font-size:13px;color:#f1f5f9;font-weight:600;">${planName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 18px;">
                    <span style="font-size:13px;color:#64748b;">Valid Until</span>
                    <span style="float:right;font-size:13px;color:#f1f5f9;font-weight:600;">${expiryDate}</span>
                  </td>
                </tr>
              </table>

              <!-- Activation Steps -->
              <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;">How to Activate</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="30" valign="top">
                    <div style="width:24px;height:24px;background:#0ea5e9;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">1</div>
                  </td>
                  <td style="padding:2px 0 14px 10px;font-size:14px;color:#cbd5e1;">Open KrisPoint on your server and go to <strong style="color:#f1f5f9;">Settings → License</strong></td>
                </tr>
                <tr>
                  <td width="30" valign="top">
                    <div style="width:24px;height:24px;background:#0ea5e9;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">2</div>
                  </td>
                  <td style="padding:2px 0 14px 10px;font-size:14px;color:#cbd5e1;">Click <strong style="color:#f1f5f9;">Activate License</strong> and paste the key above</td>
                </tr>
                <tr>
                  <td width="30" valign="top">
                    <div style="width:24px;height:24px;background:#0ea5e9;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">3</div>
                  </td>
                  <td style="padding:2px 0 0 10px;font-size:14px;color:#cbd5e1;">Voice dictation, AI polish, templates, macros, and chat unlock instantly</td>
                </tr>
              </table>

              <!-- Support -->
              <div style="margin-top:30px;padding:16px 18px;background:#0f172a;border-radius:8px;border:1px solid #1e293b;">
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                  Need help? Reply to this email or reach us at
                  <a href="mailto:info@krispoint.com.gh" style="color:#0ea5e9;text-decoration:none;">info@krispoint.com.gh</a>.
                  We respond within 24 hours.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 40px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.8;">
                KrisPoint HealthTech Ltd. · Accra, Ghana<br />
                <a href="https://krispoint.com.gh" style="color:#0ea5e9;text-decoration:none;">krispoint.com.gh</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `
KrisPoint License Key
=====================
Thank you for subscribing to KrisPoint ${planName}.

License Key: ${licenseKey}
Plan:        ${planName}
Valid Until: ${expiryDate}

HOW TO ACTIVATE:
1. Open KrisPoint and go to Settings → License
2. Click "Activate License" and paste your license key
3. All premium features unlock immediately

Need help? Reply to this email or contact info@krispoint.com.gh

KrisPoint HealthTech Ltd. · Accra, Ghana · krispoint.com.gh
`.trim();

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: `Your KrisPoint ${planName} License Key`,
        text,
        html,
      });
      console.log(`[Email] License key delivered to ${email}`);
      return { success: true };
    } catch (err) {
      console.error(`[Email] Failed to send license email to ${email}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  async sendRenewalConfirmation(email, licenseKey, planName, newExpiresAt) {
    const expiryDate = new Date(newExpiresAt).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    if (!this._isConfigured()) {
      console.warn(`[Email] SMTP not configured. Renewal confirmation for ${email} — new expiry: ${expiryDate}`);
      return { success: true };
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>License Renewed</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1e293b;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#10b981 0%,#0ea5e9 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:3px;text-transform:uppercase;">KrisPoint HealthTech Ltd.</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;">License Renewed ✓</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 24px;font-size:15px;color:#cbd5e1;line-height:1.7;">
                Your <strong style="color:#f1f5f9;">KrisPoint ${planName}</strong> license has been successfully renewed.
              </p>
              <div style="background:#0f172a;border:1px solid #334155;border-left:4px solid #10b981;border-radius:8px;padding:22px 24px;text-align:center;margin:0 0 24px;">
                <p style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:2px;">New Expiry Date</p>
                <p style="margin:0;font-size:22px;font-weight:700;color:#10b981;">${expiryDate}</p>
              </div>
              <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
                Your license key remains unchanged — no action is needed. KrisPoint will continue working without interruption.
              </p>
              <div style="padding:16px 18px;background:#0f172a;border-radius:8px;border:1px solid #1e293b;">
                <p style="margin:0;font-size:13px;color:#64748b;">
                  Questions? <a href="mailto:info@krispoint.com.gh" style="color:#0ea5e9;text-decoration:none;">info@krispoint.com.gh</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 40px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                KrisPoint HealthTech Ltd. · <a href="https://krispoint.com.gh" style="color:#0ea5e9;text-decoration:none;">krispoint.com.gh</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: `KrisPoint ${planName} — License Renewed Successfully`,
        text: `Your KrisPoint ${planName} license has been renewed.\n\nNew expiry: ${expiryDate}\n\nYour license key (${licenseKey}) is unchanged — no action needed.\n\nKrisPoint HealthTech Ltd. · krispoint.com.gh`,
        html,
      });
      console.log(`[Email] Renewal confirmation delivered to ${email}`);
      return { success: true };
    } catch (err) {
      console.error(`[Email] Failed to send renewal email to ${email}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  async sendExpiryReminder(email, licenseKey, daysRemaining) {
    if (!this._isConfigured()) {
      console.warn(`[Email] SMTP not configured. Expiry reminder skipped for ${email} (${daysRemaining} days left).`);
      return { success: true };
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>License Expiring Soon</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1e293b;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b 0%,#ef4444 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.8);letter-spacing:3px;text-transform:uppercase;">KrisPoint HealthTech Ltd.</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;">License Expiring in ${daysRemaining} Days</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 24px;font-size:15px;color:#cbd5e1;line-height:1.7;">
                Your KrisPoint license will expire in <strong style="color:#f1f5f9;">${daysRemaining} days</strong>.
                Renew now to keep voice dictation, AI polish, templates, and all premium features running without interruption.
              </p>
              <p style="text-align:center;margin:0 0 24px;">
                <a href="${config.server.url}/renew?key=${licenseKey}"
                   style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
                  Renew My License
                </a>
              </p>
              <div style="padding:16px 18px;background:#0f172a;border-radius:8px;border:1px solid #1e293b;">
                <p style="margin:0;font-size:13px;color:#64748b;">
                  Need help? <a href="mailto:info@krispoint.com.gh" style="color:#0ea5e9;text-decoration:none;">info@krispoint.com.gh</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 40px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                KrisPoint HealthTech Ltd. · <a href="https://krispoint.com.gh" style="color:#0ea5e9;text-decoration:none;">krispoint.com.gh</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: `Action Required: KrisPoint License Expires in ${daysRemaining} Days`,
        text: `Your KrisPoint license expires in ${daysRemaining} days.\n\nRenew at: ${config.server.url}/renew?key=${licenseKey}\n\nKrisPoint HealthTech Ltd. · krispoint.com.gh`,
        html,
      });
      console.log(`[Email] Expiry reminder delivered to ${email} (${daysRemaining} days remaining)`);
      return { success: true };
    } catch (err) {
      console.error(`[Email] Failed to send expiry reminder to ${email}:`, err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new EmailService();
