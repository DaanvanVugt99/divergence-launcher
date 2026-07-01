import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface MgbaDetectionResult {
  status: 'found' | 'not-found';
  path: string | null;
  source: 'configured' | 'common-location' | 'unconfigured';
}

const getCandidatePaths = () => {
  if (process.platform === 'darwin') {
    return [
      '/Applications/mGBA.app/Contents/MacOS/mGBA',
      path.join(os.homedir(), 'Applications/mGBA.app/Contents/MacOS/mGBA'),
    ];
  }

  if (process.platform === 'win32') {
    const programFiles = process.env.ProgramFiles;
    const programFilesX86 = process.env['ProgramFiles(x86)'];

    return [
      programFiles ? path.join(programFiles, 'mGBA', 'mGBA.exe') : null,
      programFilesX86 ? path.join(programFilesX86, 'mGBA', 'mGBA.exe') : null,
    ].filter(Boolean) as string[];
  }

  return ['/usr/bin/mgba', '/usr/local/bin/mgba'];
};

export const resolveMgbaExecutablePath = (candidatePath: string | null | undefined) => {
  if (!candidatePath) {
    return null;
  }

  if (process.platform === 'darwin' && candidatePath.endsWith('.app')) {
    const bundleExecutablePath = path.join(candidatePath, 'Contents', 'MacOS', 'mGBA');

    if (fs.existsSync(bundleExecutablePath) && fs.statSync(bundleExecutablePath).isFile()) {
      return bundleExecutablePath;
    }
  }

  if (!fs.existsSync(candidatePath)) {
    return null;
  }

  const stat = fs.statSync(candidatePath);

  if (!stat.isFile()) {
    return null;
  }

  if (process.platform === 'win32') {
    return candidatePath.toLowerCase().endsWith('.exe') ? candidatePath : null;
  }

  try {
    fs.accessSync(candidatePath, fs.constants.X_OK);
    return candidatePath;
  } catch {
    return null;
  }
};

interface MgbaDetectionOptions {
  allowCommonLocations?: boolean;
}

export const detectMgba = async (
  configuredPath?: string | null,
  options: MgbaDetectionOptions = {},
): Promise<MgbaDetectionResult> => {
  const allowCommonLocations = options.allowCommonLocations ?? true;
  const resolvedConfiguredPath = resolveMgbaExecutablePath(configuredPath);

  if (resolvedConfiguredPath) {
    return {
      status: 'found',
      path: resolvedConfiguredPath,
      source: 'configured',
    };
  }

  if (!allowCommonLocations) {
    return {
      status: 'not-found',
      path: null,
      source: 'unconfigured',
    };
  }

  const commonPath = getCandidatePaths()
    .map((candidate) => resolveMgbaExecutablePath(candidate))
    .find(Boolean);

  if (commonPath) {
    return {
      status: 'found',
      path: commonPath,
      source: 'common-location',
    };
  }

  return {
    status: 'not-found',
    path: null,
    source: 'unconfigured',
  };
};
