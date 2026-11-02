'use client';

import {useRef,useState} from 'react';
import {ArrowRight,CalendarDays,ChevronRight,LocateFixed,MousePointer2} from 'lucide-react';
import {monthDays} from '../../../../packages/portal-config/schedule-calendar';
import styles from './SchedulePresentation.module.css';

export const scheduleToneClasses=[styles.blue,styles.green,styles.violet,styles.amber,styles.rose,styles.cyan];
export type CalendarBoardEvent={id:string;title:string;subtitle?:string;startsOn:string;endsOn:string;time?:string};
export type CalendarBoardRow={key:string;title:string;subtitle?:string;color:number;events:CalendarBoardEvent[]};
const shortDate=(day:string)=>new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${day}T12:00:00Z`));

// INFO: Prefer today's agenda, otherwise the nearest upcoming date in the selected month; never infer unprovided events.
export function initialScheduleDay(dates:string[],today:string,counts:Record<string,number>){
  return dates.find(day=>day>=today&&(counts[day]||0)>0)||dates.find(day=>(counts[day]||0)>0)||dates.find(day=>day===today)||dates[0];
}

// INFO: Colspans join consecutive days; overlaps retain individual controls and complete-day navigation.
export function scheduleRowSegments(dates:string[],events:CalendarBoardEvent[]){
  const segments:{day:string;span:number;events:CalendarBoardEvent[]}[]=[];
  for(let index=0;index<dates.length;){
    const day=dates[index];const active=events.filter(event=>event.startsOn<=day&&event.endsOn>=day);
    let span=1;
    if(active.length===1)while(index+span<dates.length){
      const next=events.filter(event=>event.startsOn<=dates[index+span]&&event.endsOn>=dates[index+span]);
      if(next.length!==1||next[0].id!==active[0].id)break;
      span++;
    }
    segments.push({day,span,events:active});index+=span;
  }
  return segments;
}

export function ScheduleCalendarBoard({month,today,rows,dayCounts,kind,totalRecords,onSelect,onShowDay}:{month:string;today:string;rows:CalendarBoardRow[];dayCounts:Record<string,number>;kind:'periods'|'matches';totalRecords?:number;onSelect:(id:string)=>void;onShowDay:(day:string)=>void}){
  const scroll=useRef<HTMLDivElement>(null);
  const agenda=useRef<HTMLElement>(null);
  const dates=monthDays(month).filter(day=>day.startsWith(month));
  const [picked,setPicked]=useState('');
  const selected=picked.startsWith(month)?picked:initialScheduleDay(dates,today,dayCounts);
  const monthLabel=new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${month}-01T12:00:00Z`));
  const noun=kind==='periods'?'jadwal Cabor':'pertandingan';
  const entries=rows.flatMap(row=>row.events.filter(event=>event.startsOn<=selected&&event.endsOn>=selected).map(event=>({row,event})));
  const count=dayCounts[selected]||0;
  const pageRecords=rows.reduce((total,row)=>total+row.events.length,0);
  const pickDay=(day:string)=>{
    setPicked(day);
    // ACCESSIBILITY: Date selection brings the resulting agenda into view and makes the next keyboard action predictable.
    agenda.current?.focus({preventScroll:true});
    agenda.current?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  const jumpToday=()=>{
    const cell=scroll.current?.querySelector<HTMLElement>('[data-today="true"]');
    const left=cell?cell.offsetLeft-(window.innerWidth<640?140:220):0;
    if(today.startsWith(month))setPicked(today);
    scroll.current?.scrollTo({left,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  return <div className={`mt-6 ${styles.surface}`}>
    <div className={styles.overview}><div><p className={styles.eyebrow}>{kind==='periods'?'Kapan Cabor berlangsung?':'Kapan pertandingan dimulai?'}</p><h3 className={styles.title}>{monthLabel}</h3><p className={styles.help}>Klik jadwal untuk detail, atau pilih tanggal untuk agenda harian.</p></div><button type="button" className={styles.action} onClick={jumpToday}><LocateFixed size={16} aria-hidden="true"/>{today.startsWith(month)?'Hari ini':'Ke awal bulan'}</button></div>
    <div className={styles.legend}><span><MousePointer2 size={14} aria-hidden="true"/>{kind==='periods'?'Batang berwarna = satu periode pelaksanaan':'Jam berwarna = pertandingan yang dapat dibuka'}</span><span><i className={`${styles.dot} ${styles.todayDot}`} aria-hidden="true"/>Hari ini</span></div>
    <div ref={scroll} className={styles.scroll} tabIndex={0} role="region" aria-label={`Geser kalender ${noun} ${monthLabel} secara mendatar`}>
      <table className={styles.matrix}><caption>Kalender {kind==='periods'?'rentang pelaksanaan':'rincian pertandingan'} {monthLabel}, berdasarkan Cabor dan tanggal</caption>
        <thead><tr><th scope="col" className={styles.rowHead}><strong>Cabang olahraga</strong><small>{kind==='periods'?'Pilih batang untuk detail':'Pilih jam untuk detail'}</small></th>{dates.map(day=>{
          const date=new Date(`${day}T12:00:00Z`);const weekend=[0,6].includes(date.getUTCDay());const total=dayCounts[day]||0;
          return <th key={day} scope="col" data-today={day===today?'true':undefined} className={`${styles.dayHead} ${day===today?styles.today:''} ${weekend?styles.weekend:''}`}><button type="button" onClick={()=>pickDay(day)} aria-pressed={selected===day} aria-label={`Agenda ${shortDate(day)} ${date.getUTCFullYear()}, ${total} ${noun}`} className={styles.day}><span>{new Intl.DateTimeFormat('id-ID',{weekday:'short',timeZone:'UTC'}).format(date)}</span><strong><time dateTime={day} aria-current={day===today?'date':undefined}>{date.getUTCDate()}</time></strong><small>{total?`${total} ${kind==='periods'?'jadwal':'laga'}`:'–'}</small></button></th>;
        })}</tr></thead>
        <tbody>{rows.map(row=><tr key={row.key}><th scope="row" className={styles.rowHead}><div className={styles.rowLabel}><span className={`${styles.dot} ${scheduleToneClasses[row.color]}`} aria-hidden="true"/><div><strong>{row.title}</strong>{row.subtitle&&<small>{row.subtitle}</small>}</div></div></th>{(kind==='periods'?scheduleRowSegments(dates,row.events):dates.map(day=>({day,span:1,events:row.events.filter(event=>event.startsOn<=day&&event.endsOn>=day)}))).map(({day,span,events})=><td key={day} colSpan={span} className={styles.cell}>{events.length?<button type="button" className={`${styles.event} ${kind==='periods'?styles.rangeEvent:''} ${scheduleToneClasses[row.color]}`} title={events.map(event=>`${event.title}${event.time?' · '+event.time+' WIB':''}${event.subtitle?' · '+event.subtitle:''}`).join('\n')} aria-label={`${row.title}${row.subtitle?' · '+row.subtitle:''}, ${day}. ${events.length===1?events[0].title:`${events.length} ${noun}`}. Buka detail.`} onClick={()=>events.length===1?onSelect(events[0].id):onShowDay(day)}>{kind==='matches'?<><strong>{events.length>1?events.length:events[0].time||'Laga'}</strong><small>{events.length>1?'laga':'WIB'}</small></>:<><strong>{span>2?(row.subtitle||row.title):events.length>1?`${events.length} jadwal`:'Lihat'}</strong><span>{shortDate(events[0].startsOn)}–{shortDate(events[0].endsOn)}</span><small><ChevronRight size={12} aria-hidden="true"/>Detail</small></>}</button>:<span className={styles.blank} aria-label="Belum ada rincian jadwal">·</span>}</td>)}</tr>)}</tbody>
      </table>
      {!rows.length&&<p className="p-8 text-center text-sm text-slate-600 dark:text-slate-300">Belum ada agenda sesuai filter pada bulan ini.</p>}
    </div>
    <p className={styles.calendarHint}>Geser kalender untuk tanggal berikutnya. Kolom Cabor tetap terlihat.{totalRecords!==undefined&&totalRecords>pageRecords?' Jadwal lainnya ada di halaman berikutnya.':''}</p>
    <section ref={agenda} tabIndex={-1} className={styles.dayAgenda} aria-label={`Agenda harian ${kind==='periods'?'Cabor':'pertandingan'}`}>
      <div className={styles.agendaHeading}><div><p className={styles.eyebrow}>Agenda tanggal pilihan</p><h4>{new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${selected}T12:00:00Z`))}</h4><p className={styles.help}>{count?`${count} ${noun} ${kind==='periods'?'berlangsung':'dijadwalkan'}`:'Belum ada agenda pada tanggal ini.'}</p></div><button className={styles.action} type="button" onClick={()=>onShowDay(selected)}><CalendarDays size={16} aria-hidden="true"/>Lihat per hari<ArrowRight size={15} aria-hidden="true"/></button></div>
      {!!entries.length&&<div className={styles.agendaList}>{entries.map(({row,event})=><button type="button" key={`${row.key}-${event.id}`} className={styles.agendaItem} onClick={()=>onSelect(event.id)} aria-label={`Lihat detail ${row.title}${row.subtitle?' · '+row.subtitle:''}: ${event.title}`}><span className={`${styles.agendaMark} ${scheduleToneClasses[row.color]}`}>{kind==='matches'?event.time||'Laga':<CalendarDays size={19} aria-hidden="true"/>}</span><span className={styles.agendaContent}><strong>{row.title}</strong>{(kind==='matches'||row.subtitle)&&<span>{kind==='matches'?event.title:row.subtitle}</span>}<small>{kind==='matches'?`${event.time||'Jam menyusul'} WIB · ${event.subtitle||''}`:event.subtitle||`${shortDate(event.startsOn)}–${shortDate(event.endsOn)}`}</small></span><ChevronRight size={18} aria-hidden="true"/></button>)}</div>}
      {count>entries.length&&<p className={styles.help}>Pilih “Lihat per hari” untuk semua {count} {noun}.</p>}
      {!entries.length&&count===0&&<p className={styles.help}>Pilih tanggal lain di atas atau gunakan pencarian Cabor.</p>}
    </section>
  </div>;
}
