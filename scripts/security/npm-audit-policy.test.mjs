import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { evaluateAudit } from './npm-audit-policy.mjs';

const exceptions = JSON.parse(readFileSync(new URL('./npm-audit-exceptions.json', import.meta.url))).exceptions;
const id = 'GHSA-vfj7-8cjw-p6xm';
const advisory = (name = 'braces', severity = 'high', identifier = id) => ({
  name, severity, url: `https://github.com/advisories/${identifier}`,
});
const report = (findings = [advisory()]) => ({
  auditReportVersion: 2, metadata: { vulnerabilities: {} },
  vulnerabilities: { braces: { severity: 'high', via: findings } },
});
const options = { project: 'apps/public-web-nextjs', exceptions,
  minimumSeverity: 'moderate', now: new Date('2026-10-04T00:00:00Z') };
const evaluate = (input = report(), extra = {}) => evaluateAudit(input, { ...options, ...extra });

// TEST: Authorized scope only; underlying counts are not hidden or rewritten.
for (const project of ['apps/public-web-nextjs', 'apps/mobile-public-react-native', 'apps/mobile-admin-react-native']) {
  test(`exact approved advisory passes for ${project}`, () => {
    const result = evaluate(report(), { project });
    assert.equal(result.unapproved.length, 0);
    assert.deepEqual([...result.approvedIds], [id]);
  });
}
test('Admin Web is not covered', () => assert.equal(evaluate(report(), { project: 'apps/admin-web-react' }).unapproved.length, 1));
test('Jakarta expiry passes at boundary and fails immediately afterward', () => {
  assert.equal(evaluate(report(), { now: new Date('2026-10-07T16:59:59.999Z') }).unapproved.length, 0);
  assert.equal(evaluate(report(), { now: new Date('2026-10-07T17:00:00Z') }).unapproved.length, 1);
});
test('other advisory on the same package remains blocked', () => assert.equal(evaluate(report([advisory(), advisory('braces', 'high', 'GHSA-aaaa-bbbb-cccc')])).unapproved.length, 1));
test('wrong package and escalated severity remain blocked', () => {
  assert.equal(evaluate(report([advisory('other')])).unapproved.length, 1);
  assert.equal(evaluate(report([advisory('braces', 'critical')])).unapproved.length, 1);
});
test('Web Moderate threshold is preserved; mobile High threshold is preserved', () => {
  const input = report([advisory(), advisory('other', 'moderate', 'GHSA-aaaa-bbbb-cccc')]);
  assert.equal(evaluate(input).unapproved.length, 1);
  assert.equal(evaluate(input, { minimumSeverity: 'high' }).unapproved.length, 0);
});
test('transitive advisory resolution is exact and unresolved cycles fail closed', () => {
  const input = report();
  input.vulnerabilities.micromatch = { severity: 'high', via: ['braces'] };
  assert.equal(evaluate(input).unapproved.length, 0);
  input.vulnerabilities.braces.via = ['micromatch'];
  assert.equal(evaluate(input).unapproved.length, 2);
});
test('missing transitive evidence cannot hide behind an approved advisory', () => {
  const input = report();
  input.vulnerabilities.braces.via.push('missing');
  assert.equal(evaluate(input).unapproved.length, 1);
});
test('invalid reports, severity, date and threshold fail closed', () => {
  for (const input of [{}, { ...report(), error: {} }, report([advisory('braces', 'unknown')])]) {
    assert.ok(evaluate(input).unapproved.length);
  }
  assert.ok(evaluate(report(), { now: new Date('invalid') }).unapproved.length);
  assert.ok(evaluate(report(), { minimumSeverity: 'critical' }).unapproved.length);
});
