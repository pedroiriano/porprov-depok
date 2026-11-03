// INFO: Calendar-day eligibility uses WIB; the service independently enforces this using its own clock.
export function scoreEntryOpen(matchDate: string | undefined, now = new Date()): boolean {
  const date = new Date(matchDate || '');
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(now.getTime())) return false;
  const day = (value: Date) => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(value);
  return day(now) >= day(date);
}

export const canonicalMatchId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const matchResultsHref = (id: string) => canonicalMatchId(id) ? `/livescore?match=${encodeURIComponent(id)}` : null;
