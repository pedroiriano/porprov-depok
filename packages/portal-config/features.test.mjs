import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultPortalConfig,normalizeLegacyPortalConfig,localFeature,portalTarget} from './config.ts';

test('legacy schedule slots preserve hidden state, order and density',()=>{
 const old=structuredClone(defaultPortalConfig);delete old.features;
 const page=old.pages.find(p=>p.id==='jadwal');page.sections=[{id:'native',type:'content',enabled:false,variant:'compact'}];
 const normalized=normalizeLegacyPortalConfig(old);const slots=normalized.pages.find(p=>p.id==='jadwal').sections;
 assert.deepEqual(slots.map(s=>[s.type,s.enabled,s.variant]),[['schedule_periods',false,'compact'],['schedule_matches',false,'compact']]);
 assert.equal(old.pages.find(p=>p.id==='jadwal').sections[0].type,'content');
 assert.deepEqual(normalizeLegacyPortalConfig(normalized),normalized);
});
test('features and native anchors respect parent and independent flags',()=>{
 const config=structuredClone(defaultPortalConfig);config.features.find(f=>f.id==='schedule_matches').public_enabled=false;
 assert.equal(localFeature(config,'schedule_periods'),true);assert.equal(localFeature(config,'schedule_matches'),false);
 assert.equal(portalTarget(config,'/jadwal#rincian-pertandingan'),null);
 assert.equal(portalTarget(config,'/jadwal#rentang-jadwal'),'/jadwal#rentang-jadwal');
 config.modules.find(m=>m.id==='jadwal').public_enabled=false;assert.equal(localFeature(config,'schedule_periods'),false);
});
