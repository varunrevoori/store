/**
 * Safe env check — prints hosts and booleans only, never key values.
 * Run: npm run check:env
 */
import { deploymentLabel, resolveApiBase, resolveWebOrigins } from '@lon-crm/shared';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env');

if (!existsSync(envPath)) {
  console.error('No .env at repo root:', envPath);
  process.exit(1);
}

loadEnv({ path: envPath });

function host(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return `INVALID_URL (${String(url).slice(0, 20)}…)`;
  }
}

const pairs = [
  ['SUPABASE_URL', process.env.SUPABASE_URL],
  ['VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL],
];

const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.VITE_SUPABASE_ANON_KEY;

const mode = deploymentLabel(process.env);
const apiUrl = resolveApiBase({
  apiUrlFromEnv: process.env.VITE_API_URL,
  isDev: process.env.NODE_ENV !== 'production',
  browserOrigin: undefined,
});
const webOrigins = resolveWebOrigins(process.env);

console.log('--- Lon CRM env check (no secrets printed) ---\n');
console.log('Mode:', mode);
console.log('Resolved API base (no browser):', apiUrl);
console.log('VITE_API_URL raw:', process.env.VITE_API_URL?.trim() || '(unset → defaults above)');
console.log('WEB_ORIGIN / CORS allow-list:', webOrigins.join(', '));

for (const [name, value] of pairs) {
  console.log(`${name} host:`, host(value) ?? '(not set)');
}

const h1 = host(process.env.SUPABASE_URL);
const h2 = host(process.env.VITE_SUPABASE_URL);
if (h1 && h2) {
  console.log(
    h1 === h2
      ? '\n✓ Supabase URL hosts MATCH (good for JWT)'
      : `\n✗ Supabase URL hosts DIFFER — fix .env so both use the same project:\n    backend: ${h1}\n    frontend: ${h2}`,
  );
} else {
  console.log('\n✗ Set both SUPABASE_URL and VITE_SUPABASE_URL');
}

console.log('\nSUPABASE_SERVICE_ROLE_KEY set:', Boolean(serviceRole && serviceRole.length > 20));
console.log('VITE_SUPABASE_ANON_KEY set:', Boolean(anon && anon.length > 20));
console.log('SKIP_AUTH:', process.env.SKIP_AUTH ?? '(unset)');
console.log('VITE_SKIP_AUTH:', process.env.VITE_SKIP_AUTH ?? '(unset)');

if (process.env.SKIP_AUTH === 'true' || process.env.VITE_SKIP_AUTH === 'true') {
  console.log('\nNote: SKIP_AUTH true bypasses API JWT on backend; frontend still needs a real session for superadmin.');
}

console.log('\nExpected superadmin login UID must match admin_users.user_id in Supabase.');
console.log('Done.\n');

process.exit(h1 && h2 && h1 === h2 && serviceRole && anon ? 0 : 1);