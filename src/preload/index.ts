import { contextBridge, ipcRenderer } from 'electron';
import type { LauncherApi } from './launcherApi';

const launcherApi: LauncherApi = {
  getStatus: () => ipcRenderer.invoke('launcher:getStatus'),
  updateSettings: (settings) => ipcRenderer.invoke('launcher:updateSettings', settings),
  onOpenSettings: (callback) => {
    const listener = () => callback();

    ipcRenderer.on('launcher:openSettings', listener);

    return () => ipcRenderer.removeListener('launcher:openSettings', listener);
  },
  selectRom: () => ipcRenderer.invoke('launcher:selectRom'),
  verifySelectedRom: (path: string) => ipcRenderer.invoke('launcher:verifySelectedRom', path),
  patchSelectedRom: (path: string) => ipcRenderer.invoke('launcher:patchSelectedRom', path),
  exportPatchedRom: () => ipcRenderer.invoke('launcher:exportPatchedRom'),
  openPatchedRomFolder: () => ipcRenderer.invoke('launcher:openPatchedRomFolder'),
  resetData: () => ipcRenderer.invoke('launcher:resetData'),
  selectMgba: () => ipcRenderer.invoke('launcher:selectMgba'),
  launchMgba: () => ipcRenderer.invoke('launcher:launchMgba'),
  openExternal: (url: string) => ipcRenderer.invoke('launcher:openExternal', url),
  copyText: (text: string) => ipcRenderer.invoke('launcher:copyText', text),
};

contextBridge.exposeInMainWorld('launcher', launcherApi);
