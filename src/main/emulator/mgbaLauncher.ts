import { spawn } from 'node:child_process';
import type { RomLibraryState } from '../rom/romLibrary';
import type { MgbaDetectionResult } from './mgbaDetector';

export interface MgbaLaunchRequest {
  mgbaPath: string;
  romPath: string;
}

export interface MgbaLaunchResult {
  mgbaPath: string;
  romPath: string;
  startedAt: string;
}

interface MgbaLaunchPreconditions {
  mgba: MgbaDetectionResult;
  romLibrary: RomLibraryState;
  expectedPatchedSha256: string;
}

export const createMgbaLaunchRequest = ({
  mgba,
  romLibrary,
  expectedPatchedSha256,
}: MgbaLaunchPreconditions): MgbaLaunchRequest => {
  if (mgba.status !== 'found' || !mgba.path) {
    throw new Error(
      'mGBA is not configured. Select an installed mGBA executable before launching.',
    );
  }

  if (!romLibrary.hasPatchedRom) {
    throw new Error('No patched ROM is ready. Apply the Divergence patch before launching mGBA.');
  }

  if (romLibrary.lastPatchedSha256 !== expectedPatchedSha256) {
    throw new Error(
      'The managed patched ROM is not verified. Reapply the patch before launching mGBA.',
    );
  }

  return {
    mgbaPath: mgba.path,
    romPath: romLibrary.patchedRomPath,
  };
};

export const launchMgba = async (request: MgbaLaunchRequest): Promise<MgbaLaunchResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(request.mgbaPath, [request.romPath], {
      detached: true,
      stdio: 'ignore',
    });

    child.once('spawn', () => {
      child.unref();
      resolve({
        mgbaPath: request.mgbaPath,
        romPath: request.romPath,
        startedAt: new Date().toISOString(),
      });
    });

    child.once('error', (error) => {
      reject(new Error(`Could not launch mGBA: ${error.message}`));
    });
  });
