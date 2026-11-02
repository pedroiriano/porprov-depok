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
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const app = process.env.PORPROV_DEPENDENCY_TEST_APP || 'apps/public-web-nextjs';
assert.ok(['apps/public-web-nextjs', 'apps/admin-web-react', 'apps/mobile-public-react-native', 'apps/mobile-admin-react-native'].includes(app));
const require = createRequire(resolve(root, app, 'package.json'));
if (app !== 'apps/admin-web-react') require('@porprov/minimatch-compat/register.cjs');

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
  test('legacy lint consumers use the patched engine with their callable and predicate contracts', () => {
    const consumer = createRequire(require.resolve('eslint-plugin-import'));
    const match = consumer('minimatch');
    assert.equal(consumer('minimatch/package.json').name, 'minimatch');
    assert.equal(consumer('minimatch/package.json').version, '11.0.4');
    const engine = createRequire(consumer.resolve('minimatch'));
    assert.equal(engine('minimatch/package.json').version, '11.0.4');
    assert.equal(match, require('@porprov/minimatch-compat'));
    assert.equal(typeof require('minimatch'), 'object');
    const proof = require('@porprov/minimatch-compat/provenance.json');
    for (const [file, key] of [['index.cjs', 'adapter_source_sha256'], ['register.cjs', 'hook_source_sha256']]) {
      const entry = file === 'index.cjs' ? require.resolve('@porprov/minimatch-compat') : require.resolve('@porprov/minimatch-compat/register.cjs');
      const text = fs.readFileSync(entry, 'utf8').replaceAll('\r\n', '\n');
      assert.equal(createHash('sha256').update(text).digest('hex'), proof[key]);
    }
    const locked = JSON.parse(fs.readFileSync(resolve(root, app, 'package-lock.json'), 'utf8')).packages['node_modules/minimatch'];
    assert.equal(locked.version, '11.0.4');
    assert.ok(locked.resolved.startsWith('https://registry.npmjs.org/minimatch/'));
    assert.equal(locked.integrity, proof.engine_registry_integrity);
    const corpus = [
      ['src/a.js', '**/*.js', {}, true], ['src/a.ts', '**/*.js', {}, false],
      ['src/.a.js', '**/*.js', {}, false], ['src/.a.js', '**/*.js', { dot: true }, true],
      ['APP.JS', '*.js', { nocase: true }, true], ['src/a.js', '*.js', { matchBase: true }, true],
      ['a.ts', '*.{js,ts}', {}, true], ['a.ts', '*.{js,ts}', { nobrace: true }, false],
      ['PanelCard', 'Panel*', {}, true], ['PanelCard', 'Other*', {}, false],
      ['src/a.js', '!**/*.ts', {}, true], ['a.js', '+(a|b).js', {}, true],
      ['a.js', '+(a|b).js', { noext: true }, false], ['#note', '#note', {}, false],
    ];
    for (const [path, pattern, options, expected] of corpus) {
      assert.equal(match(path, pattern, options), expected, `${path}: ${pattern}`);
      assert.equal(new match.Minimatch(pattern, options).match(path), expected);
      assert.equal(match.makeRe(pattern, options).test(path), expected);
      assert.equal(match.filter(pattern, options)(path), expected);
    }
    assert.deepEqual(match.match(['a.ts', 'a.js'], '*.js'), ['a.js']);
    assert.deepEqual(match.braceExpand('*.{js,ts}'), ['*.js', '*.ts']);
    assert.equal(match.defaults({ nocase: true })('APP.JS', '*.js'), true);
    assert.equal(new (match.Minimatch.defaults({ nocase: true }))('*.js').match('APP.JS'), true);
  });

  test('actual ESLint import and JSX rules still reject violations and accept ordinary input', async () => {
    const { ESLint } = require('eslint');
    const lint = new ESLint({
      cwd: resolve(root, app), overrideConfigFile: true, ignore: false,
      overrideConfig: [{
        files: ['**/*.jsx'],
        languageOptions: { ecmaVersion: 2022, sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
        plugins: { import: require('eslint-plugin-import'), react: require('eslint-plugin-react') },
        rules: {
          'import/no-internal-modules': ['error', { forbid: ['private/**'] }],
          'react/forbid-component-props': ['error', { forbid: [{ propNamePattern: 'secret*', disallowedForPatterns: ['Panel*'] }] }],
        },
      }],
    });
    const [bad] = await lint.lintText('import value from "private/secret"; export const View = () => <PanelCard secretToken="fixture" />;', { filePath: 'porprov-lint-fixture.jsx' });
    assert.deepEqual(bad.messages.map(message => message.ruleId).sort(), ['import/no-internal-modules', 'react/forbid-component-props']);
    const [good] = await lint.lintText('import value from "public/info"; export const View = () => <PanelCard label="fixture" />;', { filePath: 'porprov-lint-fixture.jsx' });
    assert.equal(good.messages.length, 0);
  });

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
    assert.equal(consumer('minimatch/package.json').name, 'minimatch');
    assert.equal(consumer('minimatch/package.json').version, '11.0.4');
    const patched = createRequire(consumer.resolve('minimatch'));
    assert.equal(patched('minimatch/package.json').version, '11.0.4');
    const entry = consumer.resolve('minimatch');
    const source = `const {Minimatch}=require(${JSON.stringify(entry)});try{new Minimatch('a/**/../'.repeat(32)+'z',{optimizationLevel:2,braceExpandMax:64}).match('a/z')}catch(e){if(!(e instanceof RangeError))throw e}`;
    const worker = spawnSync(process.execPath, ['--max-old-space-size=128', '-e', source], { timeout: 5000, encoding: 'utf8', maxBuffer: 1024 * 1024 });
    assert.equal(worker.error, undefined, 'matcher exceeded its bounded worker budget');
    assert.equal(worker.status, 0, worker.stderr);
  });
}
