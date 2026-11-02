import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = process.cwd();
const { name } = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'));
const allowed = ['public-web-nextjs', 'mobile-public-react-native', 'mobile-admin-react-native'];
if (!allowed.includes(name)) throw new Error('Unsupported lint project');
const mobile = name.startsWith('mobile-');
const binary = resolve(directory, 'node_modules', mobile ? 'expo/bin/cli' : 'eslint/bin/eslint.js');
if (!existsSync(binary)) throw new Error('Install the locked lint dependencies first');
// SECURITY: Only this lint subprocess and its children receive the compatibility preload.
// The registry minimatch package retains its real patched identity/version and is never modified.
const result = spawnSync(process.execPath, [binary, ...(mobile ? ['lint'] : []), ...process.argv.slice(2)], {
  cwd: directory, stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require=@porprov/minimatch-compat/register.cjs`.trim() },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
