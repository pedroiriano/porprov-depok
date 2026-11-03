"use client";

import {Suspense,useCallback,useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import {PortalLink} from "@/components/PortalProvider";
import {PublicPageHero} from "@/components/PublicPageHero";
import {MatchResultCard,type PublicScore} from "@/components/MatchResultCard";
import {PublicCardGrid} from "@/components/PublicCardGrid";
import {publicApiUrl,unwrapCollection} from "@/lib/public-api";
import {normalizeEnrichedMatch,type EnrichedMatch,type RawEnrichedMatch} from "@/lib/public-models";
import {canonicalMatchId} from "../../../../../packages/portal-config/schedule-results";

type Score=PublicScore&{sequence?:number;revisionNumber?:number};
function ResultsContent(){
  const query=useSearchParams();const requested=query.get('match')||'';
  const invalid=query.getAll('match').length>1||!!requested&&!canonicalMatchId(requested);
  const [matches,setMatches]=useState<EnrichedMatch[]>([]);const [scores,setScores]=useState<Record<string,Score>>({});
  const [page,setPage]=useState(1);const [total,setTotal]=useState(0);const [search,setSearch]=useState('');const [term,setTerm]=useState('');const [date,setDate]=useState('');
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [connected,setConnected]=useState(false);
  const activePage=requested?1:page;
  const load=useCallback(async(signal:AbortSignal)=>{
    if(invalid){setMatches([]);setTotal(0);setLoading(false);setError('Tautan pertandingan tidak valid. Buka kembali melalui Jadwal.');return;}
    setLoading(true);setError('');
    try{
      const params=new URLSearchParams({page:String(activePage),per_page:'12',sort:'match_date',direction:'desc'});
      if(requested)params.set('match_id',requested);else{if(term)params.set('q',term);if(date)params.set('date',date);}
      const [matchResponse,scoreResponse]=await Promise.all([fetch(publicApiUrl(`/livescore/schedule-projection?${params}`),{cache:'no-store',signal}),fetch(publicApiUrl('/livescore/public'),{cache:'no-store',signal})]);
      if(!matchResponse.ok||!scoreResponse.ok)throw new Error('Unavailable');
      const [raw,scoreData]=await Promise.all([matchResponse.json(),scoreResponse.json()]);if(signal.aborted)return;
      setMatches(unwrapCollection<RawEnrichedMatch>(raw).map(normalizeEnrichedMatch));setTotal(Number.isSafeInteger(raw.total)?raw.total:0);
      setScores(Object.fromEntries(unwrapCollection<Score>(scoreData).map(item=>[item.matchId,item])));
    }catch{if(!signal.aborted)setError('Hasil pertandingan belum dapat dimuat. Silakan coba lagi.');}
    finally{if(!signal.aborted)setLoading(false);}
  },[activePage,requested,invalid,term,date]);
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{const controller=new AbortController();const timeout=window.setTimeout(()=>{controller.abort();setLoading(false);setError('Hasil pertandingan belum dapat dimuat. Silakan coba lagi.');},15000);const begin=window.setTimeout(()=>void load(controller.signal).finally(()=>window.clearTimeout(timeout)),0);return()=>{window.clearTimeout(begin);window.clearTimeout(timeout);controller.abort();};},[load,refresh]);
  useEffect(()=>{const timer=window.setInterval(()=>setRefresh(value=>value+1),30000);return()=>window.clearInterval(timer);},[]);
  useEffect(()=>{
    if(invalid)return;
    const events=new EventSource(publicApiUrl('/stream/events'));
    events.onopen=()=>{setConnected(true);setRefresh(value=>value+1);};events.onerror=()=>setConnected(false);
    events.onmessage=event=>{try{
      const item=JSON.parse(event.data);
      if(!canonicalMatchId(item.matchId||'')||!['LIVESCORE_UPDATED','LIVESCORE_CORRECTED'].includes(item.eventType)||!Number.isFinite(item.scoreA)||!Number.isFinite(item.scoreB)||item.scoreA<0||item.scoreB<0)return;
      // RELIABILITY: Replayed older revisions cannot overwrite a newer visible result.
      setScores(current=>{const old=current[item.matchId];const revision=item.sequence||item.revisionNumber||0;if(old&&(old.sequence||old.revisionNumber||0)>revision)return current;return {...current,[item.matchId]:item};});
    }catch{/* SECURITY: Malformed stream data never becomes rendered HTML. */}};
    return()=>events.close();
  },[invalid]);
  return <main className="bg-slate-50 dark:bg-slate-950"><PublicPageHero eyebrow="Jadwal dan skor" title="Hasil Pertandingan" description="Lihat pihak yang bertanding, skor, dan hasil setiap laga." icon="ri-trophy-line" breadcrumbs={[{label:'Hasil'}]}/>
    <div className="container py-12 md:py-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-slate-600 dark:text-slate-300">{connected?'Pembaruan langsung aktif':'Pembaruan berkala aktif'}</p><PortalLink href="/jadwal#rincian-pertandingan" className="inline-flex min-h-11 items-center font-bold text-blue-700 dark:text-sky-300">← Kembali ke jadwal</PortalLink></div>
      {requested?<div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><p>Hasil pertandingan yang dipilih dari Jadwal.</p><PortalLink href="/livescore" className="inline-flex min-h-11 items-center font-bold text-blue-700 dark:text-sky-300">Semua hasil</PortalLink></div>:<form className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]" onSubmit={event=>{event.preventDefault();setPage(1);setTerm(search.trim());}}><label className="col-span-2 min-w-0 text-sm font-bold sm:col-span-1">Cari pertandingan<input type="search" maxLength={80} value={search} onChange={event=>setSearch(event.target.value)} placeholder="Cabor, peserta, atau lokasi" className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-900"/></label><label className="min-w-0 text-sm font-bold">Tanggal WIB<input type="date" value={date} onChange={event=>{setDate(event.target.value);setPage(1);}} className="mt-2 block min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-900"/></label><button className="min-h-11 rounded-xl bg-blue-700 px-5 font-bold text-white" type="submit">Cari</button></form>}
      {error?<div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"><p>{error}</p>{!invalid&&<button type="button" className="mt-3 min-h-11 font-bold underline" onClick={()=>setRefresh(value=>value+1)}>Coba lagi</button>}</div>:loading?<p role="status" className="py-12 text-center">Memuat hasil pertandingan…</p>:matches.length?<PublicCardGrid>{matches.map(match=><MatchResultCard key={match.id} match={match} score={scores[match.id]} link={!requested}/>)}</PublicCardGrid>:<div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700"><h2 className="text-xl font-black">{requested?'Pertandingan belum tersedia':'Belum ada pertandingan yang sesuai'}</h2><p className="mt-2 text-slate-600 dark:text-slate-300">{requested?'Periksa kembali jadwal pertandingan.':'Coba tanggal atau kata pencarian lain.'}</p></div>}
      {!requested&&!error&&total>0&&<nav aria-label="Halaman hasil pertandingan" className="mt-8 flex flex-wrap items-center justify-between gap-3"><p className="text-sm">Menampilkan {Math.min((activePage-1)*12+1,total)}–{Math.min(activePage*12,total)} dari {total} pertandingan</p><div className="flex gap-3"><button type="button" disabled={loading||page===1} onClick={()=>setPage(value=>value-1)} className="min-h-11 rounded-xl border px-4 disabled:opacity-40">Sebelumnya</button><button type="button" disabled={loading||page*12>=total} onClick={()=>setPage(value=>value+1)} className="min-h-11 rounded-xl border px-4 disabled:opacity-40">Berikutnya</button></div></nav>}
    </div></main>;
}
export default function LiveScorePage(){return <Suspense fallback={<p role="status" className="p-10">Memuat hasil pertandingan…</p>}><ResultsContent/></Suspense>;}
