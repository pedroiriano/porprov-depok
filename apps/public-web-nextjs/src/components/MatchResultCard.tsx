'use client';

import type {EnrichedMatch} from '../lib/public-models';
import {scheduleParticipantViews} from './ScheduleParticipants';
import {PortalLink} from './PortalProvider';
import {matchResultsHref,scoreEntryOpen} from '../../../../packages/portal-config/schedule-results';
import {matchStatusLabel} from '../../../../packages/portal-config/schedule-calendar';

export type PublicScore={matchId:string;scoreA:number;scoreB:number;status:string;timestamp?:string};
export function MatchResultCard({match,score,link=true}:{match:EnrichedMatch;score?:PublicScore;link?:boolean}) {
  const sides=scheduleParticipantViews(match.participants);
  const ready=match.participants.length===2&&match.participants.every(p=>p.display_name&&p.display_name!=='Peserta menunggu konfirmasi');
  const recorded=ready&&scoreEntryOpen(match.matchDate)&&score&&Number.isFinite(score.scoreA)&&Number.isFinite(score.scoreB)?score:undefined;
  const href=matchResultsHref(match.id);
  const date=new Date(match.matchDate);
  const dateText=Number.isFinite(date.getTime())?`${date.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})} WIB`:'Waktu menunggu konfirmasi';
  const message=!ready?'Peserta sedang dikonfirmasi.':recorded?'':!scoreEntryOpen(match.matchDate)?'Pertandingan belum dimulai.':'Hasil pertandingan belum tersedia.';
  return <article id={`pertandingan-${match.id}`} className="flex h-full min-w-0 scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800"><div className="min-w-0"><p className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-sky-300">{match.caborName}</p><h3 className="mt-2 break-words text-lg font-black">{match.nomorTandingName}</h3><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{match.round}</p></div><span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold dark:bg-slate-700">{recorded?(recorded.status.toLowerCase()==='official'?'Hasil resmi':matchStatusLabel(recorded.status)):'Skor belum tersedia'}</span></header>
    <div className="flex-1 space-y-4 p-5">{sides.map((side,index)=><div key={side.side} className="flex min-w-0 items-center justify-between gap-4"><div className="min-w-0"><span className="text-xs text-slate-600 dark:text-slate-300">{side.label}</span><p className="break-words font-black">{side.name}</p>{side.affiliation&&<p className="break-words text-xs text-slate-600 dark:text-slate-300">{side.affiliation}</p>}</div><strong className="shrink-0 text-3xl tabular-nums" aria-label={`Skor ${side.name}: ${recorded?(index===0?recorded.scoreA:recorded.scoreB):'belum tersedia'}`}>{recorded?(index===0?recorded.scoreA:recorded.scoreB):'–'}</strong></div>)}{message&&<p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>}</div>
    <footer className="mt-auto space-y-2 border-t border-slate-200 p-5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"><p>{dateText}</p><p className="break-words">{match.venueName}</p>{link&&href&&<PortalLink href={href} className="inline-flex min-h-11 items-center font-bold text-blue-700 hover:underline dark:text-sky-300">Lihat hasil pertandingan →</PortalLink>}</footer>
  </article>;
}
