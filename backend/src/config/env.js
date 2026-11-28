import { LOCAL_WEB_ORIGIN, resolveWebOrigins } from '@lon-crm/shared';
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

/** When WEB_ORIGIN is unset on Vercel, derive it from VERCEL_URL (no hardcoded deploy URL in code). */
if (!String(process.env.WEB_ORIGIN ?? '').trim()) {
  const origins = resolveWebOrigins(process.env);
  const onlyDefaultLocal = origins.length === 1 && origins[0] === LOCAL_WEB_ORIGIN;
  if (!onlyDefaultLocal) {
    process.env.WEB_ORIGIN = origins.join(',');
  }
}