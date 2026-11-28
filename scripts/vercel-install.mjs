/**
 * Vercel install — drop npm_config_cache_dir (unknown in npm 11+) and run a clean install.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env };
delete env.npm_config_cache_dir;

const result = spawnSync('npm', ['install', '--no-fund', '--no-audit'], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);