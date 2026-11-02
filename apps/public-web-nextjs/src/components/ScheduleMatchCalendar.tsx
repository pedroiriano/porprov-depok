'use client';
import {useState} from 'react';
import type {EnrichedMatch} from '@/lib/public-models';
import {ScheduleCalendarBoard,type CalendarBoardRow} from './ScheduleCalendarBoard';
import {ScheduleMatchDetails} from './ScheduleDetails';
import {matchColor,matchDay} from '../../../../packages/portal-config/schedule-calendar';

export function ScheduleMatchCalendar({month,items,dayCounts,today,totalRecords,onShowDay}:{month:string;items:EnrichedMatch[];dayCounts:Record<string,number>;today:string;totalRecords?:number;onShowDay:(day:string)=>void}){
  const [selected,setSelected]=useState<EnrichedMatch|null>(null);
  const groups=new Map<string,CalendarBoardRow>();
  for(const item of items){
    const key=item.caborId||item.caborName;
    const row=groups.get(key)||{key,title:item.caborName,color:matchColor(key),events:[]};
    const day=matchDay(item.matchDate);
    if(day)row.events.push({id:item.id,title:item.nomorTandingName,subtitle:`${item.round} · ${item.venueName}`,startsOn:day,endsOn:day,time:new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date(item.matchDate))});
    groups.set(key,row);
  }
  return <><ScheduleCalendarBoard month={month} today={today} rows={[...groups.values()]} dayCounts={dayCounts} kind="matches" totalRecords={totalRecords} onSelect={id=>setSelected(items.find(item=>item.id===id)||null)} onShowDay={onShowDay}/><ScheduleMatchDetails item={selected} onClose={()=>setSelected(null)}/></>;
}
