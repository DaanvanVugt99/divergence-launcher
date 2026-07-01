import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { encodeSync } from '@chainsafe/xdelta3-node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LauncherPaths } from '../paths';
import type { LauncherSettings } from '../settings/settingsStore';
import { applyPatch, verifySourceRom } from './patcher';

vi.mock('../settings/settingsStore', () => ({
  updateSettings: vi.fn((updater: (settings: LauncherSettings) => LauncherSettings) => {
    settings = updater(settings);
    return settings;
  }),
}));

let tempDir: string;
let paths: LauncherPaths;
let settings: LauncherSettings;

const sha256 = (bytes: Uint8Array | string) =>
  crypto.createHash('sha256').update(bytes).digest('hex');

const writePatchFixture = (expectedPatchedHash?: string) => {
  const sourcePath = path.join(tempDir, 'source.gba');
  const sourceBytes = Buffer.from('clean emerald fixture');
  const patchedBytes = Buffer.from('patched divergence fixture');
  const patchBytes = encodeSync(sourceBytes, patchedBytes);

  fs.writeFileSync(sourcePath, sourceBytes);
  fs.mkdirSync(path.join(paths.resourcesDir, 'patches'), { recursive: true });
  fs.writeFileSync(path.join(paths.resourcesDir, 'patches', 'divergence-v0.1.xdelta'), patchBytes);
  fs.writeFileSync(
    paths.patchMetadataPath,
    JSON.stringify({
      patchVersion: 'v0.1',
      patchFileName: 'divergence-v0.1.xdelta',
      sourceRoms: [
        {
          id: 'fixture-source',
          label: 'Fixture Source',
          sha256: sha256(sourceBytes),
        },
      ],
      patchedRom: {
        id: 'fixture-patched',
        label: 'Fixture Patched',
        sha256: expectedPatchedHash ?? sha256(patchedBytes),
        outputFileName: 'fixture.gba',
      },
    }),
  );

  return { sourcePath, patchedBytes };
};

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'divergence-patcher-test-'));
  paths = {
    appDataDir: tempDir,
    patchedRomDir: path.join(tempDir, 'roms'),
    tempDir: path.join(tempDir, 'tmp'),
    settingsPath: path.join(tempDir, 'settings.json'),
    resourcesDir: path.join(tempDir, 'resources'),
    patchMetadataPath: path.join(tempDir, 'resources', 'patches', 'checksums.json'),
  };
  settings = {
    mgbaPath: null,
    suppressMgbaAutoDetect: false,
    selectedSourceRomPath: null,
    lastSourceRomVerification: null,
    lastPatchedRom: null,
  };
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('applyPatch', () => {
  it('builds a managed patched ROM after source and output verification pass', async () => {
    const { sourcePath, patchedBytes } = writePatchFixture();

    const result = await applyPatch(paths, sourcePath);

    expect(result.patchedSha256).toBe(sha256(patchedBytes));
    expect(fs.readFileSync(result.patchedRomPath)).toEqual(patchedBytes);
    expect(settings.lastSourceRomVerification?.status).toBe('valid');
    expect(settings.lastPatchedRom?.sha256).toBe(sha256(patchedBytes));
  });

  it('does not create output when source verification fails', async () => {
    const { sourcePath } = writePatchFixture();

    fs.writeFileSync(sourcePath, 'wrong source');

    await expect(applyPatch(paths, sourcePath)).rejects.toThrow(/checksum/i);
    expect(fs.existsSync(path.join(paths.patchedRomDir, 'fixture.gba'))).toBe(false);
  });

  it('keeps the previous managed ROM when patched verification fails', async () => {
    const { sourcePath } = writePatchFixture('0'.repeat(64));
    const outputPath = path.join(paths.patchedRomDir, 'fixture.gba');

    fs.mkdirSync(paths.patchedRomDir, { recursive: true });
    fs.writeFileSync(outputPath, 'previous output');

    await expect(applyPatch(paths, sourcePath)).rejects.toThrow(/Patched ROM checksum/i);
    expect(fs.readFileSync(outputPath, 'utf8')).toBe('previous output');
  });
});

describe('verifySourceRom', () => {
  it('rejects source ROM files that are too large for a GBA ROM', async () => {
    const oversizedRomPath = path.join(tempDir, 'oversized.gba');

    fs.writeFileSync(oversizedRomPath, '');
    fs.truncateSync(oversizedRomPath, 65 * 1024 * 1024);

    await expect(verifySourceRom(paths, oversizedRomPath)).rejects.toThrow(/too large/i);
  });
});
