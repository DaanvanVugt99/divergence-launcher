import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import packageJson from '../package.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const appName = 'Divergence Launcher';
const arch = 'arm64';
const packageDir = path.join(repoRoot, 'out', `${appName}-darwin-${arch}`);
const appPath = path.join(packageDir, `${appName}.app`);
const zipDir = path.join(repoRoot, 'out', 'make', 'zip', 'darwin', arch);
const zipPath = path.join(zipDir, `${appName}-darwin-${arch}-${packageJson.version}.zip`);

if (process.platform !== 'darwin') {
  throw new Error('macOS ZIP creation must run on macOS.');
}

if (!fs.existsSync(appPath)) {
  throw new Error(`Missing packaged app: ${path.relative(repoRoot, appPath)}`);
}

fs.mkdirSync(zipDir, { recursive: true });
fs.rmSync(zipPath, { force: true });

execFileSync('ditto', ['-c', '-k', '--norsrc', '--keepParent', `${appName}.app`, zipPath], {
  cwd: packageDir,
  stdio: 'inherit',
});

console.log(`Created macOS ZIP: ${path.relative(repoRoot, zipPath)}`);
