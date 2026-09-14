import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const appPath = path => /^(src\/|vite\.config\.js$)/.test(path)
  ? `artifacts/krispoint/${path}`
  : path;
const read = path => readFile(new URL(`../../${appPath(path)}`, import.meta.url), 'utf8');

test('Solo installer owns embedded backend and voice runtimes', async () => {
  const [config, backend, voice] = await Promise.all([
    read('src-tauri/tauri.conf.json'),
    read('src-tauri/src/backend.rs'),
    read('src-tauri/src/voice_server.rs')
  ]);
  assert.match(config, /solo-runtime/);
  assert.match(config, /voice-runtime/);
  assert.match(backend, /Command::new\(runtime\)/);
  assert.match(backend, /command\.current_dir\(runtime_dir\)\.arg\("index\.js"\)/);
  assert.match(backend, /backend\.log/);
  assert.match(backend, /backend_log_tail/);
  assert.doesNotMatch(backend, /\.stderr\(Stdio::null\(\)\)/);
  assert.match(backend, /process\.kill\(\)/);
  assert.match(voice, /TcpListener::bind\(\("127\.0\.0\.1", 0\)\)/);
  assert.match(voice, /VOICE_HEALTH_TOKEN/);
  assert.match(voice, /VOICE_CLIENT_TOKEN/);
  assert.match(voice, /verify_slice/);
  assert.match(voice, /voice\.log/);
  assert.match(voice, /process_log_tail/);
  assert.match(voice, /for _ in 0\.\.600/);
  assert.match(voice, /KRISPOINT_OFFLINE_VOICE_SMOKE_LOG/);
  assert.match(voice, /PYTHONUNBUFFERED/);
  assert.doesNotMatch(voice, /\.stderr\(Stdio::null\(\)\)/);
  assert.match(voice, /executable[\s\S]*\.parent\(\)[\s\S]*working_dir/);
  assert.match(voice, /Some\(voice_url\(port, &health_token\)\)/);
  assert.match(backend, /KRISPOINT_PARENT_PID/);
  assert.match(voice, /KRISPOINT_PARENT_PID/);
});

test('release bundles target Windows and macOS installers', async () => {
  const [configSource, workflow, packageSource] = await Promise.all([
    read('src-tauri/tauri.conf.json'),
    read('.github/workflows/solo-installers.yml'),
    read('package.json')
  ]);
  const config = JSON.parse(configSource);
  const packageJson = JSON.parse(packageSource);
  assert.equal(config.bundle.targets, 'all');
  assert.equal(config.bundle.windows.nsis.installMode, 'currentUser');
  assert.equal(config.bundle.macOS.hardenedRuntime, true);
  assert.equal(config.bundle.macOS.signingIdentity, '-');
  assert.equal(config.bundle.licenseFile, 'beta-terms.rtf');
  assert.equal(packageJson.scripts['build:solo:installer'], 'tauri build');
  assert.match(workflow, /artifact: windows-x64\s+bundle: msi/);
  assert.match(workflow, /artifact: macos-apple-silicon\s+bundle: dmg/);
  assert.match(workflow, /pnpm exec tauri build --bundles \$\{\{ matrix\.bundle \}\}/);
  assert.doesNotMatch(
    workflow,
    /tauri build -- --bundles/,
    'bundle selection must be parsed by Tauri rather than forwarded to Cargo'
  );
  assert.ok(
    workflow.indexOf('pnpm/action-setup@v4') < workflow.indexOf('cache: pnpm'),
    'CI must install pnpm before setup-node initializes the pnpm cache'
  );
  assert.match(workflow, /if: success\(\)\s+uses: actions\/upload-artifact@v4/);
  assert.doesNotMatch(workflow, /bundle\/nsis/);
});

test('Solo beta requires explicit acceptance before use', async () => {
  const [gate, terms, layout, installerTerms] = await Promise.all([
    read('src/lib/components/legal/BetaTermsGate.svelte'),
    read('src/lib/config/betaTerms.js'),
    read('src/routes/+layout.svelte'),
    read('src-tauri/beta-terms.rtf')
  ]);
  assert.match(layout, /<BetaTermsGate>/);
  assert.match(gate, /type="checkbox"/);
  assert.match(gate, /disabled=\{!accepted\}/);
  assert.match(gate, /localStorage\.setItem\(BETA_TERMS_STORAGE_KEY/);
  assert.match(gate, /\{:else\}\s+<slot \/>/);
  assert.match(terms, /testing only/i);
  assert.match(terms, /de-identified test data/i);
  assert.match(terms, /not yet code-signed or notarized/i);
  assert.match(terms, /not the final commercial release/i);
  assert.match(installerTerms, /KrisPoint Solo Beta Participation Terms/);
  assert.match(installerTerms, /Do not use this beta for real patient care/);
});

test('tagged Solo releases require trusted signing and notarization', async () => {
  const [workflow, windowsSigning, macSigning] = await Promise.all([
    read('.github/workflows/solo-installers.yml'),
    read('scripts/prepare-solo-windows-signing.ps1'),
    read('scripts/prepare-solo-macos-signing.sh')
  ]);
  assert.match(workflow, /startsWith\(github\.ref, 'refs\/tags\/solo-v'\)/);
  assert.match(workflow, /Get-AuthenticodeSignature/);
  assert.match(workflow, /signtool verify \/pa \/all \/v/);
  assert.match(workflow, /xcrun notarytool submit/);
  assert.match(workflow, /xcrun stapler staple/);
  assert.match(workflow, /xcrun stapler validate/);
  assert.match(workflow, /file "\$\{executable\}" \| grep -q 'Mach-O'/);
  assert.match(workflow, /codesign --verify --strict --verbose=2 "\$\{executable\}"/);
  assert.match(windowsSigning, /Required release secret/);
  assert.match(windowsSigning, /Import-PfxCertificate/);
  assert.match(windowsSigning, /certificateThumbprint/);
  assert.match(windowsSigning, /KRISPOINT_LICENSE_PUBLIC_KEY/);
  assert.match(macSigning, /Developer ID|APPLE_SIGNING_IDENTITY/);
  assert.match(macSigning, /security import/);
  assert.match(macSigning, /tauri\.signed\.conf\.json/);
  assert.match(macSigning, /KRISPOINT_LICENSE_PUBLIC_KEY/);
});

test('Solo licensing uses protected native identity and bounded online validation', async () => {
  const [identity, nativeCommands, licenseStore, licenseService] = await Promise.all([
    read('src-tauri/src/device_identity.rs'),
    read('src-tauri/src/lib.rs'),
    read('src/lib/stores/licenseStore.js'),
    read('license-server/src/services/license.js')
  ]);
  assert.match(identity, /license-device-identity-v2/);
  assert.match(identity, /read_credential/);
  assert.match(identity, /set_credential/);
  assert.match(identity, /KP2-/);
  assert.match(nativeCommands, /device_identity::get_solo_machine_id/);
  assert.match(licenseStore, /invoke\('get_solo_machine_id'\)/);
  assert.match(licenseStore, /VALIDATION_INTERVAL_MS = 6 \* 60 \* 60 \* 1000/);
  assert.match(licenseStore, /OFFLINE_GRACE_MS = 72 \* 60 \* 60 \* 1000/);
  assert.match(licenseStore, /CLOCK_ROLLBACK_TOLERANCE_MS/);
  assert.match(licenseStore, /lastValidated: signedData\.validatedAt \|\| signedData\.issuedAt/);
  assert.match(licenseStore, /offlineGraceUntil: legacyGraceUntil\(data\.license, signedData\)/);
  assert.match(licenseStore, /setInterval\(\(\) => actions\.validateOnline\(\)/);
  assert.match(licenseStore, /verifyLicenseEnvelope\(data\.license/);
  assert.match(licenseStore, /VITE_KRISPOINT_LICENSE_PUBLIC_KEY/);
  assert.match(licenseStore, /License authority key does not match this KrisPoint release/);
  assert.match(licenseService, /machineId: licenseData\.machineId/);
  assert.match(licenseService, /offlineGraceUntil/);
  assert.match(licenseService, /License is already activated on another device/);
  assert.match(licenseService, /isLegacySoloMigration/);
});

test('guided setup activates pinned pnpm before installing workspace dependencies', async () => {
  const [mac, windows] = await Promise.all([
    read('scripts/setup-local-macos.sh'),
    read('scripts/setup-local-windows.ps1')
  ]);
  for (const source of [mac, windows]) {
    assert.match(source, /corepack prepare pnpm@10\.26\.1 --activate/);
    assert.ok(
      source.indexOf('corepack prepare pnpm@10.26.1 --activate') <
        source.indexOf('pnpm install --frozen-lockfile'),
      'Guided setup must provision pnpm before first use'
    );
  }
});

test('packaged Solo does not invoke system Node, Python, or PostgreSQL', async () => {
  const [backend, voice] = await Promise.all([
    read('src-tauri/src/backend.rs'),
    read('src-tauri/src/voice_server.rs')
  ]);
  assert.doesNotMatch(backend, /Command::new\("(node|npm|psql)"/);
  assert.match(voice, /cfg!\(debug_assertions\)/);
  assert.match(voice, /krispoint-voice/);
});

test('backend packaging excludes local runtime and clinical data', async () => {
  const packager = await read('scripts/package-solo-backend.mjs');
  for (const directory of ['audio', 'uploads', 'data', 'backups']) {
    assert.match(packager, new RegExp(`'${directory}'`));
  }
  assert.match(packager, /recursive: true, force: true/);
});

test('MedASR uses a released cross-platform PyTorch version', async () => {
  const [requirements, engine, server] = await Promise.all([
    read('vosk-server/requirements.txt'),
    read('vosk-server/src/medasr_stream_engine.py'),
    read('vosk-server/src/websocket_server.py')
  ]);
  assert.match(requirements, /^torch==2\.7\.1$/m);
  assert.match(engine, /_MEIPASS/);
  assert.match(engine, /local_files_only/);
  assert.match(server, /configure_output_streams\(\)/);
  assert.match(server, /reconfigure\(errors="backslashreplace"\)/);
});

test('Solo vendors OpenSSL for portable encrypted backup builds', async () => {
  const manifest = await read('src-tauri/Cargo.toml');
  assert.match(manifest, /openssl\s*=\s*\{\s*version\s*=\s*"0\.10",\s*features\s*=\s*\["vendored"\]\s*\}/);
});

test('voice watchdog uses a non-destructive Windows process handle probe', async () => {
  const watchdog = await read('vosk-server/src/parent_watchdog.py');
  assert.match(watchdog, /OpenProcess/);
  assert.match(watchdog, /WaitForSingleObject/);
  assert.doesNotMatch(watchdog, /os\.kill\(parent_pid, 0\)[\s\S]*os\.name == "nt"/);
});

test('Tauri clears stale voice state when the sidecar exits', async () => {
  const voice = await read('src-tauri/src/voice_server.rs');
  assert.match(voice, /fn refresh_process_state/);
  assert.match(voice, /child\.try_wait\(\)/);
  assert.match(voice, /self\.update_status\(false, &message, 0\)/);
  assert.match(voice, /pub fn get_status[\s\S]*self\.refresh_process_state\(\)/);
});

test('native installer verification includes an offline authenticated transcription', async () => {
  const [windows, macos, smoke] = await Promise.all([
    read('scripts/verify-solo-installer.ps1'),
    read('scripts/verify-solo-installer-macos.sh'),
    read('scripts/verify-installed-voice.py')
  ]);
  assert.match(windows, /New-NetFirewallRule/);
  assert.match(macos, /block drop out all/);
  assert.match(macos, /codesign --verify --strict "\$app"/);
  assert.doesNotMatch(macos, /codesign --verify --deep/);
  for (const script of [windows, macos]) {
    assert.match(script, /verify-installed-voice\.py/);
    assert.match(script, /scripts\/fixtures\/medasr-smoke\.wav/);
    assert.doesNotMatch(script, /training_data\/audio/);
  }
  assert.ok((await stat(new URL('../../scripts/fixtures/medasr-smoke.wav', import.meta.url))).size > 0);
  assert.match(smoke, /token=invalid/);
  assert.match(smoke, /hmac\.compare_digest/);
  assert.match(smoke, /message\.get\("type"\) == "transcription"/);
  assert.match(smoke, /for _ in range\(9000\)/);
  assert.match(smoke, /"PATH": os\.path\.join\(os\.environ\.get\("SystemRoot", "\/usr"\), "System32"\)/);
  assert.match(smoke, /TRANSFORMERS_OFFLINE/);
  assert.match(smoke, /KRISPOINT_OFFLINE_VOICE_SMOKE_RESULT/);
  assert.match(smoke, /KRISPOINT_OFFLINE_VOICE_SMOKE_LOG/);
  assert.match(smoke, /print_voice_log\(log_path\)/);
  assert.match(smoke, /packet_bytes = 16000 \* 2 \/\/ 10/);
  assert.doesNotMatch(windows, /Start-Process \$installed\.FullName/);
  assert.doesNotMatch(windows, /Get-NetConnectionProfile/);
  assert.match(windows, /Get-NetFirewallProfile \| Where-Object \{ -not \$_.Enabled \}/);
});

test('reporting workspace does not bind an undefined addendum toggle handler', async () => {
  const workspace = await read('artifacts/krispoint/src/lib/components/reporting/ReportWorkspace.svelte');
  assert.doesNotMatch(workspace, /on:toggleAddendumWorkspace=\{toggleAddendumWorkspace\}/);
});

test('Solo permits its private local worklist while blocking collaboration APIs', async () => {
  const hooks = await read('src/hooks.server.ts');
  assert.doesNotMatch(hooks, /pathname\.startsWith\(['"]\/api\/worklist['"]\)/);
  assert.match(hooks, /pathname\.startsWith\(['"]\/api\/chat['"]\)/);
  assert.match(hooks, /pathname === ['"]\/api\/reports\/pending-reviews['"]/);
});

test('license server hostnames are normalized to HTTPS', async () => {
  const licenseStore = await read('src/lib/stores/licenseStore.js');
  assert.match(licenseStore, /`https:\/\/\$\{trimmed\}`/);
  assert.match(licenseStore, /normalizeServerUrl\(storedServerUrl\)/);
  assert.match(licenseStore, /const cleanUrl = normalizeServerUrl\(url\)/);
});

test('Hospital browser voice uses same-origin proxy while Solo keeps published URL', async () => {
  const [service, config, voiceServer] = await Promise.all([
    read('src/lib/services/WhisperVoiceService.ts'),
    read('vite.config.js'),
    read('src-tauri/src/voice_server.rs')
  ]);
  assert.match(service, /window\.location\.host\}\/voice/);
  assert.match(service, /__KRISPOINT_VOICE_URL__/);
  assert.match(config, /target: ['"]ws:\/\/127\.0\.0\.1:8000['"]/);
  assert.match(config, /VOICE_CLIENT_TOKEN/);
  assert.match(config, /VITE_KRISPOINT_EDITION !== ['"]solo['"]/);
  assert.match(config, /verifyVoiceTicket\(ticket\) \? voiceClientToken/);
  assert.match(config, /encodeURIComponent\(token/);
  assert.match(voiceServer, /Some\(voice_url\(port, &health_token\)\)/);
  assert.match(service, /createScriptProcessor\(2048, 1, 1\)/);
  assert.doesNotMatch(service, /createScriptProcessor\(8192, 1, 1\)/);
});

test('Solo and Hospital MedASR share pause-triggered endpoint detection', async () => {
  const [engine, voicePackaging] = await Promise.all([
    read('vosk-server/src/medasr_stream_engine.py'),
    read('scripts/package-solo-voice.mjs')
  ]);
  assert.match(engine, /MEDASR_VAD_SILENCE_SECONDS/);
  assert.match(engine, /def _flush_for_stop/);
  assert.match(engine, /_silence_samples >= self\.sample_rate \* self\.vad_silence_seconds/);
  assert.doesNotMatch(engine, /self\.sample_rate \* 3/);
  assert.match(voicePackaging, /vosk-server['"], ['"]src/);
});

test('voice stop cleanup does not block the asyncio event loop', async () => {
  const server = await read('vosk-server/src/websocket_server.py');
  assert.match(server, /asyncio\.wait_for\(asyncio\.to_thread\(engine\.stop_processing\)/);
  assert.match(server, /Timed out stopping/);
});
