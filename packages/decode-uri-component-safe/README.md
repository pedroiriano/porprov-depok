# Patched URI decoder - private compatibility adaptation

Upstream 0.5.1 fixes GHSA-qr28-fpjm-wq7f with a single-pass replacement of malformed percent runs. query-string 7 expects a CommonJS callable rather than an ESM namespace. This private package preserves the upstream implementation and MIT license. Its mechanical adaptation adds strict mode, converts the default export to module.exports, and renames the local token identifier to percentBytePattern. No algorithm is changed. It has no dependency, install hook, network access or filesystem access at runtime.

provenance.json records the verified registry tarball integrity and original/adapted source SHA256. CI reconstructs the upstream source and checks its hash, exercises the real query-string consumer, and runs the advisory pattern inside a bounded worker. This is patched code, not an audit exception or a renamed vulnerable implementation.
