import fs from 'node:fs';
import type { LauncherPaths } from '../paths';

const sha256Pattern = /^[a-f0-9]{64}$/;

export interface SourceRomProfile {
  id: string;
  label: string;
  sha256: string;
}

export interface PatchedRomProfile {
  id: string;
  label: string;
  sha256: string;
  outputFileName: string;
}

export interface PatchMetadata {
  patchVersion: string;
  patchFileName: string;
  sourceRoms: SourceRomProfile[];
  patchedRom: PatchedRomProfile;
  generatedFrom?: {
    sourceRomLabel?: string;
    rogueRepo?: string;
    rogueCommit?: string;
    rogueDirty?: boolean;
    buildCommand?: string;
    generatedAt?: string;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const requireString = (value: unknown, fieldName: string) => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Patch metadata is missing ${fieldName}.`);
  }

  return value;
};

const requireSha256 = (value: unknown, fieldName: string) => {
  const hash = requireString(value, fieldName).toLowerCase();

  if (!sha256Pattern.test(hash)) {
    throw new Error(`Patch metadata has an invalid ${fieldName}.`);
  }

  return hash;
};

export const assertPatchMetadata = (value: unknown): PatchMetadata => {
  if (!isRecord(value)) {
    throw new Error('Patch metadata must be a JSON object.');
  }

  const sourceRomsValue = value.sourceRoms;

  if (!Array.isArray(sourceRomsValue) || sourceRomsValue.length === 0) {
    throw new Error('Patch metadata must include at least one source ROM profile.');
  }

  const sourceRoms = sourceRomsValue.map((sourceRomValue, index): SourceRomProfile => {
    if (!isRecord(sourceRomValue)) {
      throw new Error(`Patch metadata source ROM ${index + 1} must be an object.`);
    }

    return {
      id: requireString(sourceRomValue.id, `sourceRoms[${index}].id`),
      label: requireString(sourceRomValue.label, `sourceRoms[${index}].label`),
      sha256: requireSha256(sourceRomValue.sha256, `sourceRoms[${index}].sha256`),
    };
  });

  if (!isRecord(value.patchedRom)) {
    throw new Error('Patch metadata must include patchedRom.');
  }

  return {
    patchVersion: requireString(value.patchVersion, 'patchVersion'),
    patchFileName: requireString(value.patchFileName, 'patchFileName'),
    sourceRoms,
    patchedRom: {
      id: requireString(value.patchedRom.id, 'patchedRom.id'),
      label: requireString(value.patchedRom.label, 'patchedRom.label'),
      sha256: requireSha256(value.patchedRom.sha256, 'patchedRom.sha256'),
      outputFileName: requireString(value.patchedRom.outputFileName, 'patchedRom.outputFileName'),
    },
    generatedFrom: isRecord(value.generatedFrom) ? value.generatedFrom : undefined,
  };
};

export const loadPatchMetadata = (paths: LauncherPaths): PatchMetadata => {
  if (!fs.existsSync(paths.patchMetadataPath)) {
    throw new Error('Patch metadata file is missing.');
  }

  return assertPatchMetadata(JSON.parse(fs.readFileSync(paths.patchMetadataPath, 'utf8')));
};

export const findMatchingSourceRom = (metadata: PatchMetadata, sha256: string) =>
  metadata.sourceRoms.find((profile) => profile.sha256 === sha256.toLowerCase()) ?? null;
