'use client';

import {useEffect,useId,useRef,type ReactNode} from 'react';
import {CalendarDays,Clock3,Info,X} from 'lucide-react';
import type {EnrichedMatch} from '@/lib/public-models';
import {formatSchedulePeriod,type SchedulePeriod} from '../../../../packages/portal-config/schedule-period';
import {ScheduleMatchCard} from './ScheduleMatchCard';
import {PortalLink} from './PortalProvider';
import {matchResultsHref} from '../../../../packages/portal-config/schedule-results';
import styles from './SchedulePresentation.module.css';

// ACCESSIBILITY: Calendar, daily agenda and cards share native modal behavior and focus restoration.
export function ScheduleDialog({open,title,onClose,children}:{open:boolean;title:string;onClose:()=>void;children:ReactNode}){
  const dialog=useRef<HTMLDialogElement>(null);
  const titleId=useId();
  useEffect(()=>{
    const node=dialog.current;
    if(!open||!node)return;
    const locked=document.body.classList.contains('overflow-hidden');
    document.body.classList.add('overflow-hidden');
    if(!node.open)node.showModal();
    return()=>{if(node.open)node.close();if(!locked)document.body.classList.remove('overflow-hidden');};
  },[open]);
  return <dialog ref={dialog} aria-labelledby={titleId} onClose={onClose} onClick={event=>{
    const bounds=event.currentTarget.getBoundingClientRect();
    if(event.target===event.currentTarget&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom))event.currentTarget.close();
  }} className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-slate-300 bg-white p-5 text-slate-950 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
    <div className="mb-5 flex items-start justify-between gap-3"><h3 id={titleId} className="text-xl font-black">{title}</h3><button type="button" onClick={()=>dialog.current?.close()} aria-label={`Tutup ${title.toLocaleLowerCase('id-ID')}`} className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-600"><X className="size-5" aria-hidden="true"/></button></div>
    {children}
  </dialog>;
}

export function SchedulePeriodDetails({item,today,onClose}:{item:SchedulePeriod|null;today:string;onClose:()=>void}){
  const days=item?Math.round((Date.parse(`${item.ends_on}T00:00:00Z`)-Date.parse(`${item.starts_on}T00:00:00Z`))/86400000)+1:0;
  return <ScheduleDialog open={!!item} title="Detail jadwal Cabor" onClose={onClose}>{item&&<div className={styles.surface}>
    <div className={styles.detailIntro}><p className={styles.eyebrow}>{item.cabor_name}</p><h4 className={styles.detailTitle}>{item.label||item.cabor_name}</h4><p className={styles.help}>{today<item.starts_on?'Akan dimulai':today>item.ends_on?'Sudah selesai':'Sedang berlangsung'}</p></div>
    <dl className={styles.detailList}><div><dt><CalendarDays size={18} aria-hidden="true"/>Tanggal pelaksanaan</dt><dd>{formatSchedulePeriod(item.starts_on,item.ends_on)}</dd></div><div><dt><Clock3 size={18} aria-hidden="true"/>Lama pelaksanaan</dt><dd>{days} hari berturut-turut</dd></div>{item.label&&<div><dt>Cabang olahraga</dt><dd>{item.cabor_name}</dd></div>}<div><dt><Info size={18} aria-hidden="true"/>Keterangan</dt><dd>{item.notes||'Keterangan tambahan belum tersedia.'}</dd></div></dl>
    <p className={styles.detailNotice}>Lihat jam, peserta, babak, dan lokasi pada Rincian pertandingan.</p>
  </div>}</ScheduleDialog>;
}

export function ScheduleMatchDetails({item,onClose}:{item:EnrichedMatch|null;onClose:()=>void}){
  return <ScheduleDialog open={!!item} title="Detail pertandingan" onClose={onClose}>{item&&<><ScheduleMatchCard match={item} compact/>{matchResultsHref(item.id)&&<PortalLink href={matchResultsHref(item.id)!} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 font-bold text-white hover:bg-blue-800">Lihat hasil pertandingan →</PortalLink>}{item.venueAddress&&<p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300"><strong>Alamat lokasi:</strong> {item.venueAddress}</p>}</>}</ScheduleDialog>;
}
