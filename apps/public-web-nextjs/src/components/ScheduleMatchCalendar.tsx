'use client';

import {useEffect,useId,useRef,useState} from 'react';
import {X} from 'lucide-react';
import type {EnrichedMatch} from '@/lib/public-models';
import {ScheduleMatchCard} from './ScheduleMatchCard';
import {scheduleCalendarColors} from './SchedulePeriodCalendar';
import {calendarWeekdays,monthDays,matchColor,matchDay} from '../../../../packages/portal-config/schedule-calendar';

export function ScheduleMatchCalendar({month,items,dayCounts,today,onShowDay}:{month:string;items:EnrichedMatch[];dayCounts:Record<string,number>;today:string;onShowDay:(day:string)=>void}) {
  const [selected,setSelected]=useState<EnrichedMatch|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const titleId=useId();
  const days=monthDays(month);
  const monthLabel=new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric',timeZone:'Asia/Jakarta'}).format(new Date(`${month}-01T12:00:00Z`));
  useEffect(()=>{
    const node=dialog.current;
    if(!selected||!node)return;
    // ACCESSIBILITY: Native dialog provides inert background, focus containment and Escape; class locking preserves CSP.
    const locked=document.body.classList.contains('overflow-hidden');
    document.body.classList.add('overflow-hidden');
    node.showModal();
    return()=>{if(node.open)node.close();if(!locked)document.body.classList.remove('overflow-hidden');};
  },[selected]);
  const groups=[...new Map(items.map(item=>[item.caborId,item.caborName])).entries()];
  return <div className="mt-6">
    <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Waktu Indonesia Barat (WIB). Arahkan penunjuk atau pilih pertandingan untuk detail. Jumlah pada tanggal mencakup seluruh hasil, termasuk halaman lain.</p>
    <div className="overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700"><table className="w-full table-fixed border-collapse text-left">
      <caption className="sr-only">Kalender rincian pertandingan {monthLabel}</caption>
      <thead className="bg-slate-100 text-center dark:bg-slate-800"><tr>{calendarWeekdays.map(day=><th key={day} scope="col" className="py-3 text-xs font-black sm:text-sm">{day}</th>)}</tr></thead>
      <tbody>{Array.from({length:6},(_,week)=><tr key={week}>{days.slice(week*7,week*7+7).map(day=>{
        const inMonth=day.startsWith(month);
        const entries=inMonth?items.filter(item=>matchDay(item.matchDate)===day):[];
        const total=inMonth?dayCounts[day]||0:0;
        return <td key={day} className={`h-28 border border-slate-200 p-0.5 align-top sm:p-1.5 dark:border-slate-700 ${inMonth?'bg-white dark:bg-slate-900':'bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-400'}`}>
          <time dateTime={day} aria-current={day===today?'date':undefined} className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${day===today?'bg-blue-700 text-white':''}`}>{Number(day.slice(-2))}</time>
          <div className="space-y-1">{entries.slice(0,2).map(item=>{
            const time=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date(item.matchDate));
            const label=`${time} WIB · ${item.caborName} · ${item.nomorTandingName} · ${item.round} · ${item.venueName}`;
            return <button key={item.id} type="button" title={label} aria-label={`${label}. Buka detail pertandingan.`} onClick={()=>setSelected(item)} className={`block min-h-11 w-full overflow-hidden rounded-lg border px-1 py-1 text-left text-[10px] font-bold leading-tight hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 sm:px-2 sm:text-xs ${scheduleCalendarColors[matchColor(item.caborId)]}`}><span className="block">{time}</span><span className="line-clamp-2 break-words">{item.caborName}</span><span className="hidden truncate sm:block">{item.nomorTandingName}</span></button>;
          })}{total>0&&<button type="button" onClick={()=>onShowDay(day)} aria-label={`Lihat semua ${total} pertandingan pada ${day}`} className="min-h-11 w-full rounded-lg px-0.5 text-[10px] font-black text-blue-800 hover:bg-blue-50 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 sm:text-xs dark:text-sky-200 dark:hover:bg-slate-800">{total} laga</button>}</div>
        </td>;
      })}</tr>)}</tbody>
    </table></div>
    {!!groups.length&&<ul aria-label="Cabang olahraga pada halaman ini" className="mt-4 flex flex-wrap gap-2">{groups.map(([id,name])=><li key={id} className={`rounded-lg border px-3 py-2 text-xs font-bold ${scheduleCalendarColors[matchColor(id)]}`}>{name}</li>)}</ul>}
    <dialog ref={dialog} aria-labelledby={titleId} onClose={()=>setSelected(null)} onClick={event=>{
      const bounds=event.currentTarget.getBoundingClientRect();
      if(event.target===event.currentTarget&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom))event.currentTarget.close();
    }} className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-slate-300 bg-white p-5 text-slate-950 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
      <div className="mb-5 flex items-center justify-between gap-3"><h3 id={titleId} className="text-xl font-black">Detail pertandingan</h3><button type="button" onClick={()=>dialog.current?.close()} aria-label="Tutup detail pertandingan" className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-600"><X className="size-5" aria-hidden="true"/></button></div>
      {selected&&<ScheduleMatchCard match={selected} compact/>}
    </dialog>
  </div>;
}
