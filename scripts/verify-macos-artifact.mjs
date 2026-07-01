import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { appName, repoRoot, resolvePackagedAppPath, zipPath } from './macos-artifact-paths.mjs';

const appDir = resolvePackagedAppPath();

const requiredFiles = [
  zipPath,
  path.join(appDir, 'Contents', 'Info.plist'),
  path.join(appDir, 'Contents', 'Resources', 'app.asar'),
  path.join(appDir, 'Contents', 'Resources', 'icon.icns'),
  path.join(appDir, 'Contents', 'Resources', 'resources', 'patches', 'checksums.json'),
  path.join(appDir, 'Contents', 'Resources', 'resources', 'patches', 'divergence-v0.1.xdelta'),
  path.join(appDir, 'Contents', 'Resources', 'resources', 'xdelta', 'native', 'LICENSE.xdelta3-node'),
  path.join(appDir, 'Contents', 'Resources', 'resources', 'xdelta', 'native', 'xdelta3-node.darwin-arm64.node'),
];

function assertFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing release artifact file: ${path.relative(repoRoot, filePath)}`);
  }
}

function readPlistValue(plistPath, key) {
  return execFileSync('/usr/libexec/PlistBuddy', ['-c', `Print :${key}`, plistPath], {
    encoding: 'utf8',
  }).trim();
}

function assertZipContains(zipFilePath, expectedEntry) {
  const listing = execFileSync('unzip', ['-l', zipFilePath], { encoding: 'utf8' });

  if (!listing.includes(expectedEntry)) {
    throw new Error(`ZIP is missing expected entry: ${expectedEntry}`);
  }
}

for (const filePath of requiredFiles) {
  assertFileExists(filePath);
}

const plistPath = path.join(appDir, 'Contents', 'Info.plist');
const bundleId = readPlistValue(plistPath, 'CFBundleIdentifier');
const iconFile = readPlistValue(plistPath, 'CFBundleIconFile');

if (bundleId !== 'dev.geef.divergence-launcher') {
  throw new Error(`Unexpected bundle id: ${bundleId}`);
}

if (iconFile !== 'icon.icns') {
  throw new Error(`Unexpected icon file: ${iconFile}`);
}

assertZipContains(zipPath, `${appName}.app/Contents/Resources/icon.icns`);
assertZipContains(zipPath, `${appName}.app/Contents/Resources/resources/patches/divergence-v0.1.xdelta`);
assertZipContains(zipPath, `${appName}.app/Contents/Resources/resources/xdelta/native/xdelta3-node.darwin-arm64.node`);
assertZipContains(zipPath, `${appName}.app/Contents/Resources/resources/xdelta/native/LICENSE.xdelta3-node`);

console.log('macOS artifact verification passed.');
