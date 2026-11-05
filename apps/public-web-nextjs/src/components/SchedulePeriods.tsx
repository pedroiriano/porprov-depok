'use client';
import {useEffect, useState} from 'react';
import {CalendarDays, CalendarRange, ChevronLeft, ChevronRight, List, RefreshCw} from 'lucide-react';
import {publicApiUrl} from '@/lib/public-api';
import {type PeriodPage,type SchedulePeriod} from '../../../../packages/portal-config/schedule-period';
import {groupSchedulePeriods, jakartaDate, shiftCalendarMonth} from '../../../../packages/portal-config/schedule-calendar';
import {SchedulePeriodCalendar} from './SchedulePeriodCalendar';

import {SchedulePeriodCard} from './SchedulePeriodCard';
import {SchedulePeriodDetails} from './ScheduleDetails';
import {ScheduleDayStrip} from './ScheduleDayStrip';
import presentation from './SchedulePresentation.module.css';

export function SchedulePeriods() {
  const today=jakartaDate();
  const [selected,setSelected]=useState<SchedulePeriod|null>(null);
  const [query,setQuery]=useState(''); const [date,setDate]=useState(''); const [page,setPage]=useState(1);
  const [view,setView]=useState<'cards'|'calendar'>('calendar'); const [month,setMonth]=useState(today.slice(0,7)); const [refresh,setRefresh]=useState(0);
  const perPage=view==='calendar'?24:12;
  const requestKey=JSON.stringify([query,date,page,view,month,refresh]);
  const [settled,setSettled]=useState<{key:string;data:PeriodPage|null;error:boolean}>({key:'',data:null,error:false});
  const loading=settled.key!==requestKey; const data=loading?null:settled.data; const error=!loading&&settled.error;
  useEffect(()=>{
    const controller=new AbortController();
    // PERFORMANCE: Monthly overlap, complete day counts and pagination stay server-side; only this bounded page contains detail records.
    const timer=window.setTimeout(async()=>{
      try{
        const params=new URLSearchParams({page:String(page),per_page:String(perPage),q:query});
        if(view==='calendar')params.set('month',month);else if(date)params.set('date',date);
        const response=await fetch(publicApiUrl(`/schedule/periods?${params}`),{cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
        if(!response.ok)throw new Error('Jadwal belum tersedia');
        const next=await response.json() as PeriodPage;
        if(!Array.isArray(next.data)||!Number.isFinite(next.total)||(view==='calendar'&&(!next.calendar||next.calendar.month!==month)))throw new Error('Jadwal belum tersedia');
        if(!controller.signal.aborted)setSettled({key:requestKey,data:next,error:false});
      }catch{if(!controller.signal.aborted)setSettled({key:requestKey,data:null,error:true});}
    },250);
    return()=>{window.clearTimeout(timer);controller.abort();};
  },[requestKey,query,date,page,view,month,perPage]);
  const field='min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  const button='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-40 dark:border-slate-600';
  const groups=groupSchedulePeriods(data?.data||[]);
  const showDay=(day:string)=>{setDate(day);if(day)setMonth(day.slice(0,7));setPage(1);};
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 md:p-8" aria-labelledby="schedule-periods-title">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-widest text-primary-600 dark:text-sky-300">Agenda Cabang Olahraga</p><h2 id="schedule-periods-title" className="mt-2 text-2xl font-black md:text-3xl">Rentang pelaksanaan</h2><p className="mt-3 text-slate-600 dark:text-slate-300">Lihat tanggal pelaksanaan Cabor. Klik jadwal untuk detail.</p></div><button type="button" disabled={loading} onClick={()=>setRefresh(value=>value+1)} className={button}><RefreshCw className={`size-4 ${loading?'animate-spin':''}`} aria-hidden="true"/>Perbarui rentang</button></div>
    <div role="group" aria-label="Pilihan tampilan rentang pelaksanaan" className="mt-6 flex flex-wrap gap-2">{([['calendar','Kalender',CalendarDays],['cards','Daftar Kartu',List]] as const).map(([id,label,Icon])=><button key={id} type="button" aria-pressed={view===id} onClick={()=>{setView(id);setPage(1);if(id==='calendar'&&date)setMonth(date.slice(0,7));}} className={`${button} ${view===id?'border-blue-700 bg-blue-700 text-white dark:border-blue-500 dark:bg-blue-700':'bg-white text-slate-800 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'}`}><Icon className="size-4" aria-hidden="true"/>{label}</button>)}</div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Cari Cabor atau Nama Khusus<input type="search" value={query} maxLength={80} onChange={event=>{setQuery(event.target.value);setPage(1);}} placeholder="Contoh: Bola Basket atau Sepakbola Putri" className={`${field} mt-2`}/></label>{view==='cards'?<label className="text-sm font-bold">Berlangsung pada tanggal<input type="date" value={date} min="2000-01-01" max="2100-12-31" onChange={event=>showDay(event.target.value)} className={`${field} mt-2`}/>{date&&<button type="button" className="mt-2 min-h-11 text-sm text-blue-800 underline dark:text-sky-200" onClick={()=>{setDate('');setPage(1);}}>Tampilkan semua tanggal</button>}</label>:<div><label className="text-sm font-bold" htmlFor="schedule-calendar-month">Bulan pelaksanaan</label><div className="mt-2 flex gap-2"><button type="button" className={button} disabled={month==='2000-01'} aria-label="Bulan sebelumnya" onClick={()=>{setMonth(shiftCalendarMonth(month,-1));setPage(1);}}><ChevronLeft className="size-4" aria-hidden="true"/></button><input id="schedule-calendar-month" type="month" min="2000-01" max="2100-12" value={month} onChange={event=>{if(/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(event.target.value)){setMonth(event.target.value);setPage(1);}}} className={`${field} min-w-0`}/><button type="button" className={button} disabled={month==='2100-12'} aria-label="Bulan berikutnya" onClick={()=>{setMonth(shiftCalendarMonth(month,1));setPage(1);}}><ChevronRight className="size-4" aria-hidden="true"/></button></div></div>}</div>
    {view==='cards'&&<ScheduleDayStrip month={month} date={date} today={today} label="rentang pelaksanaan" onMonth={value=>{setMonth(value);setDate('');setPage(1);}} onDate={showDay}/>}
    {loading?(
      <div className="mt-6 space-y-4" aria-label="Memuat rentang jadwal">
        <div className="h-5 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center justify-between gap-3">
                <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="mt-5 h-7 w-3/4 rounded-lg bg-slate-200/60 dark:bg-slate-800/60" />
            </div>
          ))}
        </div>
      </div>
    ):error?<div role="alert" className="mt-6 rounded-xl bg-amber-50 p-5 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">Rentang jadwal belum dapat dimuat. <button type="button" onClick={()=>setRefresh(value=>value+1)} className="min-h-11 underline">Coba lagi</button></div>:view==='calendar'&&data?.calendar?<><SchedulePeriodCalendar month={month} totalRecords={data.total} items={data.data} dayCounts={data.calendar.day_counts} today={today} onShowDay={day=>{showDay(day);setView('cards');}}/>{!data.total&&<p role="status" className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-slate-600 dark:border-slate-700 dark:text-slate-300">Belum ada rentang yang sesuai pada bulan ini. Pilih bulan lain atau ubah pencarian.</p>}</>:!data?.data.length?<div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><CalendarRange className="mx-auto size-9 text-primary-600 dark:text-sky-300" aria-hidden="true"/><h3 className="mt-3 font-black">{query||date?'Tidak ada rentang yang sesuai':'Jadwal Cabor belum tersedia'}</h3><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{query||date?'Ubah kata pencarian atau tanggal untuk melihat agenda lain.':'Silakan kunjungi kembali nanti.'}</p></div>:<div className="mt-6"><div className={presentation.groupHead}><h3>{date?'Cabor pada tanggal pilihan':'Seluruh rentang pelaksanaan'}</h3></div><div className={presentation.cards}>{groups.flatMap(group=>group.items.map(item=><SchedulePeriodCard key={item.id} item={item} today={today} onOpen={()=>setSelected(item)}/>))}</div></div>}

    {!!data?.total&&<div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600 dark:text-slate-300">Menampilkan {((data.page||page)-1)*perPage+1}–{Math.min((data.page||page)*perPage,data.total)} dari {data.total} rentang · Halaman {data.page||page} dari {Math.max(1,Math.ceil(data.total/perPage))}{view==='calendar'&&data.total>perPage&&<span className="mt-1 block">Gunakan halaman berikutnya untuk jadwal lainnya.</span>}</p><div className="flex gap-2"><button type="button" className={button} disabled={loading||(data.page||page)===1} onClick={()=>setPage((data.page||page)-1)}>Sebelumnya</button><button type="button" className={button} disabled={loading||(data.page||page)*perPage>=data.total} onClick={()=>setPage((data.page||page)+1)}>Berikutnya</button></div></div>}
    <SchedulePeriodDetails item={selected} today={today} onClose={()=>setSelected(null)}/>
  </section>;
}
