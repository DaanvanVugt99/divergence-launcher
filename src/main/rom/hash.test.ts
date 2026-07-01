import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sha256File } from './hash';

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'divergence-hash-test-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('sha256File', () => {
  it('returns the SHA-256 hash for a file', async () => {
    const fixturePath = path.join(tempDir, 'fixture.bin');

    fs.writeFileSync(fixturePath, 'abc');

    await expect(sha256File(fixturePath)).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
