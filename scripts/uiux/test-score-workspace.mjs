import assert from 'node:assert/strict';
import test from 'node:test';
import {registerHooks,createRequire} from 'node:module';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
const pr=createRequire(new URL('../../apps/public-web-nextjs/package.json',import.meta.url));
const ar=createRequire(new URL('../../apps/admin-web-react/package.json',import.meta.url));
const ts=pr('typescript');const {JSDOM}=ar('jsdom');
const dom=new JSDOM('<div id="root"></div>',{url:'https://local.example.test/livescore',pretendToBeVisual:true});
for(const key of ['window','document','Node','HTMLElement','Event','MutationObserver'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;dom.window.HTMLElement.prototype.scrollIntoView=function(){};
const roots=[new URL('../../apps/public-web-nextjs/src/components/',import.meta.url).href,new URL('../../apps/admin-web-react/src/',import.meta.url).href];
registerHooks({resolve(specifier,context,next){
  if(specifier.endsWith('.module.css'))return {url:'score-test:css',shortCircuit:true};
  if(roots.some(root=>(context.parentURL||'').startsWith(root))&&/^(react(?:\/.*)?|lucide-react)$/.test(specifier))return next(pathToFileURL(pr.resolve(specifier)).href,context);
  if(specifier.startsWith('.')&&context.parentURL){const url=new URL(specifier,context.parentURL).href;for(const extension of ['.ts','.tsx'])if(existsSync(fileURLToPath(url+extension)))return next(url+extension,context);}
  return next(specifier,context);
},load(url,context,next){
  if(url==='score-test:css')return {format:'module',source:'export default new Proxy({},{get:(_,key)=>String(key)});',shortCircuit:true};
  if(roots.some(root=>url.startsWith(root))&&/\.tsx?$/.test(url))return {format:'module',source:ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2023}}).outputText,shortCircuit:true};
  return next(url,context);
}});
const React=pr('react');const {act}=React;const {createRoot}=pr('react-dom/client');const h=React.createElement;
const {default:SearchableSelect}=await import('../../apps/admin-web-react/src/components/common/SearchableSelect.tsx');
const {escapeCsvCell}=await import('../../apps/admin-web-react/src/lib/csv.ts');
const {MatchResultList}=await import('../../apps/public-web-nextjs/src/components/MatchResultList.tsx');
const {ScheduleDayStrip}=await import('../../apps/public-web-nextjs/src/components/ScheduleDayStrip.tsx');
async function render(element,run){const root=createRoot(document.getElementById('root'));try{await act(async()=>root.render(element));await run();}finally{await act(async()=>root.unmount());}}

test('canonical searchable picker supports keyboard selection, Escape, focus return and outside dismissal',async()=>{
  const choices=[];await render(h(SearchableSelect,{options:[{value:'a',label:'Golf'},{value:'b',label:'Basket'}],value:'',onChange:value=>choices.push(value),ariaLabel:'Pertandingan'}),async()=>{
    const trigger=document.querySelector('button');await act(async()=>trigger.click());let input=document.querySelector('[role="combobox"]');assert.equal(document.activeElement,input);
    await act(async()=>input.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true})));assert.ok(input.getAttribute('aria-activedescendant'));
    await act(async()=>input.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));assert.deepEqual(choices,['a']);assert.equal(document.activeElement,trigger);assert.equal(document.querySelector('[role="listbox"]'),null);
    await act(async()=>trigger.click());input=document.querySelector('[role="combobox"]');await act(async()=>input.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.equal(document.querySelector('[role="listbox"]'),null);
    await act(async()=>trigger.click());await act(async()=>document.body.dispatchEvent(new dom.window.MouseEvent('mousedown',{bubbles:true})));assert.equal(document.querySelector('[role="listbox"]'),null);
  });
});

test('remote picker exposes paging without inventing local results',async()=>{
  let more=0;await render(h(SearchableSelect,{options:[],value:'',onChange:()=>{},onSearchChange:()=>{},hasMore:true,onLoadMore:()=>more++,emptyMessage:'Belum ada pertandingan tanpa skor.'}),async()=>{await act(async()=>document.querySelector('button').click());assert.match(document.body.textContent,/Belum ada pertandingan tanpa skor/);const next=[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Muat pilihan'));await act(async()=>next.click());assert.equal(more,1);});
});

test('compact result rows preserve both sides, affiliation, real zero, escaping and exact-match activation',async()=>{
  const match={id:'11111111-1111-4111-8111-111111111111',matchDate:'2026-11-03T08:00:00Z',caborName:'Basket',nomorTandingName:'Beregu',round:'Final',venueName:'GOR',participants:[{slot:2,participant_type:'team',team_name:'Tim B',kontingen_name:'Kota B',display_name:'Tim B'},{slot:1,participant_type:'team',team_name:'<img src=x>',kontingen_name:'Kota A',display_name:'<img src=x>'}]};let selected;
  await render(h(MatchResultList,{matches:[match],scores:{[match.id]:{matchId:match.id,scoreA:0,scoreB:2,status:'Official'}},onOpen:value=>selected=value}),async()=>{assert.equal(document.querySelector('img'),null);assert.match(document.body.textContent,/<img src=x>/);assert.match(document.body.textContent,/Kota A/);assert.match(document.body.textContent,/Resmi/);const button=document.querySelector('main button')||document.querySelector('button');assert.match(button.getAttribute('aria-label'),/<img src=x> 0 melawan Tim B 2/);await act(async()=>button.click());assert.equal(selected.id,match.id);});
});

test('selected score CSV neutralizes formulas and quotes while preserving numbers',()=>{
  for(const value of ['=1+1','+cmd','-2+3','@SUM(A1)','   =SUM(A1)','\t=cmd','\r\n@cmd','\uFEFF=1'])assert.equal(escapeCsvCell(value)[1],"'");
  assert.equal(escapeCsvCell(0),'"0"');assert.equal(escapeCsvCell('Tim "A"'),'"Tim ""A"""');assert.equal(escapeCsvCell('Kota Depok'),'"Kota Depok"');
});

test('compact results keep canonical day selection without duplicate month controls',async()=>{
  const calls=[];await render(h(ScheduleDayStrip,{month:'2026-11',date:'2026-11-03',today:'2026-11-03',onMonth:()=>{},onDate:value=>calls.push(value),label:'hasil pertandingan',compact:true}),async()=>{
    const buttons=[...document.querySelectorAll('button')];assert.equal(buttons.filter(button=>button.getAttribute('aria-pressed')==='true').length,1);assert.equal(buttons.some(button=>(button.getAttribute('aria-label')||'').includes('Bulan sebelumnya')),false);
    const fourth=buttons.find(button=>(button.getAttribute('aria-label')||'').includes('04 November'));await act(async()=>fourth.click());await act(async()=>buttons.find(button=>button.textContent.includes('Semua tanggal')).click());await act(async()=>buttons.find(button=>button.textContent.trim()==='Hari ini').click());assert.deepEqual(calls,['2026-11-04','','2026-11-03']);
  });
});
