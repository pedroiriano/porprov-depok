import assert from 'node:assert/strict';
import test from 'node:test';
import {scheduleRounds,scheduleRoundError,scheduleRoundLabel} from '../../packages/portal-config/schedule-round.ts';
import {matchDay,matchColor,matchStatusLabel} from '../../packages/portal-config/schedule-calendar.ts';

test('Golf rounds and unknown custom rounds survive edit/display without enum coercion',()=>{
  for(const value of ['putaran_1','putaran_2','putaran_3','putaran_4','putaran_tambahan'])assert.ok(scheduleRounds.some(round=>round.value===value));
  assert.equal(scheduleRoundLabel('perempat_final'),'Perempat Final');
  assert.equal(scheduleRoundLabel('Seri 5 Golf'),'Seri 5 Golf');
  assert.equal(scheduleRoundError('  Seri 5 Golf  '),'');
  assert.equal(scheduleRoundError('é'.repeat(50)),'');
  for(const invalid of ['','  ','é'.repeat(51),'Babak\n1','Babak\u202e1','\ud800'])assert.ok(scheduleRoundError(invalid));
});

test('match calendar groups the actual WIB day and uses stable colors and human status',()=>{
  assert.equal(matchDay('2026-10-31T16:59:59Z'),'2026-10-31');
  assert.equal(matchDay('2026-10-31T17:00:00Z'),'2026-11-01');
  assert.equal(matchDay('invalid'),'');
  assert.equal(matchColor('golf'),matchColor('golf'));assert.ok(matchColor('basket')>=0&&matchColor('basket')<6);
  assert.equal(matchStatusLabel('scheduled'),'Terjadwal');assert.equal(matchStatusLabel('Custom'),'Custom');
});
