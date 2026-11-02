# Private lint consumer compatibility adapter

This application-internal adapter delegates matching to the official minimatch 11.0.4 dependency (BlueOak-1.0.0). That registry package is installed under its real name and version; no file alias replaces minimatch and no scanner exception is used. The separate private adapter is @porprov/minimatch-compat 1.0.0 (MIT).

Node 24 synchronous module hooks redirect only bare minimatch imports from the installed legacy ESLint/config-array/eslintrc/import/react/jsx-a11y consumers. The lint subprocess receives this preload; application runtime, Next build and Expo export do not. Modern consumers including glob retain the official namespace API.

Supported legacy contract: callable CommonJS/default import, Minimatch/match/defaults/filter/braceExpand and makeRe(...).test(...). The latter is a nonrecursive matcher predicate, intentionally not a serialized RegExp. Regex source/flags/exec/serialization are unsupported and are not used by these installed consumers. This is not a general replacement for the public minimatch 3 API.

Actual consumer-rule regression, lint, build/export, npm audit and required CI must pass. Provenance hashes bind the adapter/hook source. Build-only proof checks actual standalone/source-map artifacts. Future consumer changes require revalidation. No legacy matcher implementation is copied, renamed or assigned a patched version.
