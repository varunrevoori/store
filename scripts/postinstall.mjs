/**
 * Windows Application Control blocks native Rollup (.node) under Downloads/.
 * Replace hoisted `rollup` with the WASM build from the frontend workspace.
 */
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(root, 'node_modules');
const wasmCandidates = [
  join(root, 'frontend', 'node_modules', 'rollup'),
  join(nm, '@rollup', 'wasm-node'),
];

function rmNativeRollupAddons() {
  const rollupScope = join(nm, '@rollup');
  if (!existsSync(rollupScope)) return;
  for (const name of readdirSync(rollupScope)) {
    if (name.startsWith('rollup-') && name !== 'wasm-node') {
      rmSync(join(rollupScope, name), { recursive: true, force: true });
    }
  }
}

function useWasmRollup() {
  const target = join(nm, 'rollup');
  const wasmSrc = wasmCandidates.find((p) => {
    if (!existsSync(join(p, 'package.json'))) return false;
    try {
      const pkg = JSON.parse(readFileSync(join(p, 'package.json'), 'utf8'));
      return pkg.name === '@rollup/wasm-node' || existsSync(join(p, 'dist', 'wasm-node'));
    } catch {
      return false;
    }
  });

  if (!wasmSrc) {
    console.warn('[postinstall] @rollup/wasm-node not found — install frontend deps first.');
    return;
  }

  rmSync(target, { recursive: true, force: true });
  cpSync(wasmSrc, target, { recursive: true });

  const pkgPath = join(target, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.name = 'rollup';
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

rmNativeRollupAddons();
useWasmRollup();