import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import packageJson from '../package.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const [platform, arch] = process.argv.slice(2);

if (!platform || !arch) {
  throw new Error('Usage: node scripts/clean-package-output.mjs <platform> <arch>');
}

const packageDir = path.join(repoRoot, 'out', `${packageJson.productName}-${platform}-${arch}`);

if (!fs.existsSync(packageDir)) {
  console.log(`Package output already clean: ${path.relative(repoRoot, packageDir)}`);
  process.exit(0);
}

const trashDir = path.join(repoRoot, 'out', '.stale-packages');
const stalePackageDir = path.join(
  trashDir,
  `${path.basename(packageDir)}-${Date.now()}-${process.pid}`,
);

fs.mkdirSync(trashDir, { recursive: true });

try {
  fs.renameSync(packageDir, stalePackageDir);
} catch {
  fs.rmSync(packageDir, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100,
  });
}

if (fs.existsSync(stalePackageDir)) {
  try {
    fs.rmSync(stalePackageDir, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  } catch (error) {
    console.warn(
      `Moved stale package output aside but could not fully delete it: ${path.relative(repoRoot, stalePackageDir)}`,
    );
    console.warn(error instanceof Error ? error.message : String(error));
  }
}

console.log(`Cleaned package output: ${path.relative(repoRoot, packageDir)}`);
