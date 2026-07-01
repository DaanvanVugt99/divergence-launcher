import { contextBridge, ipcRenderer } from 'electron';
import type { LauncherApi } from './launcherApi';

const launcherApi: LauncherApi = {
  getStatus: () => ipcRenderer.invoke('launcher:getStatus'),
  selectRom: () => ipcRenderer.invoke('launcher:selectRom'),
  verifySelectedRom: (path: string) => ipcRenderer.invoke('launcher:verifySelectedRom', path),
  patchSelectedRom: (path: string) => ipcRenderer.invoke('launcher:patchSelectedRom', path),
  exportPatchedRom: () => ipcRenderer.invoke('launcher:exportPatchedRom'),
  openPatchedRomFolder: () => ipcRenderer.invoke('launcher:openPatchedRomFolder'),
  resetData: () => ipcRenderer.invoke('launcher:resetData'),
  selectMgba: () => ipcRenderer.invoke('launcher:selectMgba'),
  openExternal: (url: string) => ipcRenderer.invoke('launcher:openExternal', url),
};

contextBridge.exposeInMainWorld('launcher', launcherApi);
