'use client';
import {useState} from 'react';
import {groupSchedulePeriods,scheduleColor} from '../../../../packages/portal-config/schedule-calendar';
import {formatSchedulePeriod,type SchedulePeriod} from '../../../../packages/portal-config/schedule-period';
import {ScheduleCalendarBoard,scheduleToneClasses} from './ScheduleCalendarBoard';
import {SchedulePeriodDetails} from './ScheduleDetails';
export const scheduleCalendarColors=scheduleToneClasses;
export const periodColorClass=(item:SchedulePeriod)=>scheduleToneClasses[scheduleColor(item)];

export function SchedulePeriodCalendar({month,items,dayCounts,today,totalRecords,onShowDay}:{month:string;items:SchedulePeriod[];dayCounts:Record<string,number>;today:string;totalRecords?:number;onShowDay:(day:string)=>void}){
  const [selected,setSelected]=useState<SchedulePeriod|null>(null);
  const rows=groupSchedulePeriods(items).map(group=>({key:group.key,title:group.cabor,subtitle:group.label,color:scheduleColor(group.items[0]),events:group.items.map(item=>({id:item.id,title:group.label||group.cabor,subtitle:formatSchedulePeriod(item.starts_on,item.ends_on),startsOn:item.starts_on,endsOn:item.ends_on}))}));
  return <><ScheduleCalendarBoard month={month} today={today} rows={rows} dayCounts={dayCounts} kind="periods" totalRecords={totalRecords} onSelect={id=>setSelected(items.find(item=>item.id===id)||null)} onShowDay={onShowDay}/><SchedulePeriodDetails item={selected} today={today} onClose={()=>setSelected(null)}/></>;
}
