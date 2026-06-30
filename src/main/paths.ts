import { app } from 'electron';
import path from 'node:path';

export interface LauncherPaths {
  appDataDir: string;
  patchedRomDir: string;
  settingsPath: string;
  resourcesDir: string;
}

export const getLauncherPaths = (): LauncherPaths => {
  const appDataDir = app.getPath('userData');
  const resourcesDir = app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(app.getAppPath(), 'resources');

  return {
    appDataDir,
    patchedRomDir: path.join(appDataDir, 'roms'),
    settingsPath: path.join(appDataDir, 'settings.json'),
    resourcesDir,
  };
};
