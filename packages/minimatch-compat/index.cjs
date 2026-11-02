'use strict';
// SECURITY: Every match delegates to the official patched, nonrecursive engine.
const engine = require('@porprov/minimatch-engine');

function compatibility(defaults = {}) {
  const options = input => ({ ...defaults, ...input });
  const callable = (path, pattern, input) => engine.minimatch(path, pattern, options(input));
  class ConsumerMatcher extends engine.Minimatch {
    constructor(pattern, input) { super(pattern, options(input)); }
    // INFO: Installed lint consumers use makeRe only as a test predicate.
    // SECURITY: Do not reconstruct a vulnerable backtracking regular expression.
    makeRe() { return Object.freeze({ test: path => this.match(path) }); }
    static defaults(input) { return compatibility(options(input)).Minimatch; }
  }
  Object.assign(callable, engine, {
    minimatch: callable,
    Minimatch: ConsumerMatcher,
    defaults: input => compatibility(options(input)),
    filter: (pattern, input) => path => callable(path, pattern, input),
    match: (paths, pattern, input) => engine.match(paths, pattern, options(input)),
    braceExpand: (pattern, input) => engine.braceExpand(pattern, options(input)),
    makeRe: (pattern, input) => new ConsumerMatcher(pattern, input).makeRe(),
  });
  return callable;
}
module.exports = compatibility();
