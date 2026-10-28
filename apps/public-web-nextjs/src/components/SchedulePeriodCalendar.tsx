'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { calendarWeekdays, groupSchedulePeriods, monthDays, periodsOnDay, scheduleColor } from '../../../../packages/portal-config/schedule-calendar';
import { formatSchedulePeriod, type SchedulePeriod } from '../../../../packages/portal-config/schedule-period';

const colors = [
  'border-blue-300 bg-blue-100 text-blue-950 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100',
  'border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100',
  'border-violet-300 bg-violet-100 text-violet-950 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-100',
  'border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100',
  'border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-100',
  'border-cyan-300 bg-cyan-100 text-cyan-950 dark:border-cyan-700 dark:bg-cyan-950 dark:text-cyan-100',
];
export const periodColorClass = (item: SchedulePeriod) => colors[scheduleColor(item)];
const groupLabel = (item: SchedulePeriod) => item.label.trim() ? `${item.cabor_name} · ${item.label.trim()}` : item.cabor_name;

export function SchedulePeriodCalendar({ month, items, dayCounts, today, onShowDay }: { month: string; items: SchedulePeriod[]; dayCounts: Record<string, number>; today: string; onShowDay: (day: string) => void }) {
  const [selected, setSelected] = useState<SchedulePeriod | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const days = monthDays(month);
  const groups = groupSchedulePeriods(items);
  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(`${month}-01T12:00:00Z`));
  useEffect(() => {
    const node = dialog.current;
    if (!selected || !node) return;
    const alreadyLocked = document.body.classList.contains('overflow-hidden');
    // ACCESSIBILITY: Native modal focus/inert behavior plus a CSP-safe class keeps the page behind it from scrolling.
    document.body.classList.add('overflow-hidden');
    if (!node.open) node.showModal();
    return () => {
      if (node.open) node.close();
      if (!alreadyLocked) document.body.classList.remove('overflow-hidden');
    };
  }, [selected]);
  return <div className="mt-6">
    <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Angka pada tanggal menghitung seluruh rentang yang sesuai. Warna dan nama menunjukkan Cabor atau sub-Cabor. Pilih rentang untuk detail; pilih jumlah rentang untuk daftar lengkap pada tanggal tersebut.</p>
    <div className="overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700">
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">Kalender rentang pelaksanaan {monthLabel}</caption>
        <thead className="bg-slate-100 text-center dark:bg-slate-800"><tr>{calendarWeekdays.map(day => <th key={day} scope="col" className="py-3 text-xs font-black sm:text-sm">{day}</th>)}</tr></thead>
        <tbody>{Array.from({ length: 6 }, (_, week) => <tr key={week}>{days.slice(week * 7, week * 7 + 7).map(day => {
          const inMonth = day.startsWith(month);
          const entries = inMonth ? periodsOnDay(items, day) : [];
          const total = inMonth ? dayCounts[day] || 0 : 0;
          return <td key={day} className={`h-28 border border-slate-200 p-0.5 align-top sm:p-1.5 dark:border-slate-700 ${inMonth ? 'bg-white dark:bg-slate-900' : 'bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-400'}`}>
            <time dateTime={day} aria-current={day === today ? 'date' : undefined} className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${day === today ? 'bg-blue-700 text-white' : ''}`}>{Number(day.slice(-2))}</time>
            <div className="space-y-1">{entries.slice(0, 2).map(item => <button key={item.id} type="button" onClick={() => setSelected(item)} title={`${groupLabel(item)} — ${formatSchedulePeriod(item.starts_on, item.ends_on)}${item.notes ? ` — ${item.notes.slice(0, 240)}` : ''}`} aria-label={`${groupLabel(item)}, tanggal ${formatSchedulePeriod(day, day)}, rentang ${formatSchedulePeriod(item.starts_on, item.ends_on)}. Buka detail.`} className={`block min-h-11 w-full overflow-hidden rounded-lg border px-1 py-1 text-left text-[10px] font-bold leading-tight hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 sm:px-2 sm:text-xs ${periodColorClass(item)}`}><span className="line-clamp-2 break-words">{item.label.trim() || item.cabor_name}</span><span className="sr-only"> · {item.cabor_name}</span></button>)}
              {total > 0 && <button type="button" onClick={() => onShowDay(day)} aria-label={`Lihat semua ${total} rentang pada ${formatSchedulePeriod(day, day)}`} className="min-h-11 w-full rounded-lg px-0.5 text-[10px] font-black text-blue-800 hover:bg-blue-50 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 sm:text-xs dark:text-sky-200 dark:hover:bg-slate-800">{total} rentang{total > entries.length && <span className="sr-only">, termasuk rentang di halaman lain</span>}</button>}
            </div>
          </td>;
        })}</tr>)}</tbody>
      </table>
    </div>
    {!!groups.length && <div className="mt-5"><h3 className="text-sm font-black">Kelompok pada halaman ini</h3><ul className="mt-3 flex flex-wrap gap-2">{groups.map(group => <li key={group.key} className={`rounded-lg border px-3 py-2 text-xs font-bold ${periodColorClass(group.items[0])}`}>{group.cabor}{group.label ? ` · ${group.label}` : ''}</li>)}</ul></div>}
    <dialog ref={dialog} aria-labelledby={titleId} onClose={() => setSelected(null)} onClick={event => {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) event.currentTarget.close();
    }} className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-300 bg-white p-6 text-slate-950 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
      <div className="flex items-start justify-between gap-3"><h3 id={titleId} className="text-xl font-black">Detail rentang pelaksanaan</h3><button type="button" onClick={() => dialog.current?.close()} aria-label="Tutup detail rentang" className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-300 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:hover:bg-slate-800"><X className="size-5" aria-hidden="true" /></button></div>
      {selected && <dl className="mt-5 space-y-4"><div><dt className="text-sm text-slate-600 dark:text-slate-300">Cabang olahraga</dt><dd className="mt-1 break-words font-black">{selected.cabor_name}</dd></div>{selected.label.trim() && <div><dt className="text-sm text-slate-600 dark:text-slate-300">Sub-Cabor / Nama Khusus</dt><dd className="mt-1 break-words font-bold">{selected.label}</dd></div>}<div><dt className="text-sm text-slate-600 dark:text-slate-300">Pelaksanaan</dt><dd className="mt-1 font-bold">{formatSchedulePeriod(selected.starts_on, selected.ends_on)}</dd></div><div><dt className="text-sm text-slate-600 dark:text-slate-300">Status</dt><dd className="mt-1 font-bold">{today < selected.starts_on ? 'Akan dimulai' : today > selected.ends_on ? 'Selesai' : 'Berlangsung'}</dd></div>{selected.notes && <div><dt className="text-sm text-slate-600 dark:text-slate-300">Keterangan</dt><dd className="mt-1 whitespace-pre-line break-words">{selected.notes}</dd></div>}</dl>}
    </dialog>
  </div>;
}
