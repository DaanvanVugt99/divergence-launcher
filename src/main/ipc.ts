import fs from 'node:fs';
import path from 'node:path';
import { app, dialog, ipcMain, shell } from 'electron';
import { getLauncherPaths } from './paths';
import { applyPatch, getPatchMetadata, getPatchPlan, verifySourceRom } from './rom/patcher';
import { getManagedPatchedRomPath, getRomLibraryState } from './rom/romLibrary';
import { sha256File } from './rom/hash';
import { detectMgba, resolveMgbaExecutablePath } from './emulator/mgbaDetector';
import { createMgbaLaunchRequest, launchMgba } from './emulator/mgbaLauncher';
import { getSettingsSnapshot, updateSettings, writeSettings } from './settings/settingsStore';

export const registerIpcHandlers = () => {
  ipcMain.handle('launcher:getStatus', async () => {
    const paths = getLauncherPaths();
    const settings = getSettingsSnapshot();
    const patchPlan = getPatchPlan(paths);
    const romLibrary = await (async () => {
      try {
        return await getRomLibraryState(paths, getPatchMetadata(paths), settings);
      } catch {
        const patchedRomPath = path.join(paths.patchedRomDir, patchPlan.outputFileName);
        const hasPatchedRom = fs.existsSync(patchedRomPath);

        return {
          patchedRomPath,
          hasPatchedRom,
          sourceRomPath: settings.selectedSourceRomPath,
          lastPatchedSha256: hasPatchedRom ? await sha256File(patchedRomPath) : null,
          outputFileName: patchPlan.outputFileName,
        };
      }
    })();
    const mgba = await detectMgba(settings.mgbaPath, {
      allowCommonLocations: !settings.suppressMgbaAutoDetect,
    });

    return {
      app: {
        version: app.getVersion(),
      },
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

    const selectedPath = result.filePaths[0];

    updateSettings((settings) => ({
      ...settings,
      selectedSourceRomPath: selectedPath,
      lastSourceRomVerification:
        settings.lastSourceRomVerification?.path === selectedPath ? settings.lastSourceRomVerification : null,
      lastPatchedRom: settings.selectedSourceRomPath === selectedPath ? settings.lastPatchedRom : null,
    }));

    return { path: selectedPath };
  });

  ipcMain.handle('launcher:resetData', async () => {
    const paths = getLauncherPaths();
    const managedPatchedRomPath = (() => {
      try {
        return getManagedPatchedRomPath(paths, getPatchMetadata(paths));
      } catch {
        return null;
      }
    })();

    if (managedPatchedRomPath) {
      fs.rmSync(managedPatchedRomPath, { force: true });
    }
    fs.rmSync(paths.settingsPath, { force: true });
    fs.rmSync(paths.patchedRomDir, { recursive: true, force: true });
    fs.rmSync(paths.tempDir, { recursive: true, force: true });

    writeSettings({
      mgbaPath: null,
      suppressMgbaAutoDetect: true,
      selectedSourceRomPath: null,
      lastSourceRomVerification: null,
      lastPatchedRom: null,
    });
  });

  ipcMain.handle('launcher:verifySelectedRom', async (_event, romPath: string) => {
    const paths = getLauncherPaths();

    return verifySourceRom(paths, romPath);
  });

  ipcMain.handle('launcher:patchSelectedRom', async (_event, romPath: string) => {
    const paths = getLauncherPaths();

    return applyPatch(paths, romPath);
  });

  ipcMain.handle('launcher:exportPatchedRom', async () => {
    const paths = getLauncherPaths();
    const settings = getSettingsSnapshot();
    const metadata = getPatchMetadata(paths);
    const romLibrary = await getRomLibraryState(paths, metadata, settings);

    if (!romLibrary.hasPatchedRom || romLibrary.lastPatchedSha256 !== metadata.patchedRom.sha256) {
      throw new Error('No verified patched ROM is ready to export. Reapply the patch before exporting.');
    }

    const result = await dialog.showSaveDialog({
      title: 'Export patched Divergence ROM',
      defaultPath: metadata.patchedRom.outputFileName,
      filters: [
        { name: 'Game Boy Advance ROM', extensions: ['gba'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    fs.copyFileSync(romLibrary.patchedRomPath, result.filePath);

    return {
      path: result.filePath,
    };
  });

  ipcMain.handle('launcher:openPatchedRomFolder', async () => {
    const paths = getLauncherPaths();
    const settings = getSettingsSnapshot();
    const metadata = getPatchMetadata(paths);
    const romLibrary = await getRomLibraryState(paths, metadata, settings);

    fs.mkdirSync(path.dirname(romLibrary.patchedRomPath), { recursive: true });
    await shell.openPath(path.dirname(romLibrary.patchedRomPath));
  });

  ipcMain.handle('launcher:launchMgba', async () => {
    const paths = getLauncherPaths();
    const settings = getSettingsSnapshot();
    const metadata = getPatchMetadata(paths);
    const romLibrary = await getRomLibraryState(paths, metadata, settings);
    const mgba = await detectMgba(settings.mgbaPath, {
      allowCommonLocations: !settings.suppressMgbaAutoDetect,
    });

    return launchMgba(
      createMgbaLaunchRequest({
        mgba,
        romLibrary,
        expectedPatchedSha256: metadata.patchedRom.sha256,
      }),
    );
  });

  ipcMain.handle('launcher:selectMgba', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select mGBA executable',
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const selectedPath = resolveMgbaExecutablePath(result.filePaths[0]);

    if (!selectedPath) {
      throw new Error('Selected mGBA path is not a valid executable.');
    }

    updateSettings((settings) => ({
      ...settings,
      mgbaPath: selectedPath,
      suppressMgbaAutoDetect: false,
    }));

    return { path: selectedPath };
  });

  ipcMain.handle('launcher:openExternal', async (_event, url: string) => {
    if (url !== 'https://mgba.io/downloads.html') {
      throw new Error('Unsupported external URL.');
    }

    await shell.openExternal(url);
  });
};
