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

test('private documents adapter preserves explicit disable and source JSON',()=>{
 const legacy=structuredClone(defaultPortalConfig);legacy.modules=legacy.modules.filter(m=>m.id!=='documents');
 const normalized=normalizeLegacyPortalConfig(legacy);
 assert.equal(normalized.modules.find(m=>m.id==='documents').public_enabled,false);
 assert.equal(normalized.modules.find(m=>m.id==='documents').admin_enabled,true);
 assert.equal(legacy.modules.some(m=>m.id==='documents'),false);
 normalized.modules.find(m=>m.id==='documents').admin_enabled=false;
 assert.equal(normalizeLegacyPortalConfig(normalized).modules.find(m=>m.id==='documents').admin_enabled,false);
});

test('public downloads adapter retains explicit module/menu choices',()=>{
 const old=structuredClone(defaultPortalConfig);old.modules=old.modules.filter(m=>m.id!=='downloads');old.pages=old.pages.filter(p=>p.id!=='downloads');old.menus=old.menus.filter(m=>m.id!=='header-downloads');
 const next=normalizeLegacyPortalConfig(old);assert.ok(next.modules.some(m=>m.id==='downloads'&&m.public_enabled));assert.ok(next.menus.some(m=>m.target==='/unduhan'));assert.ok(next.pages.some(p=>p.path==='/unduhan'));assert.equal(old.modules.some(m=>m.id==='downloads'),false);
 next.modules.find(m=>m.id==='downloads').public_enabled=false;next.menus=next.menus.filter(m=>m.id!=='header-downloads');
 const retained=normalizeLegacyPortalConfig(next);assert.equal(retained.modules.find(m=>m.id==='downloads').public_enabled,false);assert.equal(retained.menus.some(m=>m.id==='header-downloads'),false);
});
