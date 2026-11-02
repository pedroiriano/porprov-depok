import assert from 'node:assert/strict';
import test from 'node:test';
import {inspectPublicCopy} from './check-public-language.mjs';

test('public language rejects internal copy in visible text, metadata, aria and interpolated error sinks',()=>{
  for(const source of [
    '<p>API Gateway belum siap</p>',
    'const metadata={description:"Master Data Service"};',
    '<button aria-label="SSE + JetStream"/>',
    'setError(`API Gateway ${status}`);',
    '<p>{connected ? "Polling aktif" : "fallback 30 detik"}</p>',
  ])assert.ok(inspectPublicCopy('example.tsx',source).length>0,source);
});

test('public language preserves machine identifiers, internal diagnostics, meaningful limitations and dummy warnings',()=>{
  for(const source of [
    'import {PublicApiGateway} from "./API"; const backend="/api/runtime";',
    'throw new Error(`API Gateway ${status}`);',
    '<div className="runtime backend">Pembaruan berkala</div>',
    '<p>Pengembangan prestasi atlet.</p>',
    '<p>DUMMY LOKAL — bukan jadwal resmi.</p>',
    '<p>Pilih hingga 10 berkas dengan total 100 MiB.</p>',
  ])assert.deepEqual(inspectPublicCopy('example.tsx',source),[],source);
});
