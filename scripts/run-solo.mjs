import { spawn } from 'node:child_process';

const [script, ...args] = process.argv.slice(2);
if (!script) {
  console.error('Usage: node scripts/run-solo.mjs <npm-script> [args...]');
  process.exit(1);
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const building = script === 'build';
const child = spawn(pnpm, ['--filter', '@workspace/krispoint', 'run', script, ...(args.length ? ['--', ...args] : [])], {
  env: {
    ...process.env,
    VITE_KRISPOINT_EDITION: process.env.VITE_KRISPOINT_EDITION || 'solo',
    // SvelteKit imports server hooks while analysing the production build.
    // Real keys are generated and injected by Tauri only when the app runs.
    ...(building ? {
      SOLO_ENCRYPTION_KEY: 'build-only-not-used-at-runtime-00000000000000000000000000000000',
      SOLO_AUDIT_KEY: 'build-only-not-used-at-runtime-0000000000000000000000000000000000'
    } : {})
  },
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

child.on('error', (error) => {
  console.error(`Failed to run Solo ${script}:`, error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});