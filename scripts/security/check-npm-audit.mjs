import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateAudit } from './npm-audit-policy.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..', '..');
const projectArgument = process.argv[2];
const levelArgument = process.argv[3] ?? '--audit-level=high';
if (!['--audit-level=high', '--audit-level=moderate'].includes(levelArgument) || process.argv.length > 4) {
  console.error('FAIL invalid audit threshold: use moderate or high');
  process.exit(2);
}

if (!projectArgument) {
  console.error('Usage: node scripts/security/check-npm-audit.mjs <project-directory>');
  process.exit(2);
}

const projectDirectory = isAbsolute(projectArgument)
  ? resolve(projectArgument)
  : resolve(repositoryRoot, projectArgument);
const projectPath = relative(repositoryRoot, projectDirectory).replaceAll('\\', '/');
const exceptionPath = resolve(scriptDirectory, 'npm-audit-exceptions.json');
const exceptionDocument = JSON.parse(readFileSync(exceptionPath, 'utf8'));
const exceptions = exceptionDocument.exceptions ?? [];
const npmCommand = process.platform === 'win32' ? process.env.ComSpec : 'npm';
const npmArguments = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'npm.cmd audit --json']
  : ['audit', '--json'];

const audit = spawnSync(npmCommand, npmArguments, {
  cwd: projectDirectory,
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
});

if (audit.error || !audit.stdout) {
  console.error(`FAIL npm audit ${projectPath}: ${audit.error?.message ?? audit.stderr ?? 'no JSON output'}`);
  process.exit(2);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  console.error(`FAIL npm audit ${projectPath}: invalid JSON output`);
  process.exit(2);
}

if (
  audit.status === null
  || audit.status > 1
  || report.error
  || report.auditReportVersion !== 2
  || !report.vulnerabilities
  || !report.metadata?.vulnerabilities
) {
  const auditError = report.error?.summary || report.error?.code || audit.stderr || 'incomplete audit report';
  console.error(`FAIL npm audit ${projectPath}: ${String(auditError).trim()}`);
  process.exit(2);
}

const { unapproved, approvedIds, approvedExpiryDates } = evaluateAudit(report, {
  project: projectPath,
  exceptions,
  minimumSeverity: levelArgument.split('=')[1],
});

if (unapproved.length > 0) {
  console.error(`FAIL npm audit ${projectPath}: ${[...new Set(unapproved)].join('; ')}`);
  process.exit(1);
}

const summary = report.metadata?.vulnerabilities ?? {};
const latestApprovedExpiry = [...approvedExpiryDates].sort().at(-1);
const exceptionSummary = approvedIds.size > 0
  ? `; temporary exceptions=${[...approvedIds].sort().join(',')} until ${latestApprovedExpiry}`
  : '';
console.log(
  `PASS npm audit ${projectPath}: critical=${summary.critical ?? 0}, high=${summary.high ?? 0}, moderate=${summary.moderate ?? 0}${exceptionSummary}`,
);
