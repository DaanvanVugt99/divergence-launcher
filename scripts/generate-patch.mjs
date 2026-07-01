import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { decodeSync, encodeSync } from '@chainsafe/xdelta3-node';

const expectedSourceSha256 = 'a9dec84dfe7f62ab2220bafaef7479da0929d066ece16a6885f6226db19085af';
const patchVersion = 'v0.1';
const patchFileName = 'divergence-v0.1.xdelta';
const outputFileName = 'Pokemon Emerald Rogue Divergence.gba';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const patchDir = path.join(repoRoot, 'resources', 'patches');
const patchPath = path.join(patchDir, patchFileName);
const metadataPath = path.join(patchDir, 'checksums.json');

const usage = 'Usage: npm run generate:patch -- --source-rom <clean-emerald.gba> --rogue-repo <pokeemerald-rogue>';

const parseArgs = (argv) => {
  const result = {
    sourceRomPath: null,
    rogueRepoPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--source-rom') {
      result.sourceRomPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === '--rogue-repo') {
      result.rogueRepoPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return result;
};

let args;

try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Invalid arguments.');
  console.error(usage);
  process.exit(1);
}

if (!args.sourceRomPath || !args.rogueRepoPath) {
  console.error(usage);
  process.exit(1);
}

const assertFile = (filePath, label) => {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`${label} does not exist: ${filePath}`);
  }
};

const assertDirectory = (directoryPath, label) => {
  if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
    throw new Error(`${label} does not exist: ${directoryPath}`);
  }
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}.`);
  }

  return typeof result.stdout === 'string' ? result.stdout.trim() : '';
};

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

const sourceRomPath = path.resolve(args.sourceRomPath);
const rogueRepoPath = path.resolve(args.rogueRepoPath);
const buildCommandArgs = ['-j10', 'rom', 'RELEASE=1'];
const buildCommand = `make ${buildCommandArgs.join(' ')}`;
const builtRomPath = path.join(rogueRepoPath, 'pokeemerald.gba');

assertFile(sourceRomPath, 'Clean source ROM');
assertDirectory(rogueRepoPath, 'pokeemerald-rogue repo');

const rogueRepoName = path.basename(rogueRepoPath);
const rogueCommit = run('git', ['-C', rogueRepoPath, 'rev-parse', 'HEAD']);
const rogueDirty = run('git', ['-C', rogueRepoPath, 'status', '--porcelain']).length > 0;

console.log(`Building ${rogueRepoName}: ${buildCommand}`);
run('make', buildCommandArgs, {
  cwd: rogueRepoPath,
  stdio: 'inherit',
});

assertFile(builtRomPath, 'Built Divergence ROM');

const sourceBytes = fs.readFileSync(sourceRomPath);
const builtBytes = fs.readFileSync(builtRomPath);
const sourceSha256 = sha256(sourceBytes);
const patchedSha256 = sha256(builtBytes);

if (sourceSha256 !== expectedSourceSha256) {
  throw new Error(`Source ROM hash mismatch. Expected ${expectedSourceSha256}, got ${sourceSha256}.`);
}

fs.mkdirSync(patchDir, { recursive: true });

const patchBytes = encodeSync(sourceBytes, builtBytes);
const decodedBytes = decodeSync(sourceBytes, patchBytes);
const decodedSha256 = sha256(decodedBytes);

if (decodedSha256 !== patchedSha256) {
  throw new Error(`Generated patch verification failed. Expected ${patchedSha256}, got ${decodedSha256}.`);
}

fs.writeFileSync(patchPath, patchBytes);

const metadata = {
  patchVersion,
  patchFileName,
  sourceRoms: [
    {
      id: 'pokemon-emerald-usa-europe',
      label: 'Pokemon Emerald (USA, Europe)',
      sha256: sourceSha256,
    },
  ],
  patchedRom: {
    id: 'divergence-v0.1',
    label: 'Pokemon Emerald Rogue: Divergence v0.1',
    sha256: patchedSha256,
    outputFileName,
  },
  generatedFrom: {
    sourceRomLabel: 'Pokemon Emerald (USA, Europe)',
    rogueRepo: rogueRepoName,
    rogueCommit,
    rogueDirty,
    buildCommand,
    generatedAt: new Date().toISOString(),
  },
};

fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

console.log(`Patch written: ${patchPath}`);
console.log(`Patch bytes: ${patchBytes.byteLength}`);
console.log(`Source SHA-256: ${sourceSha256}`);
console.log(`Patched SHA-256: ${patchedSha256}`);
console.log(`Rogue commit: ${rogueCommit}${rogueDirty ? ' (dirty)' : ''}`);
