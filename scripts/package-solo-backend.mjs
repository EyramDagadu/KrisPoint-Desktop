import { cp, chmod, copyFile, mkdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const output = new URL('../solo-runtime/', import.meta.url);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await new Promise((resolve, reject) => {
  const ncc = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['ncc', 'build', 'build/index.js', '-o', 'solo-runtime'],
    { cwd: root, stdio: 'inherit' }
  );
  ncc.on('error', reject);
  ncc.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`ncc exited with ${code}`)));
});

// ncc follows dynamically resolved asset paths. Runtime recordings and
// uploads must never become installer resources, even if a developer has
// local files in those directories.
for (const runtimeData of ['audio', 'uploads', 'data', 'backups']) {
  await rm(new URL(`./${runtimeData}/`, output), { recursive: true, force: true });
}

// Adapter-node serves these directories at runtime. ncc bundles JavaScript
// dependencies, while client/prerendered remain ordinary static resources.
await cp(new URL('../build/client/', import.meta.url), new URL('./client/', output), { recursive: true });
await cp(new URL('../build/prerendered/', import.meta.url), new URL('./prerendered/', output), { recursive: true });

const runtimeName = process.platform === 'win32' ? 'node.exe' : 'node';
const runtimePath = join(fileURLToPath(output), runtimeName);
await copyFile(process.execPath, runtimePath);
if (process.platform !== 'win32') await chmod(runtimePath, 0o755);