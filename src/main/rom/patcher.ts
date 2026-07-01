import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { LauncherPaths } from '../paths';
import { updateSettings } from '../settings/settingsStore';
import {
  findMatchingSourceRom,
  loadPatchMetadata,
  type PatchMetadata,
  type SourceRomProfile,
} from './checksums';
import { sha256File } from './hash';
import { getManagedPatchedRomPath } from './romLibrary';

const require = createRequire(__filename);

export type PatchFileStatus = 'ready' | 'missing' | 'invalid-metadata';
export type RomVerificationStatus = 'valid' | 'invalid';

export interface PatchPlan {
  patchVersion: string;
  patchFileName: string;
  patchFilePath: string;
  expectedBaseRoms: SourceRomProfile[];
  expectedPatchedRom: PatchMetadata['patchedRom'];
  outputFileName: string;
  status: PatchFileStatus;
  errorMessage: string | null;
}

export interface SourceRomVerificationResult {
  path: string;
  sha256: string;
  status: RomVerificationStatus;
  matchedProfile: SourceRomProfile | null;
  expectedProfiles: SourceRomProfile[];
}

export interface PatchResult {
  patchedRomPath: string;
  patchedSha256: string;
  patchVersion: string;
}

type XdeltaModule = typeof import('@chainsafe/xdelta3-node');

const getXdelta = (): XdeltaModule => {
  try {
    return require('@chainsafe/xdelta3-node') as XdeltaModule;
  } catch (packageError) {
    const nativeFileName = getNativeXdeltaFileName();
    const packagedNativePath = nativeFileName
      ? path.join(process.resourcesPath, 'resources', 'xdelta', 'native', nativeFileName)
      : null;

    if (packagedNativePath && fs.existsSync(packagedNativePath)) {
      return require(packagedNativePath) as XdeltaModule;
    }

    throw new Error(
      packageError instanceof Error && packageError.message.includes('Unsupported')
        ? packageError.message
        : 'This launcher build is missing local xdelta support for this platform.',
    );
  }
};

const getNativeXdeltaFileName = () => {
  if (process.platform === 'darwin' && process.arch === 'arm64') {
    return 'xdelta3-node.darwin-arm64.node';
  }

  if (process.platform === 'darwin' && process.arch === 'x64') {
    return 'xdelta3-node.darwin-x64.node';
  }

  if (process.platform === 'win32' && process.arch === 'x64') {
    return 'xdelta3-node.win32-x64-msvc.node';
  }

  if (process.platform === 'linux' && process.arch === 'x64') {
    return 'xdelta3-node.linux-x64-gnu.node';
  }

  return null;
};

const getPatchFilePath = (paths: LauncherPaths, metadata: PatchMetadata) =>
  path.join(paths.resourcesDir, 'patches', metadata.patchFileName);

export const getPatchMetadata = (paths: LauncherPaths) => loadPatchMetadata(paths);

export const getPatchPlan = (paths: LauncherPaths): PatchPlan => {
  try {
    const metadata = getPatchMetadata(paths);
    const patchFilePath = getPatchFilePath(paths, metadata);

    return {
      patchVersion: metadata.patchVersion,
      patchFileName: metadata.patchFileName,
      patchFilePath,
      expectedBaseRoms: metadata.sourceRoms,
      expectedPatchedRom: metadata.patchedRom,
      outputFileName: metadata.patchedRom.outputFileName,
      status: fs.existsSync(patchFilePath) ? 'ready' : 'missing',
      errorMessage: fs.existsSync(patchFilePath) ? null : 'Patch file is missing from the launcher resources.',
    };
  } catch (error) {
    return {
      patchVersion: 'unknown',
      patchFileName: 'unknown',
      patchFilePath: '',
      expectedBaseRoms: [],
      expectedPatchedRom: {
        id: 'unknown',
        label: 'Unknown patched ROM',
        sha256: '',
        outputFileName: 'Pokemon Emerald Rogue Divergence.gba',
      },
      outputFileName: 'Pokemon Emerald Rogue Divergence.gba',
      status: 'invalid-metadata',
      errorMessage: error instanceof Error ? error.message : 'Patch metadata is invalid.',
    };
  }
};

export const verifySourceRom = async (
  paths: LauncherPaths,
  sourceRomPath: string,
): Promise<SourceRomVerificationResult> => {
  if (!fs.existsSync(sourceRomPath)) {
    throw new Error('Selected ROM file does not exist.');
  }

  const metadata = getPatchMetadata(paths);
  const sha256 = await sha256File(sourceRomPath);
  const matchedProfile = findMatchingSourceRom(metadata, sha256);

  updateSettings((settings) => ({
    ...settings,
    selectedSourceRomPath: sourceRomPath,
    lastSourceRomVerification: {
      path: sourceRomPath,
      sha256,
      status: matchedProfile ? 'valid' : 'invalid',
      matchedProfileId: matchedProfile?.id ?? null,
      verifiedAt: new Date().toISOString(),
    },
  }));

  return {
    path: sourceRomPath,
    sha256,
    status: matchedProfile ? 'valid' : 'invalid',
    matchedProfile,
    expectedProfiles: metadata.sourceRoms,
  };
};

export const applyPatch = async (
  paths: LauncherPaths,
  sourceRomPath: string,
): Promise<PatchResult> => {
  const metadata = getPatchMetadata(paths);
  const patchFilePath = getPatchFilePath(paths, metadata);

  if (!fs.existsSync(patchFilePath)) {
    throw new Error('Patch file is missing from the launcher resources.');
  }

  const sourceVerification = await verifySourceRom(paths, sourceRomPath);

  if (sourceVerification.status !== 'valid') {
    throw new Error('Selected ROM checksum does not match the supported Pokemon Emerald ROM.');
  }

  const outputPath = getManagedPatchedRomPath(paths, metadata);
  const tempPath = path.join(paths.tempDir, `${metadata.patchedRom.outputFileName}.tmp`);

  fs.mkdirSync(paths.patchedRomDir, { recursive: true });
  fs.mkdirSync(paths.tempDir, { recursive: true });

  try {
    const sourceBytes = fs.readFileSync(sourceRomPath);
    const patchBytes = fs.readFileSync(patchFilePath);
    const { decodeSync } = getXdelta();
    const patchedBytes = decodeSync(sourceBytes, patchBytes);

    fs.writeFileSync(tempPath, patchedBytes);

    const patchedSha256 = await sha256File(tempPath);

    if (patchedSha256 !== metadata.patchedRom.sha256) {
      throw new Error('Patched ROM checksum did not match the expected Divergence build.');
    }

    fs.renameSync(tempPath, outputPath);

    updateSettings((currentSettings) => ({
      ...currentSettings,
      selectedSourceRomPath: sourceRomPath,
      lastPatchedRom: {
        path: outputPath,
        sha256: patchedSha256,
        patchVersion: metadata.patchVersion,
        outputFileName: metadata.patchedRom.outputFileName,
        updatedAt: new Date().toISOString(),
      },
    }));

    return {
      patchedRomPath: outputPath,
      patchedSha256,
      patchVersion: metadata.patchVersion,
    };
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { force: true });
    }
  }
};
