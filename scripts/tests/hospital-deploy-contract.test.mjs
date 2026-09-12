import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');

test('Hospital deployment has all Windows lifecycle entrypoints and wrappers', async () => {
  const names = ['common.ps1', 'install.ps1', 'update.ps1', 'rollback.ps1', 'status.ps1', 'run-service.ps1'];
  for (const name of names) await access(new URL(`scripts/hospital-deploy/${name}`, root));
  for (const name of ['hospital-install.bat', 'hospital-update.bat', 'hospital-rollback.bat', 'hospital-status.bat']) {
    const source = await read(name);
    assert.match(source, /hospital-deploy\\(?:install|update|rollback|status)\.ps1/);
    assert.match(source, /ExecutionPolicy Bypass/);
  }
});

test('deployment contract is pnpm-only and builds adapter-node releases', async () => {
  const source = await read('scripts/hospital-deploy/common.ps1');
  assert.match(source, /pnpm install --prod=false --frozen-lockfile/);
  assert.match(source, /pnpm --filter @workspace\/krispoint run build/);
  assert.match(source, /adapter-node/);
  assert.doesNotMatch(source, /\bnpm\s+(install|run|ci)\b/);
  assert.match(source, /git clone/);
  assert.match(source, /checkout --quiet --detach/);
  assert.match(source, /current\.txt/);
  assert.match(source, /server-https\.js/);
  assert.match(source, /rev-parse --verify/);
  assert.match(source, /\{40\}/);
});

test('database initialization is clean-database-only and backed up before schema work', async () => {
  const [common, install, update] = await Promise.all([
    read('scripts/hospital-deploy/common.ps1'),
    read('scripts/hospital-deploy/install.ps1'),
    read('scripts/hospital-deploy/update.ps1')
  ]);
  assert.match(common, /psql\.exe/);
  assert.match(common, /table_schema = 'public'/);
  assert.match(common, /table_type = 'BASE TABLE'/);
  assert.match(common, /roles.*users.*patients.*reports/s);
  assert.match(common, /pnpm --filter @workspace\/krispoint run db:push -- --force/);
  assert.match(common, /Refusing db:push/);
  assert.match(install, /Invoke-DatabaseBackup[\s\S]*Invoke-SchemaInitializationAndMigration/);
  assert.match(update, /Invoke-DatabaseBackup[\s\S]*Invoke-SchemaInitializationAndMigration/);
});

test('updates back up PostgreSQL before migration and preserve the old pointer', async () => {
  const source = await read('scripts/hospital-deploy/update.ps1');
  const common = await read('scripts/hospital-deploy/common.ps1');
  assert.ok(common.indexOf('function Invoke-DatabaseBackup') < common.indexOf('function Invoke-HospitalMigration'));
  assert.match(common, /--format=custom/);
  assert.match(source, /Set-CurrentRelease \$paths \$previous/);
  assert.match(source, /Set-PreviousRelease \$paths \$previous/);
  assert.match(source, /Set-PreviousRelease \$paths \$previousRollback/);
  assert.match(source, /Start-HospitalService \$ServiceName \$log/);
  assert.match(source, /Wait-HospitalHealthy/);
});

test('default rollback uses explicit known-good history, never directory timestamps', async () => {
  const [common, update, rollback] = await Promise.all([
    read('scripts/hospital-deploy/common.ps1'),
    read('scripts/hospital-deploy/update.ps1'),
    read('scripts/hospital-deploy/rollback.ps1')
  ]);
  assert.match(common, /Previous = Join-Path \$root 'previous\.txt'/);
  assert.match(common, /function Get-PreviousRelease/);
  assert.match(common, /function Set-PreviousRelease/);
  assert.match(update, /\$previousRollback = Get-PreviousRelease \$paths/);
  assert.match(update, /Set-PreviousRelease \$paths \$previous[\s\S]*Set-CurrentRelease \$paths \$release/);
  assert.match(update, /Set-CurrentRelease \$paths \$previous[\s\S]*Set-PreviousRelease \$paths \$previousRollback/);
  assert.match(rollback, /\$target = \$previousRollback/);
  assert.match(rollback, /Set-PreviousRelease \$paths \$previous/);
  assert.doesNotMatch(rollback, /Sort-Object LastWriteTime/);
});

test('machine-local hospital environment has required fixed production values', async () => {
  const common = await read('scripts/hospital-deploy/common.ps1');
  const example = await read('.env.example');
  for (const source of [common, example]) {
    assert.match(source, /VITE_KRISPOINT_EDITION.*hospital/);
    assert.match(source, /LICENSE_SERVER_URL=https:\/\/license\.krispoint\.com\.gh/);
    assert.match(source, /HOST=0\.0\.0\.0/);
    assert.match(source, /PORT/);
  }
  assert.match(common, /New-SecureToken/);
  assert.match(common, /icacls\.exe/);
  assert.match(common, /SSL_CERT_PATH/);
  assert.match(common, /REQUIRE_HTTPS/);
  assert.match(common, /REQUIRE_HTTPS' 'true'/);
  assert.match(common, /Hospital production refuses plaintext LAN service/);
});

test('service runs the root HTTPS/voice entrypoint and NSSM settings are verified', async () => {
  const [common, runner, server] = await Promise.all([
    read('scripts/hospital-deploy/common.ps1'),
    read('scripts/hospital-deploy/run-service.ps1'),
    read('server-https.js')
  ]);
  assert.match(runner, /Join-Path \$release 'server-https\.js'/);
  assert.doesNotMatch(runner, /Join-Path \$release 'artifacts\\krispoint\\build\\index\.js'/);
  assert.match(common, /Invoke-NssmChecked/);
  assert.match(common, /nssm get \$ServiceName/);
  assert.match(server, /SSL_CERT_PATH/);
  assert.match(server, /REQUIRE_HTTPS.*true/);
  assert.match(server, /ENABLE_HTTP_REDIRECT.*true/);
  assert.match(server, /httpRedirect\.on\('error'/);
  assert.match(common, /hasTlsFiles/);
  assert.match(common, /isLoopbackProbe/);
  assert.match(common, /ServicePointManager.*ServerCertificateValidationCallback/);
  assert.match(common, /finally/);
});

test('status actively probes health and install has scoped firewall and recovery', async () => {
  const [status, install, rollback, common] = await Promise.all([
    read('scripts/hospital-deploy/status.ps1'),
    read('scripts/hospital-deploy/install.ps1'),
    read('scripts/hospital-deploy/rollback.ps1'),
    read('scripts/hospital-deploy/common.ps1')
  ]);
  assert.match(status, /Latest PostgreSQL backup/);
  assert.match(status, /Logs:/);
  assert.match(status, /Test-HospitalHealth/);
  assert.match(install, /Wait-HospitalHealthy/);
  assert.match(install, /Remove-HospitalService/);
  assert.match(install, /FirewallRemoteSubnet/);
  assert.match(install, /\[Parameter\(Mandatory = \$true\)\]\[string\]\$FirewallRemoteSubnet/);
  assert.match(install, /Ensure-HospitalEnvironment \$EnvironmentFile \$Port \$SslCertPath \$SslKeyPath/);
  assert.ok(install.indexOf('Configure-HospitalFirewall') < install.indexOf('Start-HospitalService'));
  assert.match(install, /Split-Path -Parent \$EnvironmentFile[\s\S]*New-Item -ItemType Directory[\s\S]*New-Item -ItemType File/);
  assert.match(rollback, /Set-CurrentRelease \$paths \$target[\s\S]*Start-HospitalService[\s\S]*Wait-HospitalHealthy/);
  assert.match(rollback, /Set-CurrentRelease \$paths \$previous[\s\S]*Start-HospitalService[\s\S]*Wait-HospitalHealthy/);
  assert.match(common, /LocalPort \$Port/);
  assert.doesNotMatch(common, /LocalPort 5432|LocalPort 8000/);
});

test('updates preserve the installed port and production installs include build tools', async () => {
  const [common, update, rollback, status] = await Promise.all([
    read('scripts/hospital-deploy/common.ps1'),
    read('scripts/hospital-deploy/update.ps1'),
    read('scripts/hospital-deploy/rollback.ps1'),
    read('scripts/hospital-deploy/status.ps1')
  ]);
  assert.match(common, /pnpm install --prod=false --frozen-lockfile/);
  assert.match(common, /Vite, Drizzle Kit/);
  for (const source of [update, rollback, status]) {
    assert.match(source, /\[Nullable\[int\]\]\$Port = \$null/);
    assert.match(source, /effectivePort/);
  }
  assert.match(update, /\$effectivePort = \[int\]\$env:PORT/);
  assert.match(rollback, /\$effectivePort = \[int\]\$env:PORT/);
});

test('update and rollback cannot report success for a missing or stopped service', async () => {
  const [update, rollback] = await Promise.all([
    read('scripts/hospital-deploy/update.ps1'),
    read('scripts/hospital-deploy/rollback.ps1')
  ]);
  for (const source of [update, rollback]) {
    assert.match(source, /if \(-not \$serviceBefore(?:Update|Rollback)\)/);
    assert.match(source, /is not installed/);
    assert.match(source, /\.Status -ne 'Running'/);
    assert.match(source, /is not running/);
    assert.match(source, /Start-HospitalService \$ServiceName \$log[\s\S]*Wait-HospitalHealthy \$effectivePort/);
  }
});

test('root package manager enforcement is cross-platform and pinned', async () => {
  const [packageSource, enforcement] = await Promise.all([read('package.json'), read('scripts/enforce-pnpm.mjs')]);
  assert.match(packageSource, /"packageManager":\s*"pnpm@10\.26\.1"/);
  assert.match(packageSource, /"preinstall":\s*"node scripts\/enforce-pnpm\.mjs"/);
  assert.match(enforcement, /startsWith\('pnpm\/'\)/);
  assert.doesNotMatch(packageSource, /sh -c/);
});