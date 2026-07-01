import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import packageJson from '../package.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const appName = 'Divergence Launcher';
const executableName = 'divergence-launcher.exe';
const platform = 'win32';
const arch = 'x64';
const packageDir = path.join(repoRoot, 'out', `${appName}-${platform}-${arch}`);
const exePath = path.join(packageDir, executableName);
const zipDir = path.join(repoRoot, 'out', 'make', 'zip', platform, arch);
const zipPath = path.join(zipDir, `${appName}-${platform}-${arch}-${packageJson.version}.zip`);

function quotePowerShell(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

if (process.platform !== 'win32') {
  throw new Error('Windows ZIP creation must run on Windows.');
}

if (!fs.existsSync(exePath)) {
  throw new Error(`Missing packaged executable: ${path.relative(repoRoot, exePath)}`);
}

fs.mkdirSync(zipDir, { recursive: true });
fs.rmSync(zipPath, { force: true });

const command = [
  "$ErrorActionPreference = 'Stop'",
  `Compress-Archive -Path ${quotePowerShell(packageDir)} -DestinationPath ${quotePowerShell(zipPath)} -Force`,
].join('; ');

execFileSync('powershell', ['-NoProfile', '-Command', command], {
  stdio: 'inherit',
});

console.log(`Created Windows ZIP: ${path.relative(repoRoot, zipPath)}`);
