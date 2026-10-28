import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(import.meta.url);
const merge = require('../../packages/deepmerge-safe/index.cjs');

// TEST: Exercise the advisory's null/primitive/own-key paths, including the returned prototype.
for (const [name, target] of [
  ['null prototype', Object.create(null)], ['null', null], ['undefined', undefined],
  ['number', 0], ['own proto key', JSON.parse('{"__proto__":{"old":true}}')],
]) {
  test(`returned prototype remains safe: ${name}`, () => {
    const result = merge(target, JSON.parse('{"__proto__":{"isAdmin":true}}'));
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
    assert.equal(result.isAdmin, undefined);
    assert.equal(Object.prototype.isAdmin, undefined);
  });
}
test('nested and target-copy poisoning do not become inherited authorization data', () => {
  const target = JSON.parse('{"settings":{"__proto__":{"isAdmin":true}}}');
  const result = merge(target, { settings: { enabled: true } });
  assert.equal(Object.getPrototypeOf(result.settings), Object.prototype);
  assert.equal(result.settings.isAdmin, undefined);
  assert.equal(result.settings.enabled, true);
  assert.equal(Object.prototype.isAdmin, undefined);
});
test('ordinary nested config, arrays, symbols, clone and custom merges retain compatibility', () => {
  const symbol = Symbol('config');
  const left = { ios: { plist: { camera: 'allowed' } }, list: [{ a: 1 }], [symbol]: { old: 1 } };
  const right = { ios: { plist: { location: 'allowed' } }, list: [{ b: 2 }], [symbol]: { next: 2 } };
  const result = merge(left, right);
  assert.deepEqual(result.ios.plist, { camera: 'allowed', location: 'allowed' });
  assert.deepEqual(result.list, [{ a: 1 }, { b: 2 }]);
  assert.deepEqual(result[symbol], { old: 1, next: 2 });
  result.list[0].a = 99;
  assert.equal(left.list[0].a, 1);
  assert.equal(merge({}, left, { clone: false }).ios, left.ios);
  assert.deepEqual(merge([1], [2], { arrayMerge: (_, source) => source }), [2]);
  assert.deepEqual(merge({ values: [1] }, { values: [2] }, { customMerge: key => key === 'values' ? (a, b) => [...b, ...a] : undefined }), { values: [2, 1] });
  assert.deepEqual(merge.all([{ a: 1 }, { b: 2 }]), { a: 1, b: 2 });
  assert.throws(() => merge.all({}), /array/);
  const date = new Date(0); const regexp = /test/;
  assert.equal(merge({}, { date, regexp }).date, date);
  assert.equal(merge({}, { date, regexp }).regexp, regexp);
});

const apps = process.env.PORPROV_EXPO_TEST_APP ? [process.env.PORPROV_EXPO_TEST_APP] : [
  'apps/mobile-public-react-native', 'apps/mobile-admin-react-native',
];
for (const app of apps) {
  assert.ok(['apps/mobile-public-react-native', 'apps/mobile-admin-react-native'].includes(app));
  test(`actual Expo consumer uses the patched implementation: ${app}`, async () => {
    const appRequire = createRequire(path.join(root, app, 'package.json'));
    const configFile = appRequire.resolve('@expo/config');
    const configRequire = createRequire(configFile);
    const resolved = configRequire.resolve('deepmerge');
    const actual = configRequire('deepmerge');
    const hash = value => createHash('sha256').update(value).digest('hex');
    assert.equal(hash(readFileSync(resolved)), hash(readFileSync(path.join(root, 'packages/deepmerge-safe/index.cjs'))));
    assert.equal(actual(Object.create(null), JSON.parse('{"__proto__":{"isAdmin":true}}')).isAdmin, undefined);

    // TEST: Invoke Expo's real config/plugin merge against an isolated disposable JSON fixture.
    const fixture = mkdtempSync(path.join(tmpdir(), 'porprov-expo-merge-'));
    const files = ['app.json', 'package.json'];
    try {
      writeFileSync(path.join(fixture, 'package.json'), JSON.stringify({ name: 'porprov-merge-fixture', version: '1.0.0' }));
      writeFileSync(path.join(fixture, 'app.json'), JSON.stringify({ expo: { name: 'Fixture', slug: 'fixture', plugins: [['test-plugin', { list: [1], nested: { old: true } }]], ios: { infoPlist: { camera: 'allowed' } } } }));
      const { modifyConfigAsync } = appRequire('@expo/config');
      const result = await modifyConfigAsync(fixture, { plugins: [['test-plugin', { list: [2], nested: { next: true } }]], ios: { infoPlist: { location: 'allowed' } } }, { skipSDKVersionRequirement: true, skipPlugins: true }, { dryRun: true });
      assert.equal(result.type, 'success');
      assert.deepEqual(result.config.ios.infoPlist, { camera: 'allowed', location: 'allowed' });
      assert.deepEqual(result.config.plugins, [['test-plugin', { list: [1, 2], nested: { old: true, next: true } }]]);
    } finally {
      // SAFETY: Remove only the two exact fixture files and the empty directory; no recursive deletion.
      const resolvedFixture = path.resolve(fixture);
      assert.equal(path.dirname(resolvedFixture), path.resolve(tmpdir()));
      assert.ok(path.basename(resolvedFixture).startsWith('porprov-expo-merge-'));
      for (const file of files) unlinkSync(path.join(resolvedFixture, file));
      rmdirSync(resolvedFixture);
    }
  });
}
