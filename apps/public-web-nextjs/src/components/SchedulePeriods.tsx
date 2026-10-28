'use client';
import {useEffect, useState} from 'react';
import {CalendarRange, RefreshCw} from 'lucide-react';
import {publicApiUrl} from '@/lib/public-api';
import {formatSchedulePeriod, type PeriodPage, type SchedulePeriod} from '../../../../packages/portal-config/schedule-period';

export function SchedulePeriods() {
  const [query,setQuery] = useState(''); const [date,setDate] = useState(''); const [page,setPage] = useState(1);
  const [data,setData] = useState<PeriodPage|null>(null); const [error,setError] = useState(false); const [loading,setLoading] = useState(true); const [refresh,setRefresh] = useState(0);
  useEffect(()=>{
    const controller = new AbortController();
    // PERFORMANCE: Search, date filtering and pagination remain on the service; stale responses are cancelled.
    const timer = window.setTimeout(async ()=>{
      setLoading(true);setError(false);
      try {
        const params = new URLSearchParams({page:String(page),per_page:'12',q:query,date});
        const response = await fetch(publicApiUrl(`/schedule/periods?${params}`),{cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
        if (!response.ok) throw new Error('Jadwal belum tersedia');
        const next = await response.json() as PeriodPage<SchedulePeriod>;
        if (!Array.isArray(next.data)||!Number.isFinite(next.total)) throw new Error('Jadwal belum tersedia');
        if (!controller.signal.aborted) setData(next);
      } catch {if (!controller.signal.aborted) {setError(true);setData(null);}}
      finally {if (!controller.signal.aborted) setLoading(false);}
    },250);
    return ()=>{window.clearTimeout(timer);controller.abort();};
  },[query,date,page,refresh]);
  const field='min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8" aria-labelledby="schedule-periods-title">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-widest text-primary-600 dark:text-sky-300">Agenda Cabang Olahraga</p><h2 id="schedule-periods-title" className="mt-2 text-2xl font-black md:text-3xl">Rentang pelaksanaan</h2><p className="mt-3 text-slate-600 dark:text-slate-300">Lihat tanggal mulai hingga selesai setiap cabang olahraga dan kategorinya.</p></div><button type="button" disabled={loading} onClick={()=>setRefresh(value=>value+1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 font-bold disabled:opacity-50 dark:border-slate-600"><RefreshCw className={`size-4 ${loading?'animate-spin':''}`} aria-hidden="true"/>Perbarui rentang</button></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Cari cabang atau kategori<input type="search" value={query} maxLength={80} onChange={event=>{setQuery(event.target.value);setPage(1);}} placeholder="Contoh: Bola Basket atau Sepakbola Putri" className={`${field} mt-2`}/></label><label className="text-sm font-bold">Berlangsung pada tanggal<input type="date" value={date} min="2000-01-01" max="2100-12-31" onChange={event=>{setDate(event.target.value);setPage(1);}} className={`${field} mt-2`}/></label></div>
    {loading?<p role="status" className="mt-6 text-slate-600 dark:text-slate-300">Memuat rentang jadwal...</p>:error?<div role="alert" className="mt-6 rounded-xl bg-amber-50 p-5 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">Rentang jadwal belum dapat dimuat. <button type="button" onClick={()=>setRefresh(value=>value+1)} className="min-h-11 underline">Coba lagi</button></div>:!data?.data.length?<div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><CalendarRange className="mx-auto size-9 text-primary-600 dark:text-sky-300" aria-hidden="true"/><h3 className="mt-3 font-black">{query||date?'Tidak ada rentang yang sesuai':'Rentang jadwal belum dipublikasikan'}</h3><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{query||date?'Ubah kata pencarian atau tanggal untuk melihat agenda lain.':'Tanggal pelaksanaan akan tampil setelah ditetapkan pengelola.'}</p></div>:<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.data.map(item=><article key={item.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><span className="text-xs font-black uppercase tracking-wider text-primary-600 dark:text-sky-300">{today<item.starts_on?'Akan dimulai':today>item.ends_on?'Selesai':'Berlangsung'}</span><h3 className="mt-3 break-words text-xl font-black">{item.label||item.cabor_name}</h3>{item.label&&<p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.cabor_name}</p>}<p className="mt-4 font-bold">{formatSchedulePeriod(item.starts_on,item.ends_on)}</p>{item.notes&&<p className="mt-3 whitespace-pre-line break-words text-sm text-slate-600 dark:text-slate-300">{item.notes}</p>}</article>)}</div>}
    {!!data?.total&&<div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600 dark:text-slate-300">{data.total} rentang · Halaman {page} dari {Math.max(1,Math.ceil(data.total/12))}</p><div className="flex gap-2"><button className="min-h-11 rounded-xl border border-slate-300 px-4 disabled:opacity-40 dark:border-slate-600" disabled={loading||page===1} onClick={()=>setPage(value=>value-1)}>Sebelumnya</button><button className="min-h-11 rounded-xl border border-slate-300 px-4 disabled:opacity-40 dark:border-slate-600" disabled={loading||page*12>=data.total} onClick={()=>setPage(value=>value+1)}>Berikutnya</button></div></div>}
  </section>;
}
