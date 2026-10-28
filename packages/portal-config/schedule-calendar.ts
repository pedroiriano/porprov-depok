import type { SchedulePeriod } from './schedule-period';

export const calendarWeekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
export function jakartaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function calendarMonth(value: string): string {
  if (!/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(value)) throw new Error('Bulan tidak valid');
  return value;
}
export function shiftCalendarMonth(value: string, change: number): string {
  calendarMonth(value);
  const date = new Date(`${value}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + change);
  return calendarMonth(date.toISOString().slice(0, 7));
}
export function monthDays(value: string): string[] {
  calendarMonth(value);
  const date = new Date(`${value}-01T12:00:00Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(date); day.setUTCDate(date.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}
export function scheduleGroupKey(item: SchedulePeriod): string {
  // INFO: Parent identity and an explicit special name form a separate sub-cabor, without conflating two sports with the same name.
  return JSON.stringify([item.cabor_id, item.label.trim().normalize('NFC').toLocaleLowerCase('id-ID')]);
}
export function groupSchedulePeriods(items: SchedulePeriod[]) {
  const groups = new Map<string, {key: string; cabor: string; label: string; items: SchedulePeriod[]}>();
  for (const item of items) {
    const key = scheduleGroupKey(item);
    const group = groups.get(key) || {key, cabor: item.cabor_name, label: item.label.trim(), items: []};
    group.items.push(item); groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => a.cabor.localeCompare(b.cabor, 'id') || a.label.localeCompare(b.label, 'id'));
}
export function scheduleColor(item: SchedulePeriod): number {
  let hash = 0;
  for (const character of scheduleGroupKey(item)) hash = (Math.imul(hash, 31) + character.codePointAt(0)!) >>> 0;
  return hash % 6;
}
export function periodsOnDay(items: SchedulePeriod[], day: string): SchedulePeriod[] {
  return items.filter(item => item.starts_on <= day && item.ends_on >= day);
}
