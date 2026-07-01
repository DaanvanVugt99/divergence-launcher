export interface LauncherStatus {
  app: {
    version: string;
    platform: string;
    arch: string;
    isPackaged: boolean;
  };
  paths: {
    appDataDir: string;
    patchedRomDir: string;
    tempDir: string;
    settingsPath: string;
    resourcesDir: string;
    patchMetadataPath: string;
  };
  settings: {
    mgbaPath: string | null;
    suppressMgbaAutoDetect: boolean;
    minimizeLauncherOnGameLaunch: boolean;
    selectedSourceRomPath: string | null;
    lastSourceRomVerification: {
      path: string;
      sha256: string;
      status: 'valid' | 'invalid';
      matchedProfileId: string | null;
      verifiedAt: string;
    } | null;
    lastPatchedRom: {
      path: string;
      sha256: string;
      patchVersion: string;
      outputFileName: string;
      updatedAt: string;
    } | null;
  };
  romLibrary: {
    patchedRomPath: string;
    hasPatchedRom: boolean;
    sourceRomPath: string | null;
    lastPatchedSha256: string | null;
    outputFileName: string;
  };
  patchPlan: {
    patchVersion: string;
    patchFileName: string;
    patchFilePath: string;
    expectedBaseRoms: SourceRomProfile[];
    expectedPatchedRom: {
      id: string;
      label: string;
      sha256: string;
      outputFileName: string;
    };
    outputFileName: string;
    status: 'ready' | 'missing' | 'invalid-metadata';
    errorMessage: string | null;
  };
  mgba: {
    status: 'found' | 'not-found';
    path: string | null;
    source: 'configured' | 'common-location' | 'unconfigured';
  };
}

export interface SourceRomProfile {
  id: string;
  label: string;
  sha256: string;
}

export interface SourceRomVerificationResult {
  path: string;
  sha256: string;
  status: 'valid' | 'invalid';
  matchedProfile: SourceRomProfile | null;
  expectedProfiles: SourceRomProfile[];
}

export interface PatchResult {
  patchedRomPath: string;
  patchedSha256: string;
  patchVersion: string;
}

export interface MgbaLaunchResult {
  mgbaPath: string;
  romPath: string;
  startedAt: string;
}

export interface FileSelectionResult {
  path: string;
}

export interface LauncherSettingsUpdate {
  minimizeLauncherOnGameLaunch?: boolean;
}

export interface LauncherApi {
  getStatus: () => Promise<LauncherStatus>;
  updateSettings: (settings: LauncherSettingsUpdate) => Promise<LauncherStatus>;
  onOpenSettings: (callback: () => void) => () => void;
  selectRom: () => Promise<FileSelectionResult | null>;
  verifySelectedRom: (path: string) => Promise<SourceRomVerificationResult>;
  patchSelectedRom: (path: string) => Promise<PatchResult>;
  exportPatchedRom: () => Promise<FileSelectionResult | null>;
  openPatchedRomFolder: () => Promise<void>;
  resetData: () => Promise<void>;
  selectMgba: () => Promise<FileSelectionResult | null>;
  launchMgba: () => Promise<MgbaLaunchResult>;
  openExternal: (url: string) => Promise<void>;
  copyText: (text: string) => Promise<void>;
}

declare global {
  interface Window {
    launcher: LauncherApi;
  }
}
