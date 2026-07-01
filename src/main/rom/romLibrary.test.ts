import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { LauncherPaths } from '../paths';
import type { LauncherSettings } from '../settings/settingsStore';
import type { PatchMetadata } from './checksums';
import { getManagedPatchedRomPath, getRomLibraryState } from './romLibrary';

let tempDir: string;
let paths: LauncherPaths;
let settings: LauncherSettings;
let metadata: PatchMetadata;

const sha256 = (bytes: Uint8Array | string) => crypto.createHash('sha256').update(bytes).digest('hex');

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'divergence-rom-library-test-'));
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
    selectedSourceRomPath: '/tmp/source.gba',
    lastSourceRomVerification: null,
    lastPatchedRom: {
      path: path.join(paths.patchedRomDir, 'fixture.gba'),
      sha256: '0'.repeat(64),
      patchVersion: 'v0.1',
      outputFileName: 'fixture.gba',
      updatedAt: new Date().toISOString(),
    },
  };
  metadata = {
    patchVersion: 'v0.1',
    patchFileName: 'fixture.xdelta',
    sourceRoms: [],
    patchedRom: {
      id: 'fixture-patched',
      label: 'Fixture Patched',
      sha256: sha256('actual patched rom'),
      outputFileName: 'fixture.gba',
    },
  };
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('getRomLibraryState', () => {
  it('reports the current managed ROM hash instead of persisted settings metadata', async () => {
    const patchedRomPath = getManagedPatchedRomPath(paths, metadata);

    fs.mkdirSync(path.dirname(patchedRomPath), { recursive: true });
    fs.writeFileSync(patchedRomPath, 'actual patched rom');

    const state = await getRomLibraryState(paths, metadata, settings);

    expect(state.hasPatchedRom).toBe(true);
    expect(state.lastPatchedSha256).toBe(metadata.patchedRom.sha256);
  });

  it('does not report a hash when the managed ROM is missing', async () => {
    const state = await getRomLibraryState(paths, metadata, settings);

    expect(state.hasPatchedRom).toBe(false);
    expect(state.lastPatchedSha256).toBeNull();
  });
});
