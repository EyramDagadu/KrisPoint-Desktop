---
name: License server deployment quirks
description: Critical production deployment issues and fixes for the license-server subdirectory
---

## Issues encountered during license-server deployment

### BASE_URL in admin.html
The admin dashboard used `window.location.origin + '/license-server'` as BASE_URL. The `/license-server` prefix only exists in dev (Vite proxy). In production the API is at the root.
**Fix:** Detect dynamically — use prefix only if `window.location.pathname.startsWith('/license-server')`.

### Subdirectory node_modules
Replit deployment only runs `npm install` at the project root. `license-server/node_modules` is NOT installed automatically.
**Fix:** Set build command to `bash -c "cd license-server && npm install"`.

### Migrations not auto-run
`migrate.js` was a standalone script — `index.js` never called it. Tables and admin user were never created in production.
**Fix:** Export `migrate` function from migrate.js, import and await it in index.js before `app.listen()`.

### Secrets not in production
ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET were missing from Replit Secrets entirely (not just production). Migration fell back to `admin@krispoint.com` / `admin123`.
**Fix:** Request secrets via `requestEnvVar`, then delete the default admin row from DB so migration re-creates it with real credentials.

**Why:** Secrets in Replit are global (not environment-scoped) but must be explicitly added — they don't carry over automatically.

## Deployment config (working)
- Target: `autoscale`
- Build: `["bash", "-c", "cd license-server && npm install"]`
- Run: `["node", "license-server/src/index.js"]`

## Production URLs
- Replit: `https://kris-point-teaching-hospital-whisper-license.replit.app`
- Custom domain: `https://license.krispoint.com.gh` (CNAME → replit.app, DNS-only in Cloudflare)
