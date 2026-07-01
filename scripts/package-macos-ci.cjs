const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const packager = require('@electron/packager');

const packageJson = require('../package.json');

const repoRoot = path.resolve(__dirname, '..');
const appName = 'Divergence Launcher';
const arch = 'arm64';
const outDir = path.join(repoRoot, 'out');
const packagedDir = path.join(outDir, `${appName}-darwin-${arch}`);
const packagedAppPath = path.join(packagedDir, `${appName}.app`);
const stagingDir = path.join(outDir, 'ci-package-src');
const packagerTmpDir = path.resolve(repoRoot, '..', '.divergence-launcher-electron-packager-tmp');
const appIconPath = path.join(repoRoot, 'resources', 'icons', 'icon.icns');

function applyMacAppIcon(appPath) {
  const resourcesPath = path.join(appPath, 'Contents', 'Resources');
  const plistPath = path.join(appPath, 'Contents', 'Info.plist');
  const packagedIconName = 'icon.icns';

  fs.copyFileSync(appIconPath, path.join(resourcesPath, packagedIconName));
  execFileSync('/usr/libexec/PlistBuddy', ['-c', `Set :CFBundleIconFile ${packagedIconName}`, plistPath]);
}

function assertViteOutputExists() {
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
}

function createStagingDirectory() {
  fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir, { recursive: true });
  fs.cpSync(path.join(repoRoot, '.vite'), path.join(stagingDir, '.vite'), { recursive: true });

  const packageJsonForApp = {
    name: packageJson.name,
    productName: packageJson.productName,
    version: packageJson.version,
    description: packageJson.description,
    main: packageJson.main,
    author: packageJson.author,
    license: packageJson.license,
  };

  fs.writeFileSync(path.join(stagingDir, 'package.json'), `${JSON.stringify(packageJsonForApp, null, 2)}\n`);
}

function listTree(directoryPath, maxDepth = 4, depth = 0) {
  if (!fs.existsSync(directoryPath)) {
    console.log(`${path.relative(repoRoot, directoryPath)}: missing`);
    return;
  }

  if (depth > maxDepth) {
    return;
  }

  const label = path.relative(repoRoot, directoryPath) || '.';
  console.log(label);

  if (!fs.statSync(directoryPath).isDirectory()) {
    return;
  }

  for (const entry of fs.readdirSync(directoryPath).sort()) {
    listTree(path.join(directoryPath, entry), maxDepth, depth + 1);
  }
}

function getElectronVersion() {
  const versionRange = packageJson.devDependencies?.electron ?? packageJson.dependencies?.electron;

  if (!versionRange) {
    throw new Error('Could not resolve Electron version from package.json.');
  }

  return versionRange.replace(/^[^\d]*/, '');
}

async function packageWithElectronPackager() {
  const appPaths = await packager({
    dir: stagingDir,
    name: appName,
    platform: 'darwin',
    arch,
    out: outDir,
    overwrite: true,
    asar: true,
    executableName: 'divergence-launcher',
    appBundleId: 'dev.geef.divergence-launcher',
    appCategoryType: 'public.app-category.games',
    extraResource: [path.join(repoRoot, 'resources')],
    tmpdir: packagerTmpDir,
    electronVersion: getElectronVersion(),
  });

  console.log(`Electron Packager returned app paths: ${appPaths.join(', ')}`);
}

async function main() {
  if (fs.existsSync(packagedAppPath)) {
    console.log(`Forge packaged app found: ${path.relative(repoRoot, packagedAppPath)}`);
    return;
  }

  console.log('Forge did not leave a packaged app; packaging .vite output directly.');
  assertViteOutputExists();
  createStagingDirectory();
  fs.rmSync(packagerTmpDir, { recursive: true, force: true });
  fs.mkdirSync(packagerTmpDir, { recursive: true });

  await packageWithElectronPackager();

  if (!fs.existsSync(packagedAppPath)) {
    console.log('Packaged app was not found after Electron Packager finished. Output tree:');
    listTree(outDir);
    console.log('Packager temp tree:');
    listTree(packagerTmpDir);
    throw new Error(`Direct packaging did not create ${path.relative(repoRoot, packagedAppPath)}`);
  }

  applyMacAppIcon(packagedAppPath);
  console.log(`Direct packaged app created: ${path.relative(repoRoot, packagedAppPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
