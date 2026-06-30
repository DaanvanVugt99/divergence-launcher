import { dialog, ipcMain, shell } from 'electron';
import { getLauncherPaths } from './paths';
import { getPatchPlan } from './rom/patcher';
import { getRomLibraryState } from './rom/romLibrary';
import { detectMgba } from './emulator/mgbaDetector';
import { getSettingsSnapshot } from './settings/settingsStore';

export const registerIpcHandlers = () => {
  ipcMain.handle('launcher:getStatus', async () => {
    const paths = getLauncherPaths();
    const settings = getSettingsSnapshot();
    const romLibrary = getRomLibraryState(paths);
    const patchPlan = getPatchPlan(paths);
    const mgba = await detectMgba(settings.mgbaPath);

    return {
      paths,
      settings,
      romLibrary,
      patchPlan,
      mgba,
    };
  });

  ipcMain.handle('launcher:selectRom', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Pokemon Emerald ROM',
      properties: ['openFile'],
      filters: [
        { name: 'Game Boy Advance ROM', extensions: ['gba'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return { path: result.filePaths[0] };
  });

  ipcMain.handle('launcher:selectMgba', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select mGBA executable',
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return { path: result.filePaths[0] };
  });

  ipcMain.handle('launcher:openExternal', async (_event, url: string) => {
    await shell.openExternal(url);
  });
};
