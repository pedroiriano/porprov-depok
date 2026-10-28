import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// TEST: Isolated browser fixture, never part of the application entrypoint or release image.
const variant = process.argv[2];
if (!['before', 'after'].includes(variant)) throw new Error('Expected before or after');
const root = fileURLToPath(new URL('../', import.meta.url));
const outDir = path.resolve(root, '../../.tmp/modal-focus-fix-20261027', `harness-${variant}`);
const name = `__modal-focus-${variant}`;
await mkdir(outDir, { recursive: true });
await build({
  configFile: false, root, plugins: [react()], define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: { outDir, emptyOutDir: false, lib: { entry: fileURLToPath(new URL('./modal-focus-regression.tsx', import.meta.url)), name: 'ModalFocusRegression', formats: ['iife'], fileName: () => `${name}.js` } },
});
await writeFile(path.join(outDir, `${name}.css`), 'body{font:16px system-ui;background:#eef2f8;color:#10213a}main{padding:24px}button,input,textarea{font:inherit;padding:10px;margin:8px}label{display:block}textarea{min-height:100px}input,textarea{border:1px solid #678;max-width:80%}[role=dialog]{position:fixed;inset:8%;overflow:auto;background:white;border:2px solid #246;border-radius:16px;padding:20px;box-shadow:0 0 0 100vmax #14223b88}button{cursor:pointer}output{display:block}');
await writeFile(path.join(outDir, `${name}.html`), `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Regresi Fokus ${variant}</title><link rel="stylesheet" href="/${name}.css"><script defer src="/${name}.js?v=${Date.now()}"></script></head><body><div id="root"></div></body></html>`);
console.log(`PASS browser fixture ${variant}: ${outDir}`);
