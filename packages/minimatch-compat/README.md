# Private lint consumer compatibility adapter

This application-internal adapter delegates all pattern matching to the official minimatch 11.0.4 dependency (BlueOak-1.0.0), pinned through an npm alias with registry integrity in each lockfile. It contains no vendored minimatch 3 or 10 algorithm and no audit exception.

Scope: installed ESLint/config-array/eslintrc, eslint-plugin-import/react/jsx-a11y consumers. Supports their callable CommonJS import, Minimatch construction/match, defaults/filter/match/braceExpand and makeRe(...).test(...). The latter is a nonrecursive matcher predicate, intentionally **not** a serialized RegExp; regex source/flags/exec or regex serialization are not supported and are not used by the installed consumers. This is not a general replacement for the public minimatch 3 API.

Consumer-rule regression, lint, build/export, npm audit and final CI must pass. A dependency update introducing additional API usage must extend the adapter and regression evidence before release. The adapter remains build/lint-only and must be absent from actual exported application runtime.
