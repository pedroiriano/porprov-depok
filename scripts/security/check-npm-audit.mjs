import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..', '..');
const projectArgument = process.argv[2];

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

const vulnerabilities = report.vulnerabilities ?? {};
const severityRank = { low: 1, moderate: 2, high: 3, critical: 4 };
const isBlockingSeverity = (severity) => (severityRank[severity] ?? 0) >= severityRank.high;
const advisoryId = (finding) => finding.url?.match(/GHSA-[\w-]+$/)?.[0] ?? null;

function collectBlockingAdvisories(packageName, visited = new Set()) {
  if (visited.has(packageName)) {
    return [];
  }

  visited.add(packageName);
  const vulnerability = vulnerabilities[packageName];
  if (!vulnerability) {
    return [];
  }

  const findings = [];
  for (const via of vulnerability.via ?? []) {
    if (typeof via === 'string') {
      findings.push(...collectBlockingAdvisories(via, visited));
      continue;
    }

    if (isBlockingSeverity(via.severity)) {
      findings.push({
        id: advisoryId(via),
        package: via.name ?? packageName,
        severity: via.severity,
      });
    }
  }

  return findings;
}

const blockingPackages = Object.entries(vulnerabilities)
  .filter(([, vulnerability]) => isBlockingSeverity(vulnerability.severity));
const unapproved = [];
const approvedIds = new Set();
const now = new Date();

for (const [packageName] of blockingPackages) {
  const findings = collectBlockingAdvisories(packageName);
  if (findings.length === 0) {
    unapproved.push(`${packageName}: blocking advisory could not be resolved`);
    continue;
  }

  for (const finding of findings) {
    const exception = exceptions.find((candidate) =>
      candidate.id === finding.id
      && candidate.package === finding.package
      && candidate.severity === finding.severity
      && candidate.projects?.includes(projectPath));

    if (!exception) {
      unapproved.push(`${finding.id ?? 'UNKNOWN'} ${finding.package} ${finding.severity}`);
      continue;
    }

    const expiresAt = new Date(`${exception.expiresOn}T23:59:59.999Z`);
    if (Number.isNaN(expiresAt.getTime()) || now > expiresAt) {
      unapproved.push(`${finding.id} ${finding.package}: exception expired ${exception.expiresOn}`);
      continue;
    }

    approvedIds.add(finding.id);
  }
}

if (unapproved.length > 0) {
  console.error(`FAIL npm audit ${projectPath}: ${[...new Set(unapproved)].join('; ')}`);
  process.exit(1);
}

const summary = report.metadata?.vulnerabilities ?? {};
const exceptionSummary = approvedIds.size > 0
  ? `; temporary exceptions=${[...approvedIds].sort().join(',')} until 2026-10-07`
  : '';
console.log(
  `PASS npm audit ${projectPath}: critical=${summary.critical ?? 0}, high=${summary.high ?? 0}, moderate=${summary.moderate ?? 0}${exceptionSummary}`,
);
