import { unlink } from 'node:fs/promises';

// Lifecycle scripts receive npm_config_user_agent from both pnpm and npm.
// Keep this check cross-platform and remove stale lockfiles before pnpm's
// frozen-lockfile validation, matching the former shell preinstall behavior.
const userAgent = process.env.npm_config_user_agent || '';
if (!userAgent.startsWith('pnpm/')) {
  console.error('Use pnpm for this repository (pnpm install --frozen-lockfile).');
  process.exit(1);
}

for (const file of ['package-lock.json', 'yarn.lock']) {
  try {
    await unlink(file);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}