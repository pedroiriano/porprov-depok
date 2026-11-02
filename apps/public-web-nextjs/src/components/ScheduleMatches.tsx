"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, List, RefreshCw } from "lucide-react";
import { ScheduleMatchCard } from "./ScheduleMatchCard";
import { ScheduleMatchCalendar } from "./ScheduleMatchCalendar";
import { publicApiUrl } from "@/lib/public-api";
import { normalizeEnrichedMatch, type RawEnrichedMatch } from "@/lib/public-models";
import { jakartaDate, shiftCalendarMonth, matchStatusLabel } from '../../../../packages/portal-config/schedule-calendar';

type MatchPage = {data:RawEnrichedMatch[];total:number;page:number;per_page:number;total_pages:number;facets:{cabors:{id:string;name:string}[];venues:{id:string;name:string}[];statuses:string[]};calendar:{month:string;day_counts:Record<string,number>}};

export function ScheduleMatches() {
  const today=jakartaDate();
  const [view,setView]=useState<'calendar'|'cards'>('calendar');
  const [month,setMonth]=useState(today.slice(0,7));
  const [search,setSearch]=useState('');
  const [date,setDate]=useState('');
  const [cabor,setCabor]=useState('');
  const [venue,setVenue]=useState('');
  const [status,setStatus]=useState('');
  const [page,setPage]=useState(1);
  const [refresh,setRefresh]=useState(0);
  const perPage=view==='calendar'?24:12;
  const requestKey=JSON.stringify([view,month,search,date,cabor,venue,status,page,refresh]);
  const [settled,setSettled]=useState<{key:string;data:MatchPage|null;error:boolean}>({key:'',data:null,error:false});
  const loading=settled.key!==requestKey;
  const data=loading?null:settled.data;
  const options=settled.data?.facets;
  const matches=useMemo(()=>(data?.data||[]).map(normalizeEnrichedMatch),[data]);
  useEffect(()=>{
    const controller=new AbortController();
    // PERFORMANCE: Month/date filters, complete day counts and bounded pagination run in Schedule Service, not in the browser.
    const timer=window.setTimeout(async()=>{
      try {
        const params=new URLSearchParams({page:String(page),per_page:String(perPage),sort:'match_date',direction:'asc',q:search});
        if(view==='calendar')params.set('month',month);else if(date)params.set('date',date);
        if(cabor)params.set('cabor',cabor);if(venue)params.set('venue',venue);if(status)params.set('status',status);
        const response=await fetch(publicApiUrl(`/schedule/matches/enriched?${params}`),{cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
        if(!response.ok)throw new Error('Jadwal belum tersedia');
        const next=await response.json() as MatchPage;
        if(!Array.isArray(next.data)||!Number.isFinite(next.total)||!next.facets||(view==='calendar'&&next.calendar?.month!==month))throw new Error('Jadwal belum tersedia');
        if(!controller.signal.aborted)setSettled({key:requestKey,data:next,error:false});
      } catch {if(!controller.signal.aborted)setSettled({key:requestKey,data:null,error:true});}
    },250);
    return()=>{window.clearTimeout(timer);controller.abort();};
  },[requestKey,view,month,search,date,cabor,venue,status,page,perPage]);
  const groups=useMemo(()=>{
    const result=new Map<string,{name:string;items:typeof matches}>();
    for(const match of matches){const key=match.caborId||match.caborName;const group=result.get(key)||{name:match.caborName,items:[]};group.items.push(match);result.set(key,group);}
    return [...result.entries()];
  },[matches]);
  const button='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-40 dark:border-slate-600';
  const field='mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  const reset=()=>{setSearch('');setDate('');setCabor('');setVenue('');setStatus('');setPage(1);};
  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 md:p-8" aria-labelledby="schedule-matches-title">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-widest text-primary-600 dark:text-sky-300">Agenda pertandingan</p><h2 id="schedule-matches-title" className="mt-2 text-2xl font-black md:text-3xl">Rincian pertandingan</h2><p className="mt-3 text-slate-600 dark:text-slate-300">Pilih pertandingan untuk melihat babak, peserta, waktu, dan lokasi.</p></div><button type="button" disabled={loading} onClick={()=>setRefresh(value=>value+1)} className={button}><RefreshCw className={`size-4 ${loading?'animate-spin':''}`} aria-hidden="true"/>Perbarui rincian</button></div>
    <div role="group" aria-label="Pilihan tampilan rincian pertandingan" className="mt-6 flex flex-wrap gap-2">{([['calendar','Kalender',CalendarDays],['cards','Daftar Kartu',List]] as const).map(([id,label,Icon])=><button key={id} type="button" aria-pressed={view===id} onClick={()=>{setView(id);setPage(1);if(id==='calendar'&&date)setMonth(date.slice(0,7));}} className={`${button} ${view===id?'border-blue-700 bg-blue-700 text-white dark:border-blue-500':'bg-white text-slate-800 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'}`}><Icon className="size-4" aria-hidden="true"/>{label}</button>)}</div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="min-w-0 text-sm font-bold">Cari rincian<span className="relative block"><input type="search" maxLength={80} value={search} onChange={event=>{setSearch(event.target.value);setPage(1);}} placeholder="Cabor, peserta, lokasi, atau babak" className={field}/></span></label>
      {view==='calendar'?<div><label htmlFor="match-calendar-month" className="text-sm font-bold">Bulan pertandingan</label><div className="mt-2 flex gap-2"><button type="button" className={button} disabled={month==='2000-01'} aria-label="Bulan pertandingan sebelumnya" onClick={()=>{setMonth(shiftCalendarMonth(month,-1));setPage(1);}}><ChevronLeft className="size-4" aria-hidden="true"/></button><input id="match-calendar-month" type="month" min="2000-01" max="2100-12" value={month} onChange={event=>{if(/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(event.target.value)){setMonth(event.target.value);setPage(1);}}} className={`${field} mt-0`}/><button type="button" className={button} disabled={month==='2100-12'} aria-label="Bulan pertandingan berikutnya" onClick={()=>{setMonth(shiftCalendarMonth(month,1));setPage(1);}}><ChevronRight className="size-4" aria-hidden="true"/></button></div></div>:<label className="text-sm font-bold">Tanggal pertandingan<input type="date" min="2000-01-01" max="2100-12-31" value={date} onChange={event=>{setDate(event.target.value);setPage(1);}} className={field}/></label>}
      <label className="text-sm font-bold">Cabang olahraga<select value={cabor} onChange={event=>{setCabor(event.target.value);setPage(1);}} className={field}><option value="">Semua Cabor</option>{options?.cabors.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-sm font-bold">Lokasi<select value={venue} onChange={event=>{setVenue(event.target.value);setPage(1);}} className={field}><option value="">Semua lokasi</option>{options?.venues.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-sm font-bold">Status<select value={status} onChange={event=>{setStatus(event.target.value);setPage(1);}} className={field}><option value="">Semua status</option>{options?.statuses.map(item=><option key={item} value={item}>{matchStatusLabel(item)}</option>)}</select></label>
      <button type="button" onClick={reset} className={`${button} self-end text-blue-800 dark:text-sky-200`}>Atur ulang filter</button>
    </div>
    <div aria-live="polite">{loading?<p role="status" className="mt-6 text-slate-600 dark:text-slate-300">Memuat rincian pertandingan...</p>:settled.error?<div role="alert" className="mt-6 rounded-xl bg-amber-50 p-5 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">Rincian pertandingan belum dapat dimuat. <button type="button" className="min-h-11 underline" onClick={()=>setRefresh(value=>value+1)}>Coba lagi</button></div>:view==='calendar'&&data?<><ScheduleMatchCalendar key={requestKey} month={month} items={matches} dayCounts={data.calendar.day_counts} today={today} onShowDay={day=>{setDate(day);setView('cards');setPage(1);}}/>{!data.total&&<p className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-slate-600 dark:border-slate-700 dark:text-slate-300">Belum ada pertandingan yang sesuai pada bulan ini. Pilih bulan lain atau ubah filter.</p>}</>:!matches.length?<p className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-slate-600 dark:border-slate-700 dark:text-slate-300">Tidak ada rincian pertandingan yang sesuai. Ubah filter atau tunggu jadwal diterbitkan pengelola.</p>:<div className="mt-8 space-y-8">{groups.map(([id,group])=><section key={id} aria-label={group.name}><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-black">{group.name}</h3><span className="text-sm text-slate-600 dark:text-slate-300">{group.items.length} pertandingan pada halaman ini</span></div><div className="grid auto-rows-fr gap-4 xl:grid-cols-2">{group.items.map(match=><ScheduleMatchCard key={match.id} match={match} compact/>)}</div></section>)}</div>}</div>
    {!!data?.total&&<div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600 dark:text-slate-300">Menampilkan {(data.page-1)*perPage+1}–{Math.min(data.page*perPage,data.total)} dari {data.total} pertandingan · Halaman {data.page} dari {data.total_pages}</p><div className="flex gap-2"><button type="button" className={button} disabled={loading||data.page===1} onClick={()=>setPage(data.page-1)}>Sebelumnya</button><button type="button" className={button} disabled={loading||data.page>=data.total_pages} onClick={()=>setPage(data.page+1)}>Berikutnya</button></div></div>}
  </section>;
}
