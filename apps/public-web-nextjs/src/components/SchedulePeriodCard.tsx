import {CalendarDays} from 'lucide-react';
import {formatSchedulePeriod,type SchedulePeriod} from '../../../../packages/portal-config/schedule-period';
import {periodColorClass} from './SchedulePeriodCalendar';

export function SchedulePeriodCard({item,today}:{item:SchedulePeriod;today:string}) {
  const days=Math.round((Date.parse(`${item.ends_on}T00:00:00Z`)-Date.parse(`${item.starts_on}T00:00:00Z`))/86400000)+1;
  return <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${periodColorClass(item)}`}><CalendarDays className="size-5 shrink-0" aria-hidden="true"/><span className="text-xs font-black">{today<item.starts_on?'Akan dimulai':today>item.ends_on?'Selesai':'Berlangsung'}</span></div>
    <div className="flex flex-1 flex-col p-5"><p className="break-words text-sm font-bold text-slate-600 dark:text-slate-300">{item.cabor_name}</p><h4 className="mt-1 break-words text-lg font-black">{item.label||'Pelaksanaan Cabor'}</h4><p className="mt-4 text-base font-bold leading-relaxed">{formatSchedulePeriod(item.starts_on,item.ends_on)}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{days} hari pelaksanaan</p>{item.notes&&<p className="mt-4 whitespace-pre-line break-words border-t border-slate-200 pt-4 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:text-slate-300">{item.notes}</p>}</div>
  </article>;
}
