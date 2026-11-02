'use client';
import {useEffect,useState} from 'react';
import {PublicDataTable,type PublicTableColumn} from './PublicDataTable';
import {publicApiUrl} from '@/lib/public-api';
import {usePortalConfig} from './PortalProvider';
import {localModule} from '@/lib/portal-config';

export type DownloadDocument={id:string;title:string;description:string;original_name:string;mime_type:string;file_bytes:number;created_at:string;updated_at:string;is_pinned:boolean};
type Page={data:DownloadDocument[];page:number;total:number;total_pages:number};
type Sort='created_at'|'title'|'file_bytes';
const button='inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 font-bold text-slate-800 transition hover:border-primary-500 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-primary-300';
const formatSize=(value:number)=>`${(value/1048576).toLocaleString('id-ID',{maximumFractionDigits:2})} MiB`;

export function DocumentDownloads(){
 const config=usePortalConfig();const enabled=!!config&&localModule(config,'downloads');
 const [result,setResult]=useState<{key:string;data:Page;error:string}|null>(null);const [search,setSearch]=useState('');const [query,setQuery]=useState('');const [page,setPage]=useState(1);const [limit,setLimit]=useState(10);const [sort,setSort]=useState<Sort>('created_at');const [order,setOrder]=useState<'asc'|'desc'>('desc');
 const [selection,setSelection]=useState<{key:string;ids:Set<string>}>({key:'',ids:new Set()});const [refresh,setRefresh]=useState(0);
 const requestKey=JSON.stringify([enabled,query,page,limit,sort,order,refresh]);
 const data=result?.key===requestKey?result.data:{data:[],page,total:0,total_pages:0};
 const error=result?.key===requestKey?result.error:'';const loading=enabled&&result?.key!==requestKey;
 const selected=selection.key===requestKey?selection.ids:new Set<string>();
 const setSelected=(ids:Set<string>)=>setSelection({key:requestKey,ids});
 useEffect(()=>{const timer=setTimeout(()=>setQuery(search.trim()),350);return()=>clearTimeout(timer)},[search]);
 useEffect(()=>{
  if(!enabled)return;const controller=new AbortController();
  const params=new URLSearchParams({q:query,page:String(page),per_page:String(limit),sort,order});
  void fetch(publicApiUrl(`/documents/public?${params}`),{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();const next=await response.json() as Page;if(!controller.signal.aborted){setResult({key:requestKey,data:next,error:''});if(page>1&&next.total_pages<page)setPage(Math.max(1,next.total_pages))}}).catch(()=>{if(!controller.signal.aborted)setResult({key:requestKey,data:{data:[],page,total:0,total_pages:0},error:'Daftar unduhan belum tersedia. Silakan coba lagi.'})});
  return()=>controller.abort();
 },[enabled,query,page,limit,sort,order,requestKey]);
 const chosen=data.data.filter(item=>selected.has(item.id));const selectedBytes=chosen.reduce((sum,item)=>sum+item.file_bytes,0);
 const columns:PublicTableColumn<DownloadDocument,Sort>[]=[
  {key:'title',label:'Dokumen',sortKey:'title',render:item=><div className="max-w-lg"><p className="font-black text-slate-950 dark:text-white">{item.title}{item.is_pinned&&<span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-200">Disematkan</span>}</p><p className="mt-2 whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300">{item.description}</p></div>},
  {key:'type',label:'Jenis',render:item=><span>{item.mime_type==='application/pdf'?'PDF':item.original_name.split('.').pop()?.toUpperCase()}</span>},
  {key:'size',label:'Ukuran',sortKey:'file_bytes',render:item=>formatSize(item.file_bytes)},
  {key:'date',label:'Ditambahkan',sortKey:'created_at',render:item=><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</time>},
 ];
 if(!enabled)return <p role="status" className="p-6">Unduhan tidak ditampilkan pada portal ini.</p>;
 return <section aria-labelledby="downloads-title" className="space-y-5">
 <div><h2 id="downloads-title" className="text-2xl font-black">Dokumen resmi</h2><p className="mt-2 text-slate-600 dark:text-slate-300">Cari dan unduh dokumen yang telah ditayangkan pengelola. Pilih maksimal 10 dokumen dengan total 100 MiB untuk unduhan ZIP.</p></div>
 <div className="flex flex-wrap items-center gap-4"><label className="w-full sm:flex-1"><span className="sr-only">Cari dokumen</span><input type="search" value={search} maxLength={80} onChange={event=>{setSearch(event.target.value);setPage(1)}} placeholder="Cari judul atau nama berkas" className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-4 text-slate-950 focus:outline-2 focus:outline-primary-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"/></label>
 <label className="flex min-h-11 items-center gap-2 text-sm">Tampilkan<select value={limit} onChange={event=>{setLimit(Number(event.target.value));setPage(1)}} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white">{[10,25,50,100].map(value=><option key={value} value={value}>{value}</option>)}</select>baris</label><button type="button" className={button} onClick={()=>setRefresh(value=>value+1)} disabled={loading}>Perbarui</button></div>
 {selected.size>0&&<div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100"><span>{selected.size} dokumen dipilih · {formatSize(selectedBytes)}</span>{selectedBytes<=100*1048576?<a href={publicApiUrl(`/documents/public/bundle?${new URLSearchParams({ids:[...selected].join(',')})}`)} download className={button}><i className="ri-download-2-line" aria-hidden="true"/>Unduh pilihan (ZIP)</a>:<span role="alert">Total melebihi 100 MiB. Kurangi pilihan.</span>}<button type="button" className={button} onClick={()=>setSelected(new Set())}>Batalkan pilihan</button></div>}
 {loading?<p role="status" className="rounded-2xl border border-slate-300 p-8 dark:border-slate-700">Memuat dokumen…</p>:error?<div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"><p>{error}</p><button type="button" className={`${button} mt-4`} onClick={()=>setRefresh(value=>value+1)}>Coba lagi</button></div>:!data.data.length?<div role="status" className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700"><h3 className="font-black">{query?'Dokumen tidak ditemukan':'Belum ada dokumen yang ditayangkan'}</h3><p className="mt-2 text-slate-600 dark:text-slate-300">{query?'Coba kata pencarian lain.':'Dokumen akan tersedia setelah dipublikasikan oleh pengelola.'}</p></div>:<PublicDataTable caption="Daftar dokumen yang dapat diunduh" rows={data.data} columns={columns} id={item=>item.id} label={item=>item.title} sort={sort} order={order} onSort={key=>{setSort(key);setOrder(previous=>sort===key&&previous==='asc'?'desc':'asc');setPage(1)}} selected={selected} onSelect={setSelected} rowActions={item=><a className={button} href={publicApiUrl(`/documents/public/${item.id}/download`)} download aria-label={`Unduh ${item.title}`}><i className="ri-download-2-line" aria-hidden="true"/>Unduh</a>}/>}
 {!loading&&!error&&data.total>0&&<nav aria-label="Halaman unduhan" className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600 dark:text-slate-300">Menampilkan {(page-1)*limit+1}–{Math.min(page*limit,data.total)} dari {data.total.toLocaleString('id-ID')} dokumen</p><div className="flex flex-wrap items-center gap-2"><button type="button" className={button} disabled={page<=1} onClick={()=>setPage(1)}>Pertama</button><button type="button" className={button} disabled={page<=1} onClick={()=>setPage(value=>value-1)}>Sebelumnya</button><span className="px-2 text-sm" aria-live="polite">{page} / {data.total_pages}</span><button type="button" className={button} disabled={page>=data.total_pages} onClick={()=>setPage(value=>value+1)}>Berikutnya</button><button type="button" className={button} disabled={page>=data.total_pages} onClick={()=>setPage(data.total_pages)}>Terakhir</button></div></nav>}
 </section>;
}

export function PinnedDocumentButton(){
 const config=usePortalConfig();const enabled=!!config&&localModule(config,'downloads');const [item,setItem]=useState<DownloadDocument|null>(null);
 useEffect(()=>{if(!enabled)return;const controller=new AbortController();const load=()=>{if(document.visibilityState==='hidden')return;void fetch(publicApiUrl('/documents/public/pinned'),{cache:'no-store',signal:controller.signal}).then(async response=>{const result=response.ok?await response.json() as {data:DownloadDocument|null}:null;if(!controller.signal.aborted)setItem(result?.data??null)}).catch(()=>{if(!controller.signal.aborted)setItem(null)})};load();const timer=setInterval(load,30000);return()=>{controller.abort();clearInterval(timer)}},[enabled]);
 if(!enabled||!item)return null;
 return <a className={`${button} max-w-full border-primary-500 text-primary-700 dark:text-primary-300`} href={publicApiUrl(`/documents/public/${item.id}/download`)} download><i className="ri-file-download-line text-lg" aria-hidden="true"/><span className="break-words text-left">Unduh {item.title}</span></a>;
}
