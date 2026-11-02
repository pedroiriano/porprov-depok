"use client";

import {PortalLink as Link,usePortalConfig} from './PortalProvider';
import {portalTarget} from '../../../../packages/portal-config/config';
import {ArrowUpRight,CalendarDays,Clock3,MapPin} from 'lucide-react';
import type {EnrichedMatch} from '@/lib/public-models';
import {matchStatusLabel,matchColor} from '../../../../packages/portal-config/schedule-calendar';
import {scheduleToneClasses} from './ScheduleCalendarBoard';
import styles from './SchedulePresentation.module.css';

export function ScheduleMatchCard({match,compact=false,onOpen}:{match:EnrichedMatch;compact?:boolean;onOpen?:()=>void}){
  const portal=usePortalConfig();
  const caborPath=match.caborId?`/cabor/${encodeURIComponent(match.caborId)}`:'';
  const venuePath=match.venueId?`/venue/${encodeURIComponent(match.venueId)}`:'';
  // INFO: A disabled destination never removes the read-only reference name from Jadwal.
  const caborLink=portal&&caborPath&&portalTarget(portal,caborPath);
  const venueLink=portal&&venuePath&&portalTarget(portal,venuePath);
  const rawDate=new Date(match.matchDate);const date=Number.isNaN(rawDate.getTime())?null:rawDate;
  const participants=match.participants.slice(0,2);
  const time=date?new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(date):'Menyusul';
  const day=date?new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'}).format(date):'Tanggal menunggu konfirmasi';
  const color=scheduleToneClasses[matchColor(match.caborId)];
  const Heading=compact?'h4':'h3';
  return <article className={`${styles.surface} ${styles.card}`} data-density={compact?'compact':'normal'}>
    <div className={`${styles.cardHead} ${color}`}><span className="inline-flex items-center gap-2"><Clock3 size={15} aria-hidden="true"/><strong>{time}{date?' WIB':''}</strong></span><span>{matchStatusLabel(match.status)}</span></div>
    <div className={styles.cardBody}><div className={styles.sport}>{match.caborIconUrl&&(
      // PERFORMANCE: Existing Media Library icon is lazy-loaded without an external dependency.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={match.caborIconUrl} alt="" loading="lazy" decoding="async"/>
    )}{caborLink?<Link href={caborPath} className="inline-flex min-h-11 items-center hover:underline">{match.caborName}</Link>:<span>{match.caborName}</span>}</div>
      <div><Heading className={styles.cardTitle}>{onOpen?<button type="button" onClick={onOpen} className={styles.cardTrigger} aria-label={`Lihat detail pertandingan ${match.caborName} · ${match.nomorTandingName}`}>{match.nomorTandingName}</button>:match.nomorTandingName}</Heading><p className={styles.muted}>{match.round} · {match.genderCategory}</p></div>
      <div className={styles.participants}>{(participants.length?participants:[{id:'waiting-a',display_name:'Peserta menunggu konfirmasi'},{id:'waiting-b',display_name:'Lawan menunggu konfirmasi'}]).map((participant,index)=><div key={participant.id} className={styles.participant}><span className={styles.initial} aria-hidden="true">{index===0?'A':'B'}</span><span className="min-w-0 break-words">{participant.display_name}</span></div>)}</div>
      <p className={`inline-flex items-start gap-2 ${styles.muted}`}><CalendarDays size={15} className="mt-0.5 shrink-0" aria-hidden="true"/>{day}</p>
    </div>
    <div className={styles.cardFoot}><MapPin size={16} className="shrink-0" aria-hidden="true"/>{venueLink?<Link href={venuePath} className="inline-flex min-h-11 items-center break-words font-bold hover:underline">{match.venueName}</Link>:<span className="break-words font-bold">{match.venueName}</span>}{onOpen&&<span className={styles.cardCta}>Detail <ArrowUpRight size={16} aria-hidden="true"/></span>}</div>
  </article>;
}
