import fs from 'node:fs';
import path from 'node:path';
import type { LauncherPaths } from '../paths';
import type { LauncherSettings } from '../settings/settingsStore';
import type { PatchMetadata } from './checksums';
import { sha256File } from './hash';

export interface RomLibraryState {
  patchedRomPath: string;
  hasPatchedRom: boolean;
  sourceRomPath: string | null;
  lastPatchedSha256: string | null;
  outputFileName: string;
}

export const getManagedPatchedRomPath = (paths: LauncherPaths, metadata: PatchMetadata) =>
  path.join(paths.patchedRomDir, metadata.patchedRom.outputFileName);

export const getRomLibraryState = async (
  paths: LauncherPaths,
  metadata: PatchMetadata,
  settings: LauncherSettings,
): Promise<RomLibraryState> => {
  const patchedRomPath = getManagedPatchedRomPath(paths, metadata);
  const hasPatchedRom = fs.existsSync(patchedRomPath);

  return {
    patchedRomPath,
    hasPatchedRom,
    sourceRomPath: settings.selectedSourceRomPath,
    lastPatchedSha256: hasPatchedRom ? await sha256File(patchedRomPath) : null,
    outputFileName: metadata.patchedRom.outputFileName,
  };
};
