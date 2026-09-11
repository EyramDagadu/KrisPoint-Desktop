import { chmod, cp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'voice-runtime');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

if (process.env.INCLUDE_MEDASR !== '1') {
  await writeFile(resolve(output, 'README.txt'),
    'MedASR is optional. Install the KrisPoint Solo + MedASR package to enable local dictation.\n');
  process.exit(0);
}

const python = process.env.PYTHON || (process.platform === 'win32' ? 'py' : 'python3.11');
const prefix = process.platform === 'win32' && python.toLowerCase().endsWith('py') ? ['-3.11'] : [];
if (!process.env.HF_TOKEN) {
  throw new Error('INCLUDE_MEDASR=1 requires HF_TOKEN to download the gated MedASR model at build time');
}
const modelDirectory = resolve(root, '.medasr-build-model');
await rm(modelDirectory, { recursive: true, force: true });
await run(python, [
  ...prefix, '-c',
  'from huggingface_hub import snapshot_download; import sys; snapshot_download("google/medasr", local_dir=sys.argv[1])',
  modelDirectory
]);
const args = [
  ...prefix, '-m', 'PyInstaller', '--noconfirm', '--clean', '--onedir',
  '--name', 'krispoint-voice',
  '--paths', resolve(root, 'vosk-server', 'src'),
  '--collect-all', 'transformers',
  '--add-data', `${resolve(root, 'vosk-server', 'config')}${process.platform === 'win32' ? ';' : ':'}config`,
  '--add-data', `${modelDirectory}${process.platform === 'win32' ? ';' : ':'}model`,
  resolve(root, 'vosk-server', 'src', 'websocket_server.py')
];
await run(python, args);
const built = resolve(root, 'dist', 'krispoint-voice');
await stat(built);
await cp(built, output, { recursive: true });
if (process.platform !== 'win32') await chmod(resolve(output, 'krispoint-voice'), 0o755);
await rm(modelDirectory, { recursive: true, force: true });

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolvePromise() : reject(new Error(`${command} exited with ${code}`)));
  });
}