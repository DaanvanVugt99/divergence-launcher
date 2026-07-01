import { app } from 'electron';
import path from 'node:path';

export interface LauncherPaths {
  appDataDir: string;
  patchedRomDir: string;
  tempDir: string;
  settingsPath: string;
  resourcesDir: string;
  patchMetadataPath: string;
}

export const getLauncherPaths = (): LauncherPaths => {
  const appDataDir = app.getPath('userData');
  const resourcesDir = app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(app.getAppPath(), 'resources');

  return {
    appDataDir,
    patchedRomDir: path.join(appDataDir, 'roms'),
    tempDir: path.join(appDataDir, 'tmp'),
    settingsPath: path.join(appDataDir, 'settings.json'),
    resourcesDir,
    patchMetadataPath: path.join(resourcesDir, 'patches', 'checksums.json'),
  };
};
