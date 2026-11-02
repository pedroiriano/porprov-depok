'use strict';
const { registerHooks } = require('node:module');
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');

// SECURITY: Scope the adapter to installed legacy lint consumers, never application modules.
const legacyConsumer = /\/node_modules\/(?:@eslint\/(?:config-array|eslintrc)|eslint|eslint-plugin-(?:import|react|jsx-a11y))\//;
const adapter = pathToFileURL(join(__dirname, 'index.cjs')).href;
module.exports = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'minimatch' && legacyConsumer.test(context.parentURL || '')) {
      return { url: adapter, format: 'commonjs', shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
