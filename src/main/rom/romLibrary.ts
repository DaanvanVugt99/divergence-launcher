import path from 'node:path';
import type { LauncherPaths } from '../paths';

export interface RomLibraryState {
  patchedRomPath: string;
  hasPatchedRom: boolean;
  sourceRomPath: string | null;
}

export const getRomLibraryState = (paths: LauncherPaths): RomLibraryState => ({
  patchedRomPath: path.join(paths.patchedRomDir, 'Pokemon Emerald Rogue Divergence.gba'),
  hasPatchedRom: false,
  sourceRomPath: null,
});
