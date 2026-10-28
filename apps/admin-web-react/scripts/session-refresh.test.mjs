import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import { JSDOM } from 'jsdom';

// TEST: Run the actual provider, modal, focus hook and draft sanitizer in a DOM; all network/storage are isolated mocks.
const dom = new JSDOM('<div id="root"></div>', { url: 'https://admin.example.test/admin/master-data', pretendToBeVisual: true });
for (const key of ['window','document','Node','HTMLElement','HTMLInputElement','Event','KeyboardEvent','File','Blob','MutationObserver']) Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const harness={auth:null,requests:[],drafts:new Map(),draftReads:0,saves:[],submissions:0};
globalThis.__porprovSessionTest=harness;
const sourceRoot=new URL('../src/',import.meta.url).href;
const mocks={
  oidc:'export const useAuth=()=>globalThis.__porprovSessionTest.auth;',
  api:`export const authConfig=t=>({headers:{Authorization:'Bearer '+t}});export const getApiErrorMessage=()=> 'Pemeriksaan belum tersedia';
  export const apiClient={get:(url,config)=>{const h=globalThis.__porprovSessionTest;if(url.startsWith('/drafts?')){h.draftReads++;return Promise.resolve({status:204,data:''})}return new Promise((resolve,reject)=>h.requests.push({resolve,reject,config}))},put:async(url,body,config)=>{const h=globalThis.__porprovSessionTest;h.saves.push({body,config});return {data:{...body,version:body.expected_version+1,updated_at:new Date().toISOString(),expires_at:new Date(Date.now()+10000).toISOString()}}},delete:async()=>({})};`,
  storage:`export const readFormDraft=async k=>globalThis.__porprovSessionTest.drafts.get(k)||null;export const saveFormDraft=async(k,p)=>{const v={key:k,version:1,payload:p,savedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+10000).toISOString()};globalThis.__porprovSessionTest.drafts.set(k,v);return v};export const deleteFormDraft=async k=>globalThis.__porprovSessionTest.drafts.delete(k);`,
};
registerHooks({
  resolve(specifier,context,next){
    if(context.parentURL?.startsWith(sourceRoot)){
      if(specifier==='react-oidc-context')return {url:'porprov-test:oidc',shortCircuit:true};
      if(specifier.startsWith('.')){
        let url=new URL(specifier,context.parentURL).href;
        if(/\/lib\/api(?:\.ts)?$/.test(url))return {url:'porprov-test:api',shortCircuit:true};
        if(/\/lib\/formDraftStorage(?:\.ts)?$/.test(url))return {url:'porprov-test:storage',shortCircuit:true};
        for(const extension of ['.ts','.tsx'])if(existsSync(fileURLToPath(url+extension)))return next(url+extension,context);
      }
    }
    return next(specifier,context);
  },
  load(url,context,next){
    if(url.startsWith('porprov-test:'))return {format:'module',source:mocks[url.split(':')[1]],shortCircuit:true};
    if(url.startsWith(sourceRoot)&&/\.tsx?$/.test(url))return {format:'module',source:ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2023}}).outputText,shortCircuit:true};
    return next(url,context);
  },
});
const React=await import('react');const {act}=React;
const {createRoot}=await import('react-dom/client');
const {AuthorizationProvider}=await import('../src/contexts/AuthorizationContext.tsx');
const {useAuthorization}=await import('../src/contexts/authorization.ts');
const {default:ModalForm}=await import('../src/components/common/ModalForm.tsx');
const h=React.createElement;
const fixtureToken=['test','token','a'].join('-');
const auth=(token=fixtureToken,subject='actor-a',extra={})=>({user:{access_token:token,profile:{sub:subject}},settings:{authority:'https://sso.example.test'},isLoading:false,...extra});
function Editor(){
  const [name,setName]=React.useState('');
  return h(ModalForm,{isOpen:true,onClose:()=>{},title:'Fixture form',onSubmit:e=>{e.preventDefault();harness.submissions++},submitting:false,submitText:'Simpan',draft:{entityId:'fixture:new',value:{name,api_token:'fixture'},onRestore:v=>setName(v.name)}},h('label',{},'Nama',h('input',{'aria-label':'Nama',value:name,onChange:e=>setName(e.target.value)})));
}
function Gate(){const access=useAuthorization();if(access.loading)return h('p',{},'Checking');if(!access.hasPermission('master_data.view'))return h('p',{'data-denied':true},'Denied');return h(Editor)}
let root;
async function render(next){harness.auth=next;await act(async()=>{root.render(h(AuthorizationProvider,{},h(Gate)))});}
async function answer(request,permissions=['master_data.view'],active=true){await act(async()=>request.resolve({data:{active,username:'operator',permissions}}));}
async function begin(){
  document.body.innerHTML='<div id="root"></div>';harness.requests=[];harness.drafts.clear();harness.saves=[];harness.draftReads=0;harness.submissions=0;
  root=createRoot(document.getElementById('root'));await render(auth());await answer(harness.requests.at(-1));await act(async()=>new Promise(resolve=>setTimeout(resolve,25)));
}
async function type(value){const input=document.querySelector('input[aria-label="Nama"]');await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}))});assert.equal(input.value,value);return input;}
async function finish(){await act(async()=>root.unmount());}

test('renewed tokens preserve the same portal form, text, focus/caret and draft baseline across cycles',async()=>{
  await begin();try{
    const input=await type('Bola Basket Putri');input.focus();input.setSelectionRange(5,5);
    await act(async()=>new Promise(resolve=>setTimeout(resolve,850)));
    assert.equal(harness.saves.length,1);assert.deepEqual(harness.saves[0].body.payload,{name:'Bola Basket Putri'});
    const reads=harness.draftReads;
    for(const token of ['test-token-b','test-token-c']){
      await render(auth(token));assert.equal(document.querySelector('input[aria-label="Nama"]'),input);assert.equal(document.activeElement,input);assert.equal(input.selectionStart,5);
      assert.equal(document.querySelector('button[type="submit"]').disabled,true);
      const event=new Event('submit',{bubbles:true,cancelable:true});document.querySelector('form').dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(harness.submissions,0);
      await answer(harness.requests.at(-1));assert.equal(document.querySelector('input[aria-label="Nama"]'),input);assert.equal(input.value,'Bola Basket Putri');assert.equal(input.selectionStart,5);
    }
    assert.equal(harness.draftReads,reads);
    await type('Bola Basket Putri U-18');await act(async()=>new Promise(resolve=>setTimeout(resolve,850)));
    assert.equal(harness.saves.at(-1).body.expected_version,1);assert.deepEqual(harness.saves.at(-1).body.payload,{name:'Bola Basket Putri U-18'});
  }finally{await finish()}
});
test('network failure preserves the blocked form and retry restores it; revoked permission is denied',async()=>{
  await begin();try{
    const input=await type('Belum disimpan');await render(auth('test-token-b'));
    await act(async()=>harness.requests.at(-1).reject(new Error('offline')));assert.equal(document.querySelector('input[aria-label="Nama"]'),input);assert.ok(document.querySelector('[role="alertdialog"]'));
    const retry=[...document.querySelectorAll('button')].find(button=>button.textContent==='Coba lagi');await act(async()=>retry.click());await answer(harness.requests.at(-1));assert.equal(input.value,'Belum disimpan');
    await render(auth('test-token-c'));await answer(harness.requests.at(-1),[]);assert.ok(document.querySelector('[data-denied]'));assert.equal(document.querySelector('form'),null);
    assert.equal([...harness.drafts.values()].at(-1).payload.name,'Belum disimpan');
  }finally{await finish()}
});
test('actor change and stale responses cannot expose or reinstate another user session',async()=>{
  await begin();try{
    await type('Private actor A');await render(auth('test-token-b'));const stale=harness.requests.at(-1);
    await render(auth('test-token-other','actor-b'));assert.equal(document.querySelector('form'),null);await answer(harness.requests.at(-1),[]);
    await answer(stale);assert.ok(document.querySelector('[data-denied]'));assert.equal(document.querySelector('form'),null);
  }finally{await finish()}
});
test('HTTP 403 and inactive accounts fail closed and an explicit silent navigator retains the form',async()=>{
  await begin();try{
    const input=await type('Tetap di form');await render(auth('test-token-a','actor-a',{isLoading:true,activeNavigator:'signinSilent'}));assert.equal(document.querySelector('input[aria-label="Nama"]'),input);assert.ok(document.querySelector('[role="status"]'));
    await render(auth('test-token-b'));await act(async()=>harness.requests.at(-1).reject({response:{status:403}}));assert.ok(document.querySelector('[data-denied]'));assert.equal(document.querySelector('form'),null);
    await render(auth('test-token-c'));await answer(harness.requests.at(-1),['master_data.view'],false);assert.ok(document.querySelector('[data-denied]'));
  }finally{await finish()}
});
