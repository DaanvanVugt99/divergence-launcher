export interface LauncherStatus {
  paths: {
    appDataDir: string;
    patchedRomDir: string;
    settingsPath: string;
    resourcesDir: string;
  };
  settings: {
    mgbaPath: string | null;
  };
  romLibrary: {
    patchedRomPath: string;
    hasPatchedRom: boolean;
    sourceRomPath: string | null;
  };
  patchPlan: {
    patchVersion: string;
    patchFileName: string;
    outputFileName: string;
    status: 'not-implemented';
  };
  mgba: {
    status: 'found' | 'not-found';
    path: string | null;
    source: 'configured' | 'common-location' | 'unconfigured';
  };
}

export interface FileSelectionResult {
  path: string;
}

export interface LauncherApi {
  getStatus: () => Promise<LauncherStatus>;
  selectRom: () => Promise<FileSelectionResult | null>;
  selectMgba: () => Promise<FileSelectionResult | null>;
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    launcher: LauncherApi;
  }
}
