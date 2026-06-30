import path from 'node:path';
import type { LauncherPaths } from '../paths';
import { acceptedBaseRomProfiles, patchedRomProfile } from './checksums';

export interface PatchPlan {
  patchVersion: string;
  patchFileName: string;
  expectedBaseRoms: typeof acceptedBaseRomProfiles;
  expectedPatchedRom: typeof patchedRomProfile;
  outputFileName: string;
  status: 'not-implemented';
}

export const getPatchPlan = (paths: LauncherPaths): PatchPlan => ({
  patchVersion: 'v0.1',
  patchFileName: path.join(paths.resourcesDir, 'patches', 'divergence-v0.1.xdelta'),
  expectedBaseRoms: acceptedBaseRomProfiles,
  expectedPatchedRom: patchedRomProfile,
  outputFileName: 'Pokemon Emerald Rogue Divergence.gba',
  status: 'not-implemented',
});
