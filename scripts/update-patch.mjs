import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const defaultSourceRomPath = path.join(
  repoRoot,
  'local',
  'roms',
  'source',
  'Pokemon - Emerald Version (USA, Europe).gba',
);
const defaultRogueRepoPath = path.resolve(repoRoot, '..', 'pokeemerald-rogue');

const usage = `Usage: npm run update:patch [-- --source-rom <clean-emerald.gba> --rogue-repo <pokeemerald-rogue>]

Defaults:
  --source-rom ${path.relative(repoRoot, defaultSourceRomPath)}
  --rogue-repo ${path.relative(repoRoot, defaultRogueRepoPath)}

Environment overrides:
  DIVERGENCE_SOURCE_ROM
  DIVERGENCE_ROGUE_REPO`;

const parseArgs = (argv) => {
  const result = {
    sourceRomPath: process.env.DIVERGENCE_SOURCE_ROM ?? defaultSourceRomPath,
    rogueRepoPath: process.env.DIVERGENCE_ROGUE_REPO ?? defaultRogueRepoPath,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      console.log(usage);
      process.exit(0);
    }

    if (arg === '--source-rom') {
      result.sourceRomPath = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (arg === '--rogue-repo') {
      result.rogueRepoPath = argv[index + 1] ?? '';
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return result;
};

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

let args;

try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Invalid arguments.');
  console.error(usage);
  process.exit(1);
}

const sourceRomPath = path.resolve(args.sourceRomPath);
const rogueRepoPath = path.resolve(args.rogueRepoPath);

try {
  assertFile(sourceRomPath, 'Clean source ROM');
  assertDirectory(rogueRepoPath, 'pokeemerald-rogue repo');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Missing patch input.');
  console.error('');
  console.error('Place your legally obtained source ROM at:');
  console.error(`  ${path.relative(repoRoot, defaultSourceRomPath)}`);
  console.error('');
  console.error('Or pass explicit paths:');
  console.error(
    '  npm run update:patch -- --source-rom <clean-emerald.gba> --rogue-repo <pokeemerald-rogue>',
  );
  process.exit(1);
}

console.log(`Using source ROM: ${path.relative(repoRoot, sourceRomPath)}`);
console.log(`Using rogue repo: ${path.relative(repoRoot, rogueRepoPath)}`);

const result = spawnSync(
  process.execPath,
  [
    path.join(repoRoot, 'scripts', 'generate-patch.mjs'),
    '--source-rom',
    sourceRomPath,
    '--rogue-repo',
    rogueRepoPath,
  ],
  {
    cwd: repoRoot,
    stdio: 'inherit',
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
