// SECURITY: Evaluate each advisory independently; never ignore a whole package/tree.
export function evaluateAudit(report, { project, exceptions = [], minimumSeverity = 'high', now = new Date() }) {
  const rank = { low: 1, moderate: 2, high: 3, critical: 4 };
  const unapproved = [];
  const approvedIds = new Set();
  const approvedExpiryDates = new Set();
  if (!['moderate', 'high'].includes(minimumSeverity) || Number.isNaN(now.getTime())
      || report.auditReportVersion !== 2 || report.error
      || !report.vulnerabilities || !report.metadata?.vulnerabilities) {
    return { unapproved: ['invalid audit report or policy'], approvedIds, approvedExpiryDates };
  }
  const vulnerabilities = report.vulnerabilities;
  const blocking = (severity) => !(severity in rank) || rank[severity] >= rank[minimumSeverity];
  function collect(name, visited = new Set()) {
    if (visited.has(name)) return [];
    visited.add(name);
    if (!vulnerabilities[name]) return [{ id: null, package: name, severity: 'unknown' }];
    const result = [];
    for (const via of vulnerabilities[name]?.via ?? []) {
      if (typeof via === 'string') result.push(...collect(via, visited));
      else if (via && blocking(via.severity)) result.push({
        id: via.url?.match(/GHSA-[\w-]+$/)?.[0] ?? null,
        package: via.name ?? name,
        severity: via.severity,
      });
    }
    return result;
  }
  for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
    if (!blocking(vulnerability.severity)) continue;
    const findings = collect(name);
    if (!findings.length) unapproved.push(`${name}: blocking advisory could not be resolved`);
    for (const finding of findings) {
      const exception = exceptions.find((candidate) => candidate.id === finding.id
        && candidate.package === finding.package && candidate.severity === finding.severity
        && candidate.projects?.includes(project));
      const expiry = exception && new Date(exception.expiresAt ?? `${exception.expiresOn}T23:59:59.999Z`);
      if (!exception) unapproved.push(`${finding.id ?? 'UNKNOWN'} ${finding.package} ${finding.severity}`);
      else if (Number.isNaN(expiry.getTime()) || now > expiry) {
        unapproved.push(`${finding.id} ${finding.package}: exception expired ${exception.expiresOn}`);
      } else {
        approvedIds.add(finding.id);
        approvedExpiryDates.add(exception.expiresOn);
      }
    }
  }
  return { unapproved, approvedIds, approvedExpiryDates };
}
