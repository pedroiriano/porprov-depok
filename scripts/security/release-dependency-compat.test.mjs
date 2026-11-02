import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, basename } from 'node:path';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { runInNewContext } from 'node:vm';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const app = process.env.PORPROV_DEPENDENCY_TEST_APP || 'apps/public-web-nextjs';
assert.ok(['apps/public-web-nextjs', 'apps/admin-web-react', 'apps/mobile-public-react-native', 'apps/mobile-admin-react-native'].includes(app));
const require = createRequire(resolve(root, app, 'package.json'));

test('custom sensitive headers from another realm never follow a cross-origin redirect', async () => {
  assert.equal(require('follow-redirects/package.json').version, '1.16.2');
  let received;
  const target = createServer((request, response) => {
    received = request.headers['x-porprov-fixture'];
    response.end('ok');
  });
  let from;
  try {
    target.listen(0, '127.0.0.1');
    await once(target, 'listening');
    from = createServer((request, response) => {
      response.writeHead(302, { Location: `http://127.0.0.1:${target.address().port}/target` });
      response.end();
    });
    from.listen(0, '127.0.0.1');
    await once(from, 'listening');
    const custom = runInNewContext('["x-porprov-fixture"]');
    assert.equal(custom instanceof Array, false);
    // SECURITY: Only a synthetic header and loopback ephemeral ports are used.
    await new Promise((accept, reject) => {
      const request = require('follow-redirects').http.get({
        hostname: '127.0.0.1', port: from.address().port, path: '/start',
        headers: { 'x-porprov-fixture': 'synthetic-test-only' }, sensitiveHeaders: custom,
      }, response => { response.resume(); response.on('end', accept); });
      request.on('error', reject);
      request.setTimeout(2000, () => request.destroy(new Error('fixture timeout')));
    });
    assert.equal(received, undefined);
  } finally {
    if (from?.listening) await new Promise(done => from.close(done));
    if (target.listening) await new Promise(done => target.close(done));
  }
});

if (app !== 'apps/admin-web-react') {
  test('glob traversal stops when the first directory read aborts', async () => {
    assert.equal(require('glob/package.json').version, '14.0.2');
    const temporary = fs.mkdtempSync(join(tmpdir(), 'porprov-glob-fixture-'));
    const controller = new AbortController();
    const reason = new Error('synthetic abort');
    let reads = 0;
    try {
      for (let i = 0; i < 20; i++) fs.mkdirSync(join(temporary, `child-${i}`, 'nested'), { recursive: true });
      const instrumented = { ...fs, readdir(path, options, callback) {
        reads++;
        return fs.readdir(path, options, (error, entries) => {
          controller.abort(reason);
          callback(error, entries);
        });
      } };
      await assert.rejects(require('glob').glob('**/*', { cwd: temporary, signal: controller.signal, fs: instrumented }), error => error === reason);
      await new Promise(done => setTimeout(done, 30));
      assert.equal(reads, 1, 'aborted traversal must not start child-directory reads');
    } finally {
      // TEST: Remove only the freshly-created, resolved OS fixture directory.
      const exact = fs.realpathSync(temporary);
      assert.equal(dirname(exact), fs.realpathSync(tmpdir()));
      assert.ok(basename(exact).startsWith('porprov-glob-fixture-'));
      fs.rmSync(exact, { recursive: true });
    }
  });

  test('patched modern matcher bounds globparts amplification', () => {
    const consumer = createRequire(require.resolve('@typescript-eslint/typescript-estree/package.json'));
    assert.equal(consumer('minimatch/package.json').version, '11.0.1');
    const entry = consumer.resolve('minimatch');
    const source = `const {Minimatch}=require(${JSON.stringify(entry)});try{new Minimatch('a/**/../'.repeat(32)+'z',{optimizationLevel:2,braceExpandMax:64}).match('a/z')}catch(e){if(!(e instanceof RangeError))throw e}`;
    const worker = spawnSync(process.execPath, ['--max-old-space-size=128', '-e', source], { timeout: 5000, encoding: 'utf8', maxBuffer: 1024 * 1024 });
    assert.equal(worker.error, undefined, 'matcher exceeded its bounded worker budget');
    assert.equal(worker.status, 0, worker.stderr);
  });
}
