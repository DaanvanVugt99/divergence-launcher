import fs from 'node:fs';
import path from 'node:path';
import { getLauncherPaths } from '../paths';

export interface LastPatchedRomMetadata {
  path: string;
  sha256: string;
  patchVersion: string;
  outputFileName: string;
  updatedAt: string;
}

export interface SourceRomVerificationMetadata {
  path: string;
  sha256: string;
  status: 'valid' | 'invalid';
  matchedProfileId: string | null;
  verifiedAt: string;
}

export interface LauncherSettings {
  mgbaPath: string | null;
  suppressMgbaAutoDetect: boolean;
  selectedSourceRomPath: string | null;
  lastSourceRomVerification: SourceRomVerificationMetadata | null;
  lastPatchedRom: LastPatchedRomMetadata | null;
}

const defaultSettings: LauncherSettings = {
  mgbaPath: null,
  suppressMgbaAutoDetect: false,
  selectedSourceRomPath: null,
  lastSourceRomVerification: null,
  lastPatchedRom: null,
};

const normalizeSettings = (value: unknown): LauncherSettings => {
  if (!value || typeof value !== 'object') {
    return defaultSettings;
  }

  const raw = value as Partial<LauncherSettings>;

  return {
    mgbaPath: typeof raw.mgbaPath === 'string' ? raw.mgbaPath : null,
    suppressMgbaAutoDetect: raw.suppressMgbaAutoDetect === true,
    selectedSourceRomPath: typeof raw.selectedSourceRomPath === 'string' ? raw.selectedSourceRomPath : null,
    lastSourceRomVerification:
      raw.lastSourceRomVerification &&
      typeof raw.lastSourceRomVerification === 'object' &&
      typeof raw.lastSourceRomVerification.path === 'string' &&
      typeof raw.lastSourceRomVerification.sha256 === 'string' &&
      (raw.lastSourceRomVerification.status === 'valid' || raw.lastSourceRomVerification.status === 'invalid') &&
      (typeof raw.lastSourceRomVerification.matchedProfileId === 'string' || raw.lastSourceRomVerification.matchedProfileId === null) &&
      typeof raw.lastSourceRomVerification.verifiedAt === 'string'
        ? raw.lastSourceRomVerification
        : null,
    lastPatchedRom:
      raw.lastPatchedRom &&
      typeof raw.lastPatchedRom === 'object' &&
      typeof raw.lastPatchedRom.path === 'string' &&
      typeof raw.lastPatchedRom.sha256 === 'string' &&
      typeof raw.lastPatchedRom.patchVersion === 'string' &&
      typeof raw.lastPatchedRom.outputFileName === 'string' &&
      typeof raw.lastPatchedRom.updatedAt === 'string'
        ? raw.lastPatchedRom
        : null,
  };
};

export const getSettingsSnapshot = (): LauncherSettings => {
  const { settingsPath } = getLauncherPaths();

  if (!fs.existsSync(settingsPath)) {
    return defaultSettings;
  }

  try {
    return normalizeSettings(JSON.parse(fs.readFileSync(settingsPath, 'utf8')));
  } catch {
    return defaultSettings;
  }
};

export const writeSettings = (settings: LauncherSettings) => {
  const { settingsPath } = getLauncherPaths();

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
};

export const updateSettings = (updater: (settings: LauncherSettings) => LauncherSettings): LauncherSettings => {
  const nextSettings = updater(getSettingsSnapshot());

  writeSettings(nextSettings);

  return nextSettings;
};
