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
const appDir = path.join(repoRoot, 'out', `${appName}-${platform}-${arch}`);
const zipPath = path.join(repoRoot, 'out', 'make', 'zip', platform, arch, `${appName}-${platform}-${arch}-${packageJson.version}.zip`);

const requiredFiles = [
  zipPath,
  path.join(appDir, executableName),
  path.join(appDir, 'resources', 'app.asar'),
  path.join(appDir, 'resources', 'resources', 'patches', 'checksums.json'),
  path.join(appDir, 'resources', 'resources', 'patches', 'divergence-v0.1.xdelta'),
  path.join(appDir, 'resources', 'resources', 'xdelta', 'native', 'LICENSE.xdelta3-node'),
  path.join(appDir, 'resources', 'resources', 'xdelta', 'native', 'xdelta3-node.win32-x64-msvc.node'),
];

function quotePowerShell(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function assertFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing release artifact file: ${path.relative(repoRoot, filePath)}`);
  }
}

function readZipEntries(zipFilePath) {
  const command = [
    "$ErrorActionPreference = 'Stop'",
    'Add-Type -AssemblyName System.IO.Compression.FileSystem',
    `$archive = [IO.Compression.ZipFile]::OpenRead(${quotePowerShell(zipFilePath)})`,
    'try { $archive.Entries | ForEach-Object { $_.FullName } } finally { $archive.Dispose() }',
  ].join('; ');

  return execFileSync('powershell', ['-NoProfile', '-Command', command], {
    encoding: 'utf8',
  })
    .split(/\r?\n/)
    .map((entry) => entry.trim().replaceAll('\\', '/'))
    .filter(Boolean);
}

function assertZipContains(entries, expectedEntry) {
  if (!entries.includes(expectedEntry)) {
    throw new Error(`ZIP is missing expected entry: ${expectedEntry}`);
  }
}

if (process.platform !== 'win32') {
  throw new Error('Windows artifact verification must run on Windows.');
}

for (const filePath of requiredFiles) {
  assertFileExists(filePath);
}

const entries = readZipEntries(zipPath);
const zipRoot = `${appName}-${platform}-${arch}`;

assertZipContains(entries, `${zipRoot}/${executableName}`);
assertZipContains(entries, `${zipRoot}/resources/app.asar`);
assertZipContains(entries, `${zipRoot}/resources/resources/patches/divergence-v0.1.xdelta`);
assertZipContains(entries, `${zipRoot}/resources/resources/xdelta/native/xdelta3-node.win32-x64-msvc.node`);
assertZipContains(entries, `${zipRoot}/resources/resources/xdelta/native/LICENSE.xdelta3-node`);

console.log('Windows artifact verification passed.');
