import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('Solo installer owns embedded backend and voice runtimes', async () => {
  const [config, backend, voice] = await Promise.all([
    read('src-tauri/tauri.conf.json'),
    read('src-tauri/src/backend.rs'),
    read('src-tauri/src/voice_server.rs')
  ]);
  assert.match(config, /solo-runtime/);
  assert.match(config, /voice-runtime/);
  assert.match(backend, /Command::new\(runtime\)/);
  assert.match(backend, /process\.kill\(\)/);
  assert.match(voice, /TcpListener::bind\(\("127\.0\.0\.1", 0\)\)/);
  assert.match(voice, /VOICE_HEALTH_TOKEN/);
  assert.match(voice, /VOICE_CLIENT_TOKEN/);
  assert.match(voice, /verify_slice/);
  assert.match(voice, /Some\(voice_url\(port, &health_token\)\)/);
  assert.match(backend, /KRISPOINT_PARENT_PID/);
  assert.match(voice, /KRISPOINT_PARENT_PID/);
});

test('release bundles target Windows and macOS installers', async () => {
  const config = JSON.parse(await read('src-tauri/tauri.conf.json'));
  assert.equal(config.bundle.targets, 'all');
  assert.equal(config.bundle.windows.nsis.installMode, 'currentUser');
  assert.equal(config.bundle.macOS.hardenedRuntime, true);
  assert.equal(config.bundle.macOS.signingIdentity, '-');
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
  const [requirements, engine] = await Promise.all([
    read('vosk-server/requirements.txt'),
    read('vosk-server/src/medasr_stream_engine.py')
  ]);
  assert.match(requirements, /^torch==2\.7\.1$/m);
  assert.match(engine, /_MEIPASS/);
  assert.match(engine, /local_files_only/);
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
  assert.match(windows, /DomainAuthenticated[\s\S]*Domain/);
  assert.match(macos, /block drop out all/);
  assert.match(macos, /codesign --verify --strict "\$app"/);
  assert.doesNotMatch(macos, /codesign --verify --deep/);
  for (const script of [windows, macos]) {
    assert.match(script, /verify-installed-voice\.py/);
    assert.match(script, /session_1766430738966_1urld97w9\.wav/);
  }
  assert.match(smoke, /token=invalid/);
  assert.match(smoke, /hmac\.compare_digest/);
  assert.match(smoke, /message\.get\("type"\) == "transcription"/);
  assert.match(smoke, /TRANSFORMERS_OFFLINE/);
  assert.match(smoke, /KRISPOINT_OFFLINE_VOICE_SMOKE_RESULT/);
});