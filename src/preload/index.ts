import { contextBridge, ipcRenderer } from 'electron';
import type { LauncherApi } from './launcherApi';

const launcherApi: LauncherApi = {
  getStatus: () => ipcRenderer.invoke('launcher:getStatus'),
  selectRom: () => ipcRenderer.invoke('launcher:selectRom'),
  selectMgba: () => ipcRenderer.invoke('launcher:selectMgba'),
  openExternal: (url: string) => ipcRenderer.invoke('launcher:openExternal', url),
};

contextBridge.exposeInMainWorld('launcher', launcherApi);
