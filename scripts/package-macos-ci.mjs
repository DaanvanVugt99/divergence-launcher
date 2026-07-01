import packagerModule from '@electron/packager';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import packageJson from '../package.json' with { type: 'json' };
import { appName, outDir, repoRoot, resolvePackagedAppPath } from './macos-artifact-paths.mjs';

const packager = packagerModule.default ?? packagerModule.packager ?? packagerModule;
const appIconPath = path.join(repoRoot, 'resources', 'icons', 'icon');
const appIconFilePath = `${appIconPath}.icns`;

function applyMacAppIcon(appPath) {
  const resourcesPath = path.join(appPath, 'Contents', 'Resources');
  const plistPath = path.join(appPath, 'Contents', 'Info.plist');
  const packagedIconName = 'icon.icns';

  fs.copyFileSync(appIconFilePath, path.join(resourcesPath, packagedIconName));
  execFileSync('/usr/libexec/PlistBuddy', ['-c', `Set :CFBundleIconFile ${packagedIconName}`, plistPath]);
}

try {
  const existingAppPath = resolvePackagedAppPath();
  console.log(`Forge packaged app found: ${path.relative(repoRoot, existingAppPath)}`);
  process.exit(0);
} catch {
  console.log('Forge did not leave a packaged app; running direct Electron Packager fallback.');
}

const requiredBuildFiles = [
  path.join(repoRoot, '.vite', 'build', 'main.js'),
  path.join(repoRoot, '.vite', 'build', 'preload.js'),
  path.join(repoRoot, '.vite', 'renderer', 'main_window', 'index.html'),
];

for (const filePath of requiredBuildFiles) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing Vite build output: ${path.relative(repoRoot, filePath)}`);
  }
}

const packageJsonForApp = {
  ...packageJson,
  scripts: {},
  devDependencies: {},
};
delete packageJsonForApp.config;

await packager({
  dir: repoRoot,
  name: appName,
  platform: 'darwin',
  arch: 'arm64',
  out: outDir,
  overwrite: true,
  asar: true,
  executableName: 'divergence-launcher',
  appBundleId: 'dev.geef.divergence-launcher',
  appCategoryType: 'public.app-category.games',
  extraResource: [path.join(repoRoot, 'resources')],
  ignore: (filePath) => {
    if (!filePath) {
      return false;
    }

    return !filePath.startsWith('/.vite') && filePath !== '/package.json';
  },
  afterCopy: [
    (_buildPath, _electronVersion, _platform, _arch, callback) => {
      try {
        fs.writeFileSync(path.join(_buildPath, 'package.json'), `${JSON.stringify(packageJsonForApp, null, 2)}\n`);
        callback();
      } catch (error) {
        callback(error instanceof Error ? error : new Error(String(error)));
      }
    },
  ],
  afterComplete: [
    (buildPath, _electronVersion, _platform, _arch, callback) => {
      try {
        applyMacAppIcon(path.join(buildPath, `${appName}.app`));
        callback();
      } catch (error) {
        callback(error instanceof Error ? error : new Error(String(error)));
      }
    },
  ],
});

console.log(`Direct packaged app created: ${path.relative(repoRoot, resolvePackagedAppPath())}`);
