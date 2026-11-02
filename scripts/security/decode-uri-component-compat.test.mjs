import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const allowed = ['apps/mobile-public-react-native', 'apps/mobile-admin-react-native'];
const selection = process.env.PORPROV_EXPO_TEST_APP;
if (selection && !allowed.includes(selection)) throw new Error('Unsupported Expo test project');

for (const app of selection ? [selection] : allowed) {
  const appRequire = createRequire(resolve(root, app, 'package.json'));
  const queryRequire = createRequire(appRequire.resolve('query-string/package.json'));
  const query = appRequire('query-string');
  const decode = queryRequire('decode-uri-component');

  // TEST: Exercise the installed consumer rather than checking the override text alone.
  test(`${app}: patched URI decoder preserves query-string behavior`, () => {
    const entry = queryRequire.resolve('decode-uri-component');
    const directory = dirname(entry);
    assert.equal(JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8')).version, '0.5.1-porprov.1');
    const provenance = JSON.parse(readFileSync(resolve(directory, 'provenance.json'), 'utf8'));
    assert.equal(provenance.version, '0.5.1');
    const adapted = readFileSync(entry, 'utf8').replaceAll('\r\n', '\n');
    assert.equal(createHash('sha256').update(adapted).digest('hex'), provenance.adapted_source_sha256);
    const prefix = "'use strict';\n// INFO: Mechanical CommonJS adaptation of upstream 0.5.1; the patched single-pass algorithm is unchanged.\n";
    assert.ok(adapted.startsWith(prefix));
    const original = adapted.slice(prefix.length).replaceAll(/\bpercentBytePattern\b/g, 'token').replace('module.exports = function decodeUriComponent(encodedURI)', 'export default function decodeUriComponent(encodedURI)');
    assert.equal(createHash('sha256').update(original).digest('hex'), provenance.upstream_source_sha256);
    const parsed = query.parse('nama=Bola%20Basket&kategori=Putri&catatan=Jum%27at');
    assert.equal(parsed.nama, 'Bola Basket');
    assert.equal(parsed.catatan, "Jum'at");
    assert.equal(decode('%F0%9F%8F%80'), '🏀');
    const roundtrip = query.parse(query.stringify({ nama: 'Bola Basket', kota: 'Depok' }));
    assert.equal(roundtrip.nama, 'Bola Basket');
    assert.equal(roundtrip.kota, 'Depok');
  });

  // SECURITY: Run the advisory's malformed distinct-run pattern in a bounded worker, never against production.
  test(`${app}: malformed URI runs do not stall the event loop`, () => {
    const entry = queryRequire.resolve('decode-uri-component');
    const source = `const decode=require(${JSON.stringify(entry)});let input='';for(let i=0;i<32000;i++){input+='%'+Math.floor(i/256).toString(16).padStart(2,'0')+'%'+(i%256).toString(16).padStart(2,'0')+'x';}input+='%zz';if(typeof decode(input)!=='string')process.exit(1);`;
    const worker = spawnSync(process.execPath, ['--max-old-space-size=128', '-e', source], { timeout: 5000, encoding: 'utf8', maxBuffer: 1024 * 1024 });
    assert.equal(worker.error, undefined, 'URI decoding exceeded its bounded worker budget');
    assert.equal(worker.status, 0, 'URI decoder failed malformed-input compatibility');
  });
}
