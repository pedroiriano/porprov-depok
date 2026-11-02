import {ArrowUpRight,CalendarDays,Clock3} from 'lucide-react';
import {formatSchedulePeriod,type SchedulePeriod} from '../../../../packages/portal-config/schedule-period';
import {scheduleColor} from '../../../../packages/portal-config/schedule-calendar';
import {scheduleToneClasses} from './ScheduleCalendarBoard';
import styles from './SchedulePresentation.module.css';

export function SchedulePeriodCard({item,today,onOpen}:{item:SchedulePeriod;today:string;onOpen?:()=>void}) {
  const days=Math.round((Date.parse(`${item.ends_on}T00:00:00Z`)-Date.parse(`${item.starts_on}T00:00:00Z`))/86400000)+1;
  const start=new Date(`${item.starts_on}T12:00:00Z`);
  const status=today<item.starts_on?'Akan dimulai':today>item.ends_on?'Selesai':today===item.starts_on?'Mulai hari ini':'Berlangsung';
  return <article className={`${styles.surface} ${styles.card}`}>
    <div className={`${styles.cardHead} ${scheduleToneClasses[scheduleColor(item)]}`}><span className="inline-flex items-center gap-2"><CalendarDays size={15} aria-hidden="true"/>Jadwal Cabor</span><span>{status}</span></div>
    <div className={styles.cardBody}><p className={styles.sport}>{item.cabor_name}</p><h4 className={styles.cardTitle}>{onOpen?<button type="button" onClick={onOpen} className={styles.cardTrigger} aria-label={`Lihat detail jadwal ${item.cabor_name}${item.label?' · '+item.label:''}`}>{item.label||item.cabor_name}</button>:item.label||item.cabor_name}</h4><div className={styles.dateBlock}><div className={styles.dateTile}><strong>{start.getUTCDate()}</strong><span>{new Intl.DateTimeFormat('id-ID',{month:'short',timeZone:'UTC'}).format(start)}</span></div><div><p className={styles.dateText}>{formatSchedulePeriod(item.starts_on,item.ends_on)}</p><p className={styles.muted}>{days} hari berturut-turut</p></div></div>{item.notes&&<p className={`${styles.notes} ${onOpen?styles.notesPreview:''}`}>{item.notes}</p>}</div>
    <div className={styles.cardFoot}>{onOpen?<><span className={styles.cardCta}>Lihat jadwal lengkap</span><ArrowUpRight size={18} aria-hidden="true"/></>:<><Clock3 size={15} aria-hidden="true"/><span>{today<item.starts_on?'Bersiap menyambut pertandingan':today>item.ends_on?'Rentang pelaksanaan telah berakhir':'Masih dalam rentang pelaksanaan'}</span></>}</div>
  </article>;
}
