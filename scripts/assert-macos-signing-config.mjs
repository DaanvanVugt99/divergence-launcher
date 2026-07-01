import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const requiredEnv = [
  'APPLE_SIGNING_IDENTITY',
  'APPLE_API_KEY_PATH',
  'APPLE_API_KEY_ID',
  'APPLE_API_ISSUER',
];

function requireMacos() {
  if (process.platform !== 'darwin') {
    throw new Error('macOS release signing must run on macOS.');
  }
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for macOS release signing and notarization.`);
  }

  return value;
}

function requireFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} does not exist: ${filePath}`);
  }
}

function assertSigningIdentity(identity, keychain) {
  const args = ['find-identity', '-v', '-p', 'codesigning'];

  if (keychain) {
    args.push(keychain);
  }

  const output = execFileSync('security', args, { encoding: 'utf8' });

  if (!output.includes(identity)) {
    throw new Error(`APPLE_SIGNING_IDENTITY was not found in the configured keychain: ${identity}`);
  }
}

function assertNotaryToolAvailable() {
  execFileSync('xcrun', ['notarytool', '--version'], { stdio: 'ignore' });
}

requireMacos();

const values = Object.fromEntries(requiredEnv.map((name) => [name, requireEnv(name)]));

if (process.env.APPLE_KEYCHAIN_PATH) {
  requireFile(process.env.APPLE_KEYCHAIN_PATH, 'APPLE_KEYCHAIN_PATH');
}

requireFile(values.APPLE_API_KEY_PATH, 'APPLE_API_KEY_PATH');
assertSigningIdentity(values.APPLE_SIGNING_IDENTITY, process.env.APPLE_KEYCHAIN_PATH);
assertNotaryToolAvailable();

console.log('macOS signing and notarization configuration is present.');
