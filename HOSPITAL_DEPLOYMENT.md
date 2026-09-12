# KrisPoint Hospital local-server deployment (Windows first)

The deployment scripts in `scripts/hospital-deploy` install a selected Git
revision as an immutable, versioned release. A small `current.txt` pointer is
swapped with a same-volume rename only after the build and database migration
finish. The Windows service always follows that pointer, so a failed update
does not replace the known-good application.

## Prerequisites

Run PowerShell **as Administrator** on the hospital server:

* Windows PowerShell 5.1 or PowerShell 7, Git, Node.js 20+, and pnpm (Corepack
  may activate the version pinned by `packageManager`).
* PostgreSQL 15+ on the server or a reachable private PostgreSQL host,
  including `psql` and `pg_dump` command-line tools. Do not expose PostgreSQL
  to the clinical LAN; permit the server's private address only.
* NSSM (`nssm.exe`) is an explicit administrator prerequisite. Windows
  `sc.exe` does not safely quote a Node command with a machine-local env file
  and does not provide the required restart/log handling. Download NSSM through
  the organisation's approved software channel, verify its checksum, and pass
  `-NssmPath C:\Tools\nssm.exe` (or put it on the administrator's PATH).

Create the application role and database with a PostgreSQL administrator:

```sql
CREATE ROLE krispoint_app LOGIN PASSWORD '<long-random-password>';
CREATE DATABASE krispoint OWNER krispoint_app;
```

Use a strong password and restrict `pg_hba.conf` to the deployment server.
The installer runs migrations as `krispoint_app`, never as the PostgreSQL
administrator.

## Clean install

The installer creates `C:\KrisPoint-Hospital\releases`, `backups`, and `logs`.
Secrets live in `C:\ProgramData\KrisPoint\hospital.env`, outside every Git
checkout. On first run it asks for `DATABASE_URL` (hidden input), generates a
64-character encryption key and a cryptographically random
`VOICE_CLIENT_TOKEN`, and sets:

```
VITE_KRISPOINT_EDITION=hospital
LICENSE_SERVER_URL=https://license.krispoint.com.gh
HOST=0.0.0.0
PORT=5000
NODE_ENV=production
```

The ACL on the env file is reduced to `SYSTEM` and local `Administrators`, and
is reapplied after generated or edited values. Do not put this file in Git, a
shared drive, a backup accessible to ordinary users, or a web root. Review
`.env.example` for variable names only. The installer intentionally does not
recommend a `-DatabaseUrl` CLI argument: a URL can expose its password in
PowerShell history, process listings, and service logs. Use the hidden prompt
or edit the protected machine-local file.

From the checkout:

```powershell
.\hospital-install.bat -Repository C:\src\KrisPoint -Revision <git-sha> `
  -NssmPath C:\Tools\nssm.exe -Port 5000 `
  -SslCertPath C:\ProgramData\KrisPoint\tls\hospital.crt `
  -SslKeyPath C:\ProgramData\KrisPoint\tls\hospital.key `
  -FirewallRemoteSubnet 192.168.1.0/24
```

The selected revision is resolved to and recorded as a full immutable
40-character commit SHA before it is cloned into its own release directory.
Every release uses `pnpm install --frozen-lockfile` and the SvelteKit
`adapter-node` production build. The service runs the **root**
`server-https.js` entrypoint (not the generated build entrypoint), preserving
`/voice`, TLS, and the authenticated voice proxy.

Before inspecting or changing the schema, `pg_dump` writes a custom-format
backup to `backups`. On a clean database (zero `public` base tables only), the
installer runs non-interactive
`pnpm --filter @workspace/krispoint run db:push -- --force`, then the additive
Hospital migration. It never runs `db:push` on an existing database. A
non-empty database missing the required `roles`, `users`, `patients`, or
`reports` base tables fails clearly and must be repaired or restored by a
database administrator.

The service is then installed as `KrisPointHospital`, configured for automatic
start, and its stdout/stderr are written under `logs`. Install and update wait
for `GET /api/health` to return HTTP 200 with JSON `status: "healthy"`.

## Update and rollback

Fetch or otherwise make the desired commit available in the repository, then
run:

```powershell
.\hospital-update.bat -Repository C:\src\KrisPoint -Revision <new-git-sha> `
  -NssmPath C:\Tools\nssm.exe
.\hospital-status.bat
```

The old service keeps serving while dependencies and the build are prepared.
The service is stopped only for the backup and transactional migration. If
anything fails, the old pointer is retained and the old service is restarted.
Every update creates a new database backup before schema changes.

Rollback changes application code only; it intentionally does **not** reverse
PostgreSQL schema migrations. This is safer for additive migrations. Select the
most recent previous release automatically or specify a release directory:

```powershell
.\hospital-rollback.bat
.\hospital-rollback.bat -Release <directory-name-under-C:\KrisPoint-Hospital\releases>
```

Use a reviewed, tested `pg_restore` procedure against a separate copy before
ever restoring a production database. The deployment logs report failures and
the current pointer is restored if rollback or service restart fails.

## Health verification, firewall, and LAN boundary

Check the service, release, and live health endpoint first:

```powershell
.\hospital-status.bat
Invoke-WebRequest http://127.0.0.1:5000/api/health -UseBasicParsing
```

`hospital-status.bat` actively probes the endpoint and exits non-zero for a
stopped service, non-200 response, or non-healthy JSON status. Verify from a
clinical workstation using the server's private LAN address, not a public
address. Organisation-issued certificate files outside Git are required. Set
`SSL_CERT_PATH` and `SSL_KEY_PATH` in the machine-local env file;
`REQUIRE_HTTPS=true` is enforced and startup fails when either file is
unavailable. The health probe detects the TLS files and uses HTTPS. The
supported production deployment never permits a LAN HTTP fallback. Port 80
redirection is disabled by default; set `ENABLE_HTTP_REDIRECT=true` only after confirming
that IIS or another reverse proxy does not own port 80. For patient data, use
HTTPS/WSS and never forward port 5000 to the Internet.

Firewall scoping is mandatory. `hospital-install.bat` requires
`-FirewallRemoteSubnet` and creates only a scoped TCP web rule (never a
database or voice rule). The equivalent rule is:

```powershell
New-NetFirewallRule -DisplayName "KrisPoint Hospital LAN" -Direction Inbound `
  -Action Allow -Protocol TCP -LocalPort 5000 -RemoteAddress 192.168.1.0/24
```

Keep PostgreSQL (normally 5432), voice (normally 8000), and any AI service
ports off the LAN firewall; this deployment must not expose them.
Back up `backups\` to an approved protected location and periodically test
restoration.

## Limited macOS portability

The checked-out application and `pnpm install --frozen-lockfile` /
`pnpm --filter @workspace/krispoint run build` are portable to macOS. The
Hospital deployment lifecycle itself is Windows-first: NSSM, Windows ACLs,
`current.txt`, and the PowerShell service scripts are not a macOS service
manager. On macOS, keep the env file outside Git with mode `0600`, use
`pg_dump` before the same migration command, and use `launchd` or an approved
process supervisor to run the built adapter-node entrypoint. Do not assume the
Windows firewall or rollback scripts apply unchanged.