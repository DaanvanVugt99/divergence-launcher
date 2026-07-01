import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const nativeDir = path.join(repoRoot, 'resources', 'xdelta', 'native');

const platformPackages = {
  'darwin-arm64': {
    packageName: '@chainsafe/xdelta3-node-darwin-arm64',
    fileName: 'xdelta3-node.darwin-arm64.node',
  },
  'darwin-x64': {
    packageName: '@chainsafe/xdelta3-node-darwin-x64',
    fileName: 'xdelta3-node.darwin-x64.node',
  },
  'win32-x64': {
    packageName: '@chainsafe/xdelta3-node-win32-x64-msvc',
    fileName: 'xdelta3-node.win32-x64-msvc.node',
  },
  'linux-x64': {
    packageName: '@chainsafe/xdelta3-node-linux-x64-gnu',
    fileName: 'xdelta3-node.linux-x64-gnu.node',
  },
};

// TODO: When release CI exists, run packaging on each target OS/arch so each
// build includes its matching native xdelta addon instead of relying on
// cross-platform optional dependencies being present on one machine.
const target = platformPackages[`${process.platform}-${process.arch}`];

if (!target) {
  throw new Error(
    `No packaged xdelta native addon is configured for ${process.platform}-${process.arch}.`,
  );
}

const nativePackageEntry = require.resolve(target.packageName);
const nativeSourcePath = nativePackageEntry.endsWith('.node')
  ? nativePackageEntry
  : path.join(path.dirname(nativePackageEntry), target.fileName);

if (!fs.existsSync(nativeSourcePath)) {
  throw new Error(`Missing xdelta native addon: ${nativeSourcePath}`);
}

fs.rmSync(nativeDir, { recursive: true, force: true });
fs.mkdirSync(nativeDir, { recursive: true });
fs.copyFileSync(nativeSourcePath, path.join(nativeDir, target.fileName));

const licensePath = require.resolve('@chainsafe/xdelta3-node/LICENSE');
fs.copyFileSync(licensePath, path.join(nativeDir, 'LICENSE.xdelta3-node'));

console.log(`Prepared xdelta native addon: ${target.fileName}`);
