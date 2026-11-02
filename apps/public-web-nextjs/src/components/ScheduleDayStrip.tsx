'use client';
import {useEffect,useRef} from 'react';
import {CalendarDays,ChevronLeft,ChevronRight} from 'lucide-react';
import {monthDays,shiftCalendarMonth} from '../../../../packages/portal-config/schedule-calendar';
import styles from './SchedulePresentation.module.css';

export function ScheduleDayStrip({month,date,today,onMonth,onDate,label}:{month:string;date:string;today:string;onMonth:(value:string)=>void;onDate:(value:string)=>void;label:string}){
  const strip=useRef<HTMLDivElement>(null);
  const dates=monthDays(month).filter(day=>day.startsWith(month));
  useEffect(()=>{
    const target=strip.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if(target&&strip.current)strip.current.scrollLeft=target.offsetLeft-strip.current.offsetLeft-strip.current.clientWidth/2+target.offsetWidth/2;
  },[date,month]);
  return <div className={`mt-5 ${styles.surface}`}><div className={styles.stripToolbar}><div><p className={styles.eyebrow}>Jelajahi agenda harian</p><p className={styles.help}>{date?new Intl.DateTimeFormat('id-ID',{dateStyle:'full',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`)):'Semua tanggal · pilih hari untuk menyaring'}</p></div><div className={styles.pills}><button type="button" className={styles.action} disabled={month==='2000-01'} aria-label={`Bulan sebelumnya ${label}`} onClick={()=>onMonth(shiftCalendarMonth(month,-1))}><ChevronLeft size={16} aria-hidden="true"/></button><span className={styles.pill}>{new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${month}-01T12:00:00Z`))}</span><button type="button" className={styles.action} disabled={month==='2100-12'} aria-label={`Bulan berikutnya ${label}`} onClick={()=>onMonth(shiftCalendarMonth(month,1))}><ChevronRight size={16} aria-hidden="true"/></button><button type="button" className={styles.action} onClick={()=>onDate('')}>Semua tanggal</button><button type="button" className={styles.action} onClick={()=>onDate(today)}><CalendarDays size={14} aria-hidden="true"/>Hari ini</button></div></div><div ref={strip} className={styles.strip} role="group" aria-label={`Pilih tanggal ${label}`}>{dates.map(day=><button key={day} type="button" className={styles.dateChip} aria-pressed={date===day} aria-label={new Intl.DateTimeFormat('id-ID',{dateStyle:'full',timeZone:'UTC'}).format(new Date(`${day}T12:00:00Z`))} onClick={()=>onDate(day)}><span>{new Intl.DateTimeFormat('id-ID',{weekday:'short',timeZone:'UTC'}).format(new Date(`${day}T12:00:00Z`))}</span><strong>{Number(day.slice(-2))}</strong><span>{day===today?'Hari ini':new Intl.DateTimeFormat('id-ID',{month:'short',timeZone:'UTC'}).format(new Date(`${day}T12:00:00Z`))}</span></button>)}</div></div>;
}
