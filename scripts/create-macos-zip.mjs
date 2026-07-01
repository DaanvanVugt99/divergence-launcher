import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { appName, repoRoot, resolvePackagedAppPath, zipDir, zipPath } from './macos-artifact-paths.mjs';

if (process.platform !== 'darwin') {
  throw new Error('macOS ZIP creation must run on macOS.');
}

const appPath = resolvePackagedAppPath({ waitMilliseconds: 30000 });
const packageDir = path.dirname(appPath);

fs.mkdirSync(zipDir, { recursive: true });
fs.rmSync(zipPath, { force: true });

execFileSync('ditto', ['-c', '-k', '--norsrc', '--keepParent', path.basename(appPath), zipPath], {
  cwd: packageDir,
  stdio: 'inherit',
});

console.log(`Created macOS ZIP: ${path.relative(repoRoot, zipPath)}`);
