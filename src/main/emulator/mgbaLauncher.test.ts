import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMgbaLaunchRequest, launchMgba } from './mgbaLauncher';

const { spawnMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}));

const createMockChildProcess = () => {
  const childProcess = new EventEmitter() as EventEmitter & { unref: ReturnType<typeof vi.fn> };
  childProcess.unref = vi.fn();
  return childProcess;
};

beforeEach(() => {
  spawnMock.mockReset();
});

describe('launchMgba', () => {
  it('starts mGBA with the ROM path and detaches the process', async () => {
    const childProcess = createMockChildProcess();
    spawnMock.mockReturnValue(childProcess);

    const launchPromise = launchMgba({
      mgbaPath: '/Applications/mGBA.app/Contents/MacOS/mGBA',
      romPath: '/Users/test/Divergence.gba',
    });

    childProcess.emit('spawn');

    await expect(launchPromise).resolves.toMatchObject({
      mgbaPath: '/Applications/mGBA.app/Contents/MacOS/mGBA',
      romPath: '/Users/test/Divergence.gba',
    });
    expect(spawnMock).toHaveBeenCalledWith(
      '/Applications/mGBA.app/Contents/MacOS/mGBA',
      ['/Users/test/Divergence.gba'],
      {
        detached: true,
        stdio: 'ignore',
      },
    );
    expect(childProcess.unref).toHaveBeenCalledOnce();
  });

  it('rejects with a friendly error when mGBA fails to start', async () => {
    const childProcess = createMockChildProcess();
    spawnMock.mockReturnValue(childProcess);

    const launchPromise = launchMgba({
      mgbaPath: '/missing/mgba',
      romPath: '/Users/test/Divergence.gba',
    });

    childProcess.emit('error', new Error('ENOENT'));

    await expect(launchPromise).rejects.toThrow('Could not launch mGBA: ENOENT');
    expect(childProcess.unref).not.toHaveBeenCalled();
  });

  it('calls the exit callback when the launched mGBA process closes', async () => {
    const childProcess = createMockChildProcess();
    const onExit = vi.fn();
    spawnMock.mockReturnValue(childProcess);

    const launchPromise = launchMgba(
      {
        mgbaPath: '/Applications/mGBA.app/Contents/MacOS/mGBA',
        romPath: '/Users/test/Divergence.gba',
      },
      { onExit },
    );

    childProcess.emit('spawn');
    await launchPromise;

    expect(onExit).not.toHaveBeenCalled();

    childProcess.emit('close');

    expect(onExit).toHaveBeenCalledOnce();
  });
});

describe('createMgbaLaunchRequest', () => {
  const readyRomLibrary = {
    patchedRomPath: '/Users/test/Divergence.gba',
    hasPatchedRom: true,
    sourceRomPath: '/Users/test/Emerald.gba',
    lastPatchedSha256: 'a'.repeat(64),
    outputFileName: 'Divergence.gba',
  };
  const readyMgba = {
    status: 'found' as const,
    path: '/Applications/mGBA.app/Contents/MacOS/mGBA',
    source: 'configured' as const,
  };

  it('returns the launch request when mGBA and patched ROM are ready', () => {
    expect(
      createMgbaLaunchRequest({
        mgba: readyMgba,
        romLibrary: readyRomLibrary,
        expectedPatchedSha256: 'a'.repeat(64),
      }),
    ).toEqual({
      mgbaPath: '/Applications/mGBA.app/Contents/MacOS/mGBA',
      romPath: '/Users/test/Divergence.gba',
    });
  });

  it('rejects missing mGBA before launch', () => {
    expect(() =>
      createMgbaLaunchRequest({
        mgba: {
          status: 'not-found',
          path: null,
          source: 'unconfigured',
        },
        romLibrary: readyRomLibrary,
        expectedPatchedSha256: 'a'.repeat(64),
      }),
    ).toThrow(/mGBA is not configured/i);
  });

  it('rejects a missing patched ROM before launch', () => {
    expect(() =>
      createMgbaLaunchRequest({
        mgba: readyMgba,
        romLibrary: {
          ...readyRomLibrary,
          hasPatchedRom: false,
          lastPatchedSha256: null,
        },
        expectedPatchedSha256: 'a'.repeat(64),
      }),
    ).toThrow(/No patched ROM/i);
  });

  it('rejects a patched ROM hash mismatch before launch', () => {
    expect(() =>
      createMgbaLaunchRequest({
        mgba: readyMgba,
        romLibrary: {
          ...readyRomLibrary,
          lastPatchedSha256: 'b'.repeat(64),
        },
        expectedPatchedSha256: 'a'.repeat(64),
      }),
    ).toThrow(/not verified/i);
  });
});
