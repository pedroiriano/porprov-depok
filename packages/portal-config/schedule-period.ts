export type SchedulePeriod = {
  id: string; cabor_id: string; cabor_name: string; label: string;
  starts_on: string; ends_on: string; notes: string;
};
export type ManagedSchedulePeriod = SchedulePeriod & {is_published: boolean; version: number; archived: boolean};
export type PeriodPage<T = SchedulePeriod> = {data: T[]; total: number; page: number; per_page: number};

// INFO: Dates represent whole inclusive days in Indonesia, independent of the browser timezone.
export function formatSchedulePeriod(start: string, end: string): string {
  const first = new Date(`${start}T12:00:00Z`); const last = new Date(`${end}T12:00:00Z`);
  if (!Number.isFinite(first.getTime()) || !Number.isFinite(last.getTime())) return 'Tanggal belum tersedia';
  const format = (date: Date, year: boolean) => new Intl.DateTimeFormat('id-ID', {day: 'numeric', month: 'long', ...(year ? {year: 'numeric' as const} : {}), timeZone: 'Asia/Jakarta'}).format(date);
  if (start === end) return format(first, true);
  return `${format(first, first.getUTCFullYear() !== last.getUTCFullYear())} s.d. ${format(last, true)}`;
}
