import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const allowed = ['apps/mobile-public-react-native', 'apps/mobile-admin-react-native'];
const selection = process.env.PORPROV_EXPO_TEST_APP;
if (selection && !allowed.includes(selection)) throw new Error('Unsupported Expo test project');

// TEST: Exercise actual Expo CLI consumers before accepting the narrowly scoped Zod security override.
for (const app of selection ? [selection] : allowed) {
  const appRequire = createRequire(resolve(root, app, 'package.json'));
  const expoRequire = createRequire(appRequire.resolve('expo/package.json'));
  const cliPackage = expoRequire.resolve('@expo/cli/package.json');
  const cliRoot = dirname(cliPackage);
  const cliRequire = createRequire(cliPackage);
  const { z } = cliRequire('zod');
  const version = cliRequire('zod/package.json').version;
  const { PluginSchema, DevToolsPluginOutputSchema } = cliRequire(resolve(cliRoot, 'build/src/start/server/DevToolsPlugin.schema.js'));
  const { createMCPDevToolsExtensionSchema } = cliRequire(resolve(cliRoot, 'build/src/start/server/createMCPDevToolsExtensionSchema.js'));
  const plugin = { packageName: 'porprov-fixture', packageRoot: '/fixture', cliExtensions: { description: 'Local compatibility fixture', entryPoint: './fixture.js', commands: [{ name: 'inspect', title: 'Inspect', environments: ['cli', 'mcp'], parameters: [{ name: 'count', type: 'number' }, { name: 'enabled', type: 'confirm' }, { name: 'query', type: 'text' }] }] } };

  test(`${app}: CLI resolves patched Zod and validates plugins`, () => {
    assert.equal(version, '4.6.6');
    assert.equal(PluginSchema.safeParse(plugin).success, true);
    assert.equal(PluginSchema.safeParse({ ...plugin, packageName: '' }).success, false);
    assert.equal(PluginSchema.safeParse({ ...plugin, cliExtensions: { ...plugin.cliExtensions, commands: [] } }).success, false);
  });

  test(`${app}: CLI output unions remain validated`, () => {
    assert.equal(DevToolsPluginOutputSchema.safeParse([{ type: 'text', text: 'ready', level: 'info' }, { type: 'image', url: 'https://example.invalid/fixture.png' }]).success, true);
    assert.equal(DevToolsPluginOutputSchema.safeParse([{ type: 'text', text: 'invalid', level: 'unknown' }]).success, false);
    assert.equal(DevToolsPluginOutputSchema.safeParse([{ type: 'audio', url: 'invalid URL' }]).success, false);
  });

  test(`${app}: MCP command validation remains strict and JSON-schema compatible`, () => {
    const schema = createMCPDevToolsExtensionSchema(plugin);
    assert.equal(schema.safeParse({ command: 'inspect', count: 2, enabled: true, query: 'fixture' }).success, true);
    for (const invalid of [{ command: 'unknown' }, { command: 'inspect', count: '2' }, { command: 'inspect', unexpected: true }]) assert.equal(schema.safeParse(invalid).success, false);
    const json = z.toJSONSchema(schema);
    assert.equal(json.type, 'object');
    assert.equal(json.additionalProperties, false);
    assert.ok((json.properties.command.enum ?? [json.properties.command.const]).includes('inspect'));
    assert.equal(json.properties.count.type, 'number');
  });
}
