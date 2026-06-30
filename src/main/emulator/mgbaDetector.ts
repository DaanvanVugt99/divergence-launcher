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

export const detectMgba = async (configuredPath?: string | null): Promise<MgbaDetectionResult> => {
  if (configuredPath && fs.existsSync(configuredPath)) {
    return {
      status: 'found',
      path: configuredPath,
      source: 'configured',
    };
  }

  const commonPath = getCandidatePaths().find((candidate) => fs.existsSync(candidate));

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
