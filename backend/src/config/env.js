import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const backendRoot = join(here, '../..');

const candidates = [
  join(repoRoot, '.env'),
  join(backendRoot, '.env'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../.env'),
];

for (const path of candidates) {
  if (existsSync(path)) {
    loadEnv({ path, override: false });
  }
}