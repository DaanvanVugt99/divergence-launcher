import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import packageJson from '../package.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const appName = 'Divergence Launcher';
const arch = 'arm64';
const appPath = path.join(repoRoot, 'out', `${appName}-darwin-${arch}`, `${appName}.app`);
const pollIntervalMs = Number(process.env.NOTARY_POLL_INTERVAL_MS ?? 30_000);
const timeoutMs = Number(process.env.NOTARY_TIMEOUT_MS ?? 30 * 60_000);

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for notarization.`);
  }

  return value;
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  });
}

function runJson(command, args) {
  return JSON.parse(run(command, args));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createNotaryZip() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'divergence-notary-'));
  const zipPath = path.join(tempDir, `${appName}-${packageJson.version}-notary.zip`);

  execFileSync('ditto', ['-c', '-k', '--keepParent', `${appName}.app`, zipPath], {
    cwd: path.dirname(appPath),
    stdio: 'inherit',
  });

  return zipPath;
}

function notaryArgs() {
  return [
    '--key',
    requireEnv('APPLE_API_KEY_PATH'),
    '--key-id',
    requireEnv('APPLE_API_KEY_ID'),
    '--issuer',
    requireEnv('APPLE_API_ISSUER'),
    '--output-format',
    'json',
  ];
}

function printStatus(info) {
  const created = info.createdDate ? ` created=${info.createdDate}` : '';
  console.log(`Notarization status: ${info.status}${created}`);
}

async function waitForSubmission(id) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const info = runJson('xcrun', ['notarytool', 'info', id, ...notaryArgs()]);
    printStatus(info);

    if (info.status === 'Accepted') {
      return;
    }

    if (info.status === 'Invalid' || info.status === 'Rejected') {
      const log = run('xcrun', ['notarytool', 'log', id, ...notaryArgs()]);
      throw new Error(`Notarization failed for submission ${id}:\n${log}`);
    }

    await sleep(pollIntervalMs);
  }

  throw new Error(
    `Notarization is still in progress after ${Math.round(timeoutMs / 60_000)} minutes. Submission ID: ${id}`,
  );
}

if (process.platform !== 'darwin') {
  throw new Error('macOS notarization must run on macOS.');
}

if (!fs.existsSync(appPath)) {
  throw new Error(`Missing packaged app: ${path.relative(repoRoot, appPath)}`);
}

const zipPath = createNotaryZip();
const submit = runJson('xcrun', ['notarytool', 'submit', zipPath, ...notaryArgs()]);
const submissionId = submit.id;

if (!submissionId) {
  throw new Error(`Notary submission did not return an id: ${JSON.stringify(submit)}`);
}

console.log(`Notarization submitted: ${submissionId}`);

await waitForSubmission(submissionId);

execFileSync('xcrun', ['stapler', 'staple', appPath], { stdio: 'inherit' });
execFileSync('xcrun', ['stapler', 'validate', appPath], { stdio: 'inherit' });

console.log(`Notarization accepted and stapled: ${path.relative(repoRoot, appPath)}`);
