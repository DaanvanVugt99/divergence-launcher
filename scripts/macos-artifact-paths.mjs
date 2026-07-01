import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import packageJson from '../package.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(__dirname, '..');
export const appName = 'Divergence Launcher';
export const arch = 'arm64';
export const outDir = path.join(repoRoot, 'out');
export const zipDir = path.join(outDir, 'make', 'zip', 'darwin', arch);
export const zipPath = path.join(zipDir, `${appName}-darwin-${arch}-${packageJson.version}.zip`);

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function listTree(rootPath, maxEntries = 120) {
  const entries = [];

  function walk(currentPath, depth) {
    if (entries.length >= maxEntries || depth > 5 || !fs.existsSync(currentPath)) {
      return;
    }

    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.join(currentPath, entry.name);
      entries.push(path.relative(repoRoot, entryPath));

      if (entries.length >= maxEntries) {
        return;
      }

      if (entry.isDirectory() && !entry.name.endsWith('.app')) {
        walk(entryPath, depth + 1);
      }
    }
  }

  walk(rootPath, 0);
  return entries;
}

function findAppBundles(rootPath) {
  const appBundles = [];

  function walk(currentPath) {
    if (!fs.existsSync(currentPath)) {
      return;
    }

    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.join(currentPath, entry.name);

      if (!entry.isDirectory()) {
        continue;
      }

      if (entry.name.endsWith('.app')) {
        appBundles.push(entryPath);
        continue;
      }

      walk(entryPath);
    }
  }

  walk(rootPath);
  return appBundles;
}

export function resolvePackagedAppPath({ waitMilliseconds = 0 } = {}) {
  const deadline = Date.now() + waitMilliseconds;

  do {
    const appBundles = findAppBundles(outDir);
    const preferredApp = appBundles.find((appPath) => path.basename(appPath) === `${appName}.app`);

    if (preferredApp) {
      return preferredApp;
    }

    if (appBundles[0]) {
      return appBundles[0];
    }

    if (Date.now() < deadline) {
      sleep(500);
    }
  } while (Date.now() < deadline);

  const tree = listTree(outDir);
  const detail = tree.length > 0 ? `\nCurrent out/ tree:\n${tree.join('\n')}` : '\nCurrent out/ tree: missing or empty';

  throw new Error(`Missing packaged macOS app under out/.${detail}`);
}
