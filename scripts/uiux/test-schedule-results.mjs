import assert from 'node:assert/strict';
import test from 'node:test';
import {scoreEntryOpen,matchResultsHref,canonicalMatchId} from '../../packages/portal-config/schedule-results.ts';
test('score entry follows WIB calendar dates including midnight and malformed dates',()=>{
const when='2026-11-03T09:00:00Z';assert.equal(scoreEntryOpen(when,new Date('2026-11-02T16:59:59Z')),false);assert.equal(scoreEntryOpen(when,new Date('2026-11-02T17:00:00Z')),true);assert.equal(scoreEntryOpen(when,new Date('2026-11-03T01:00:00Z')),true);for(const input of ['',undefined,'not a date'])assert.equal(scoreEntryOpen(input,new Date('2026-11-03T01:00:00Z')),false);
});
test('schedule links preserve the exact match and reject malformed redirect-like values',()=>{const id='00000000-0000-4000-8000-000000000001';assert.equal(matchResultsHref(id),'/livescore?match='+id);for(const value of ['javascript:alert(1)','../admin','https://other.example','bad']){assert.equal(canonicalMatchId(value),false);assert.equal(matchResultsHref(value),null);}});
