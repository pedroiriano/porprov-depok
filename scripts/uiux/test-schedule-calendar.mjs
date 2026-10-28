import assert from 'node:assert/strict';
import test from 'node:test';
import {calendarMonth,jakartaDate,monthDays,shiftCalendarMonth,groupSchedulePeriods,scheduleColor,periodsOnDay} from '../../packages/portal-config/schedule-calendar.ts';
const period=(id,label='',cabor='basket')=>({id,cabor_id:cabor,cabor_name:'Bola Basket',label,starts_on:'2026-10-31',ends_on:'2026-11-05',notes:''});
test('inclusive ranges cross month/year boundaries without local timezone shifts',()=>{
  assert.equal(shiftCalendarMonth('2026-12',1),'2027-01');assert.equal(shiftCalendarMonth('2026-01',-1),'2025-12');
  assert.equal(jakartaDate(new Date('2026-10-31T16:59:59Z')),'2026-10-31');assert.equal(jakartaDate(new Date('2026-10-31T17:00:00Z')),'2026-11-01');
  assert.equal(periodsOnDay([period('1')],'2026-10-30').length,0);assert.equal(periodsOnDay([period('1')],'2026-10-31').length,1);assert.equal(periodsOnDay([period('1')],'2026-11-05').length,1);assert.equal(periodsOnDay([period('1')],'2026-11-06').length,0);
  const days=monthDays('2028-02');assert.equal(days.length,42);assert.ok(days.includes('2028-02-29'));assert.equal(new Date(days[0]+'T12:00:00Z').getUTCDay(),1);
  for(const value of ['2026-2','2026-13','1999-12','2101-01','<script>'])assert.throws(()=>calendarMonth(value));
  assert.throws(()=>shiftCalendarMonth('2000-01',-1));assert.throws(()=>shiftCalendarMonth('2100-12',1));
});
test('special names form independent sub-cabor groups and stable colors',()=>{
  const items=[period('a'),period('b','Putri'),period('c','Putra'),period('d',' Putri '),period('e','Putri','other-sport')];
  const groups=groupSchedulePeriods(items);assert.equal(groups.length,4);assert.equal(groups.find(group=>group.label==='Putri'&&group.items[0].cabor_id==='basket').items.length,2);
  assert.equal(scheduleColor(items[1]),scheduleColor(items[3]));assert.equal(scheduleColor(items[1]),scheduleColor({...items[1],starts_on:'2027-01-01'}));
});
