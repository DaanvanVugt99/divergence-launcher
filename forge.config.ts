import type { ForgeConfig } from '@electron-forge/shared-types';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const appIconPath = path.resolve(process.cwd(), 'resources/icons/icon');
const appIconFilePath = `${appIconPath}.icns`;
const macEntitlementsPath = path.resolve(process.cwd(), 'resources/entitlements/darwin.plist');
const productName = 'Divergence Launcher';
const macSigningIdentity = process.env.APPLE_SIGNING_IDENTITY;
const macSigningKeychain = process.env.APPLE_KEYCHAIN_PATH;
const enableElectronFuses = process.env.ENABLE_ELECTRON_FUSES === 'true';

function getMacSigningConfig() {
  if (!macSigningIdentity) {
    return {};
  }

  return {
    osxSign: {
      identity: macSigningIdentity,
      keychain: macSigningKeychain,
      hardenedRuntime: true,
      entitlements: macEntitlementsPath,
      continueOnError: false,
    },
  };
}

function applyMacAppIcon(buildPath: string, platform: string): void {
  if (platform !== 'darwin') {
    return;
  }

  const appPath = path.join(buildPath, `${productName}.app`);
  const resourcesPath = path.join(appPath, 'Contents', 'Resources');
  const plistPath = path.join(appPath, 'Contents', 'Info.plist');
  const packagedIconName = 'icon.icns';
  const packagedIconPath = path.join(resourcesPath, packagedIconName);

  fs.copyFileSync(appIconFilePath, packagedIconPath);
  execFileSync('/usr/libexec/PlistBuddy', [
    '-c',
    `Set :CFBundleIconFile ${packagedIconName}`,
    plistPath,
  ]);
}

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    appBundleId: 'dev.geef.divergence-launcher',
    appCategoryType: 'public.app-category.games',
    executableName: 'divergence-launcher',
    icon: appIconPath,
    extraResource: ['resources'],
    ...getMacSigningConfig(),
    afterCopyExtraResources: [
      (buildPath, _electronVersion, platform, _arch, callback) => {
        try {
          applyMacAppIcon(buildPath, platform);
          callback();
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      },
    ],
  },
  rebuildConfig: {},
  makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    ...(enableElectronFuses
      ? [
          new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
          }),
        ]
      : []),
  ],
};

export default config;
