import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [mode, directory] = process.argv.slice(2);
if (!['packages', 'sourcemaps'].includes(mode) || !directory) {
  throw new Error('Usage: check-build-only-dependencies.mjs <packages|sourcemaps> <artifact-directory>');
}
const root = resolve(directory);
const forbidden = /(?:^|\/)node_modules\/(?:braces|micromatch|fast-glob)(?:\/|$)/;
let evidenceCount = 0;
const findings = [];
// SECURITY: Inspect actual generated runtime artifacts, not package.json classification.
function inspect(path, relative = '') {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const artifact = join(path, entry.name);
    const label = `${relative}${entry.name}`;
    if (entry.isDirectory()) {
      if (mode === 'packages' && forbidden.test(label.replaceAll('\\', '/'))) findings.push(label);
      inspect(artifact, `${label}/`);
    } else if (mode === 'sourcemaps' && entry.name.endsWith('.map')) {
      const map = JSON.parse(readFileSync(artifact, 'utf8'));
      if (!Array.isArray(map.sources) || !map.sources.length) throw new Error(`Invalid source map: ${label}`);
      evidenceCount += 1;
      for (const source of map.sources) {
        if (forbidden.test(source.replaceAll('\\', '/'))) findings.push(`${label}: ${source}`);
      }
    } else if (mode === 'packages' && entry.name === 'package.json') evidenceCount += 1;
  }
}
inspect(root);
if (!evidenceCount || findings.length) throw new Error(`FAIL build-only proof: evidence=${evidenceCount}; ${findings.join('; ')}`);
console.log(`PASS build-only proof: ${mode}, artifacts=${evidenceCount}, forbidden runtime dependencies=0`);
