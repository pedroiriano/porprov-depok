import assert from 'node:assert/strict';
import test from 'node:test';
import {registerHooks,createRequire} from 'node:module';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';

const publicRequire=createRequire(new URL('../../apps/public-web-nextjs/package.json',import.meta.url));
const adminRequire=createRequire(new URL('../../apps/admin-web-react/package.json',import.meta.url));
const ts=publicRequire('typescript');
const {JSDOM}=adminRequire('jsdom');
const sourceRoot=new URL('../../apps/public-web-nextjs/src/components/',import.meta.url).href;
const dom=new JSDOM('<div id="root"></div>',{url:'https://local.example.test/jadwal',pretendToBeVisual:true});
for(const key of ['window','document','Node','HTMLElement','Event','MutationObserver'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
dom.window.matchMedia=()=>({matches:true});
dom.window.HTMLElement.prototype.scrollIntoView=function(){};
// TEST: Execute real React components in an isolated DOM; CSS is stubbed, so these are interaction tests, not visual acceptance.
registerHooks({
  resolve(specifier,context,next){
    if(specifier.endsWith('.module.css'))return {url:'schedule-test:css',shortCircuit:true};
    if((context.parentURL||'').startsWith(sourceRoot)&&/^(react(?:\/.*)?|lucide-react)$/.test(specifier))return next(pathToFileURL(publicRequire.resolve(specifier)).href,context);
    if(specifier.startsWith('.')&&context.parentURL){
      const url=new URL(specifier,context.parentURL).href;
      if(url.startsWith(sourceRoot)||url.includes('/packages/portal-config/'))for(const extension of ['.ts','.tsx'])if(existsSync(fileURLToPath(url+extension)))return next(url+extension,context);
    }
    return next(specifier,context);
  },
  load(url,context,next){
    if(url==='schedule-test:css')return {format:'module',source:'export default new Proxy({},{get:(_,key)=>String(key)});',shortCircuit:true};
    if(url.startsWith(sourceRoot)&&/\.tsx?$/.test(url))return {format:'module',source:ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2023}}).outputText,shortCircuit:true};
    return next(url,context);
  },
});
const React=publicRequire('react');const {act}=React;const {createRoot}=publicRequire('react-dom/client');
const {ScheduleCalendarBoard,scheduleRowSegments,initialScheduleDay}=await import('../../apps/public-web-nextjs/src/components/ScheduleCalendarBoard.tsx');
const {ScheduleDayStrip}=await import('../../apps/public-web-nextjs/src/components/ScheduleDayStrip.tsx');
const {SchedulePeriodCard}=await import('../../apps/public-web-nextjs/src/components/SchedulePeriodCard.tsx');
const h=React.createElement;
async function render(element,run){const root=createRoot(document.getElementById('root'));try{await act(async()=>root.render(element));await run();}finally{await act(async()=>root.unmount());}}
const event={id:'one',title:'Putaran 1 Golf',startsOn:'2026-11-02',endsOn:'2026-11-05'};
test('matrix retains sub-cabor labels and complete counts; daily agenda opens detail or complete results',async()=>{
  let selected='',day='';
  await render(h(ScheduleCalendarBoard,{month:'2026-11',today:'2026-11-02',kind:'periods',rows:[{key:'golf-putri',title:'Golf',subtitle:'Putri',color:1,events:[event]}],dayCounts:{'2026-11-02':9},onSelect:id=>selected=id,onShowDay:value=>day=value}),async()=>{
    assert.equal(document.querySelectorAll('thead th').length,31);assert.equal(document.querySelector('tbody th').textContent.includes('Putri'),true);
    const cell=document.querySelector('tbody button');await act(async()=>cell.click());assert.equal(selected,'one');
    const total=[...document.querySelectorAll('thead button')].find(button=>button.getAttribute('aria-label')==='Agenda 2 Nov 2026, 9 jadwal Cabor');assert.ok(total);await act(async()=>total.click());assert.equal(day,'');
    assert.equal(document.querySelector('.dayAgenda').textContent.includes('9 jadwal Cabor'),true);
    const detail=document.querySelector('.agendaItem');await act(async()=>detail.click());assert.equal(selected,'one');
    await act(async()=>document.querySelector('.dayAgenda .action').click());assert.equal(day,'2026-11-02');
    assert.equal(document.querySelector('time[aria-current="date"]').getAttribute('datetime'),'2026-11-02');
  });
});

test('continuous ranges span dates once, preserve cross-month boundaries and never swallow overlapping events',()=>{
  const days=Array.from({length:7},(_,i)=>`2026-11-0${i+1}`);
  const range={...event,startsOn:'2026-10-31',endsOn:'2026-11-04'};
  const segments=scheduleRowSegments(days,[range]);
  assert.equal(segments[0].span,4);assert.equal(segments[0].events[0].startsOn,'2026-10-31');
  assert.equal(segments.reduce((sum,segment)=>sum+segment.span,0),7);
  const overlapping=scheduleRowSegments(days,[range,{...event,id:'two',startsOn:'2026-11-03',endsOn:'2026-11-05'}]);
  assert.equal(overlapping.find(segment=>segment.day==='2026-11-03').events.length,2);
  assert.equal(overlapping.find(segment=>segment.day==='2026-11-03').span,1);
});

test('initial daily agenda prefers today, then the nearest available date, without inventing missing data',()=>{
  const days=['2026-11-01','2026-11-02','2026-11-03','2026-11-04'];
  assert.equal(initialScheduleDay(days,'2026-11-02',{'2026-11-02':1,'2026-11-04':2}),'2026-11-02');
  assert.equal(initialScheduleDay(days,'2026-11-02',{'2026-11-01':1,'2026-11-04':2}),'2026-11-04');
  assert.equal(initialScheduleDay(days,'2026-11-02',{}),'2026-11-02');
});

test('range card exposes a keyboard button for full detail and renders notes as text',async()=>{
  let opened=false;
  await render(h(SchedulePeriodCard,{today:'2026-11-02',item:{id:'one',cabor_id:'golf',cabor_name:'Golf',label:'Putri',starts_on:'2026-10-31',ends_on:'2026-11-04',notes:'<script>not executable</script>'},onOpen:()=>opened=true}),async()=>{
    const button=document.querySelector('button');assert.equal(button.getAttribute('aria-label'),'Lihat detail jadwal Golf · Putri');
    await act(async()=>button.click());assert.equal(opened,true);assert.equal(document.querySelectorAll('script').length,0);
    assert.ok(document.querySelector('article').textContent.includes('5 hari berturut-turut'));
  });
});
test('multiple matches open complete day list rather than silently showing the first event',async()=>{
  let day='',selected='';
  await render(h(ScheduleCalendarBoard,{month:'2026-11',today:'2026-11-02',kind:'matches',rows:[{key:'golf',title:'Golf',color:0,events:[{...event,endsOn:event.startsOn},{...event,id:'two',endsOn:event.startsOn}]}],dayCounts:{'2026-11-02':5},onSelect:id=>selected=id,onShowDay:value=>day=value}),async()=>{
    await act(async()=>document.querySelector('tbody button').click());assert.equal(day,'2026-11-02');assert.equal(selected,'');
  });
});
test('day selector calls controlled date/month changes and preserves selected date across rendering',async()=>{
  let date='',month='';
  await render(h(ScheduleDayStrip,{month:'2026-11',date:'2026-11-02',today:'2026-11-02',label:'jadwal',onDate:value=>date=value,onMonth:value=>month=value}),async()=>{
    const selected=document.querySelector('button[aria-pressed="true"]');assert.ok(selected.getAttribute('aria-label').includes('2 November'));
    const third=[...document.querySelectorAll('button')].find(button=>button.getAttribute('aria-label')?.includes('3 November'));await act(async()=>third.click());assert.equal(date,'2026-11-03');
    const next=document.querySelector('[aria-label="Bulan berikutnya jadwal"]');await act(async()=>next.click());assert.equal(month,'2026-12');
  });
});

test('all six calendar color pairs meet AA text contrast in light and dark',()=>{
  const css=readFileSync(new URL('../../apps/public-web-nextjs/src/components/SchedulePresentation.module.css',import.meta.url),'utf8');
  const pairs=[...css.matchAll(/\.(?:blue|green|violet|amber|rose|cyan)\{background:(#[0-9a-f]{6})!important;color:(#[0-9a-f]{6})!important/g)];
  assert.equal(pairs.length,12);
  const luminance=hex=>{const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};
  for(const [,background,text] of pairs){const values=[luminance(background),luminance(text)].sort((a,b)=>b-a);assert.ok((values[0]+.05)/(values[1]+.05)>=4.5,`${text} on ${background}`);}
});
