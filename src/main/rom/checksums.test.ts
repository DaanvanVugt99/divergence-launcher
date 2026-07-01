import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { LauncherPaths } from '../paths';
import { assertPatchMetadata, findMatchingSourceRom, loadPatchMetadata } from './checksums';

let tempDir: string;
let paths: LauncherPaths;

const validHash = 'a9dec84dfe7f62ab2220bafaef7479da0929d066ece16a6885f6226db19085af';
const patchedHash = '7ade3ef606dfbe8b1c7ef88028b386f13ca132462a5a72935bda83a303a12d1a';

const validMetadata = {
  patchVersion: 'v0.1',
  patchFileName: 'divergence-v0.1.xdelta',
  sourceRoms: [
    {
      id: 'pokemon-emerald-usa-europe',
      label: 'Pokemon Emerald (USA, Europe)',
      sha256: validHash,
    },
  ],
  patchedRom: {
    id: 'divergence-v0.1',
    label: 'Pokemon Emerald Rogue: Divergence v0.1',
    sha256: patchedHash,
    outputFileName: 'Pokemon Emerald Rogue Divergence.gba',
  },
};

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'divergence-checksums-test-'));
  paths = {
    appDataDir: tempDir,
    patchedRomDir: path.join(tempDir, 'roms'),
    tempDir: path.join(tempDir, 'tmp'),
    settingsPath: path.join(tempDir, 'settings.json'),
    resourcesDir: path.join(tempDir, 'resources'),
    patchMetadataPath: path.join(tempDir, 'resources', 'patches', 'checksums.json'),
  };

  fs.mkdirSync(path.dirname(paths.patchMetadataPath), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('patch metadata', () => {
  it('loads complete metadata and matches configured source hashes', () => {
    fs.writeFileSync(paths.patchMetadataPath, JSON.stringify(validMetadata));

    const metadata = loadPatchMetadata(paths);

    expect(metadata.patchVersion).toBe('v0.1');
    expect(findMatchingSourceRom(metadata, validHash)?.id).toBe('pokemon-emerald-usa-europe');
    expect(findMatchingSourceRom(metadata, patchedHash)).toBeNull();
  });

  it('rejects incomplete metadata', () => {
    expect(() => assertPatchMetadata({ patchVersion: 'v0.1' })).toThrow(/source ROM/i);
  });

  it('rejects invalid hashes', () => {
    expect(() =>
      assertPatchMetadata({
        ...validMetadata,
        sourceRoms: [{ ...validMetadata.sourceRoms[0], sha256: 'not-a-hash' }],
      }),
    ).toThrow(/invalid/i);
  });
});
