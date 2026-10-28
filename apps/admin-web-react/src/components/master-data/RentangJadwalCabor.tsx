import {useEffect, useState, type FormEvent} from 'react';
import {useAuth} from 'react-oidc-context';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {ArchiveRestore, History, Pencil, Plus, Trash2} from 'lucide-react';
import {apiClient, authConfig, getApiErrorMessage} from '../../lib/api';
import {useAuthorization} from '../../contexts/authorization';
import {useDebouncedValue} from '../../hooks/useDebouncedValue';
import {useTableControls} from '../../hooks/useTableControls';
import {AdminDataTable, type AdminDataTableColumn} from '../cuba/AdminDataTable';
import {AdminAlert, AdminPageHeader} from '../cuba/AdminPrimitives';
import {RowsPerPageSelector, TablePagination} from '../common/TableControls';
import {SelectInput, TextArea, TextInput} from '../common/FormInputs';
import ModalForm from '../common/ModalForm';
import Modal from '../Modal';
import {formatSchedulePeriod, type ManagedSchedulePeriod as Period, type PeriodPage} from '../../../../../packages/portal-config/schedule-period';

type Edit = {id: string; cabor_id: string; label: string; starts_on: string; ends_on: string; notes: string; is_published: boolean; expected_version: number; reason: string};
type Revision = {id: string; version: number; action: string; snapshot: Period; actor_username: string; reason: string; created_at: string};
type Operation = {kind: 'archive'|'restore'|'revision'; rows: Period[]; revisionID?: string};
type SortKey = 'cabor_name'|'label'|'starts_on'|'ends_on'|'is_published';
const emptyForm = (): Edit => ({id:'', cabor_id:'', label:'', starts_on:'', ends_on:'', notes:'', is_published:false, expected_version:0, reason:''});
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800';
const actionNames: Record<string,string> = {CREATE:'Ditambahkan',UPDATE:'Diubah',ARCHIVE:'Diarsipkan',RESTORE:'Dipulihkan sebagai draf',RESTORE_REVISION:'Dipulihkan dari riwayat'};
const fields = {cabor_name:'Cabang olahraga',label:'Nama khusus',starts_on:'Tanggal mulai',ends_on:'Tanggal selesai',notes:'Keterangan',is_published:'Status tayang'} as const;

function historyValue(key: keyof typeof fields, value: unknown) {
  if (typeof value === 'boolean') return value ? 'Ditampilkan' : 'Draf';
  if ((key === 'starts_on' || key === 'ends_on') && typeof value === 'string') return formatSchedulePeriod(value, value);
  return String(value ?? '') || 'Kosong';
}

export default function RentangJadwalCabor() {
  const auth = useAuth(); const access = useAuthorization(); const cache = useQueryClient();
  const canCreate = access.hasPermission('master_data.create'); const canUpdate = access.hasPermission('master_data.update');
  const canArchive = access.hasPermission('master_data.archive'); const canRestore = access.hasPermission('master_data.restore');
  const [search,setSearch] = useState(''); const queryText = useDebouncedValue(search);
  const [archived,setArchived] = useState(false); const [selected,setSelected] = useState<Set<string>>(new Set());
  const [edit,setEdit] = useState<Edit|null>(null); const [operation,setOperation] = useState<Operation|null>(null);
  const [reason,setReason] = useState(''); const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [notice,setNotice] = useState('');
  const [historyTarget,setHistoryTarget] = useState<Period|null>(null); const [historyPage,setHistoryPage] = useState(1); const [compared,setCompared] = useState<string[]>([]);
  const table = useTableControls<SortKey>({sortKey:'starts_on',rowsPerPage:10});
  const list = useQuery({
    queryKey:['schedule-periods-admin',queryText,archived,table.currentPage,table.rowsPerPage,table.sortKey,table.sortDirection],
    queryFn:async ({signal}) => (await apiClient.get<PeriodPage<Period>>('/schedule/periods/manage', {...authConfig(auth.user?.access_token), signal, params:{q:queryText,archived,page:table.currentPage,per_page:table.rowsPerPage,sort:table.sortKey,direction:table.sortDirection}})).data,
  });
  const references = useQuery({queryKey:['schedule-period-cabors'],queryFn:async ({signal}) => (await apiClient.get<Array<{id:string; name:string}>>('/portal/references/cabors', {...authConfig(auth.user?.access_token), signal})).data,enabled:!!edit});
  const history = useQuery({queryKey:['schedule-period-history',historyTarget?.id,historyPage],enabled:!!historyTarget,queryFn:async ({signal}) => (await apiClient.get<PeriodPage<Revision>>(`/schedule/periods/${historyTarget!.id}/history`, {...authConfig(auth.user?.access_token),signal,params:{page:historyPage}})).data});
  const refresh = () => Promise.all([cache.invalidateQueries({queryKey:['schedule-periods-admin']}),cache.invalidateQueries({queryKey:['schedule-period-history']})]);
  const rows = list.data?.data || []; const total = list.data?.total || 0; const pages = Math.max(1,Math.ceil(total/table.rowsPerPage));
  const {currentPage,setCurrentPage} = table;
  // RELIABILITY: Archiving the last row of a page must return to a valid server page.
  useEffect(()=>{
    if (list.data && currentPage > pages) {setCurrentPage(pages);setSelected(new Set());}
  },[list.data,currentPage,pages,setCurrentPage]);
  const resetSelection = () => {setSelected(new Set());table.setCurrentPage(1);};
  const openForm = (row?: Period) => {setError('');setEdit(row ? {id:row.id,cabor_id:row.cabor_id,label:row.label,starts_on:row.starts_on,ends_on:row.ends_on,notes:row.notes,is_published:row.is_published,expected_version:row.version,reason:''} : emptyForm());};
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!edit) return;
    if (edit.ends_on < edit.starts_on) {setError('Tanggal selesai tidak boleh sebelum tanggal mulai.');return;}
    setBusy(true);setError('');
    try {
      const {id,...payload} = edit;
      if (id) await apiClient.put(`/schedule/periods/${id}`,payload,authConfig(auth.user?.access_token));
      else await apiClient.post('/schedule/periods',payload,authConfig(auth.user?.access_token));
      setEdit(null);setNotice(edit.is_published?'Rentang jadwal tersimpan dan ditampilkan pada Web Publik.':'Rentang jadwal tersimpan sebagai draf.');await refresh();
    } catch (cause) {setError(getApiErrorMessage(cause,'Rentang belum tersimpan. Jika ada perubahan dari sesi lain, pertahankan draf dan muat versi terbaru.'));}
    finally {setBusy(false);}
  };
  const runOperation = async (event: FormEvent) => {
    event.preventDefault();if (!operation) return;setBusy(true);setError('');const completed = new Set<string>();
    try {
      for (const row of operation.rows) {
        const payload = {expected_version:row.version,reason,...(operation.revisionID?{revision_id:operation.revisionID}:{})};
        const response = operation.kind==='archive'
          ? await apiClient.delete<Period>(`/schedule/periods/${row.id}`,{...authConfig(auth.user?.access_token),data:payload})
          : await apiClient.post<Period>(`/schedule/periods/${row.id}/${operation.kind==='restore'?'restore':'restore-revision'}`,payload,authConfig(auth.user?.access_token));
        completed.add(row.id);if (historyTarget?.id===row.id) setHistoryTarget(response.data);
      }
      setNotice(operation.kind==='archive'?`${completed.size} rentang jadwal diarsipkan dan dapat dipulihkan.`:operation.kind==='restore'?`${completed.size} rentang dipulihkan sebagai draf. Periksa sebelum menayangkannya.`:'Riwayat dipulihkan sebagai perubahan baru.');setOperation(null);
    } catch (cause) {
      setOperation({...operation,rows:operation.rows.filter(row=>!completed.has(row.id))});
      setError(`${completed.size} dari ${operation.rows.length} rentang diproses. ${getApiErrorMessage(cause,'Periksa versi atau status terbaru sebelum mencoba kembali.')}`);
    } finally {setSelected(new Set());setBusy(false);await refresh();}
  };
  const beginOperation = (kind: Operation['kind'],items: Period[],revisionID?: string) => {setError('');setReason('');setOperation({kind,rows:items,revisionID});};
  const columns: Array<AdminDataTableColumn<Period,SortKey>> = [
    {key:'cabor',label:'Cabang olahraga',sortKey:'cabor_name',render:row=><div><strong>{row.cabor_name}</strong>{row.label&&<p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.label}</p>}</div>},
    {key:'start',label:'Tanggal mulai',sortKey:'starts_on',render:row=>formatSchedulePeriod(row.starts_on,row.starts_on)},
    {key:'end',label:'Tanggal selesai',sortKey:'ends_on',render:row=>formatSchedulePeriod(row.ends_on,row.ends_on)},
    {key:'published',label:'Status',sortKey:'is_published',render:row=><span className={row.is_published?'font-bold text-emerald-700 dark:text-emerald-300':'text-slate-600 dark:text-slate-300'}>{row.archived?'Diarsipkan':row.is_published?'Ditampilkan':'Draf'}</span>},
  ];
  const revisions = history.data?.data || []; const pair = revisions.filter(row=>compared.includes(row.id)).sort((a,b)=>a.version-b.version);
  return <div className="space-y-5">
    <AdminPageHeader title="Rentang Jadwal Cabang Olahraga" description="Catat masa pelaksanaan setiap cabang olahraga, termasuk kategori khusus seperti Sepakbola Putri. Tanggal mulai dan selesai ikut dihitung." actions={canCreate&&!archived?<button type="button" className={button} onClick={()=>openForm()}><Plus className="size-4"/>Tambah rentang</button>:undefined}/>
    {notice&&<AdminAlert tone="success">{notice}</AdminAlert>}{error&&!edit&&!operation&&<AdminAlert>{error}</AdminAlert>}
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-end gap-4 p-4">
        <div className="min-w-48 flex-1"><TextInput label="Cari rentang jadwal" value={search} maxLength={80} placeholder="Cabang olahraga atau nama khusus" onChange={event=>{setSearch(event.target.value);resetSelection();}}/></div>
        <SelectInput label="Daftar yang ditampilkan" value={String(archived)} options={[{value:'false',label:'Rentang aktif'},...(canRestore?[{value:'true',label:'Arsip rentang'}]:[])]} onChange={event=>{setArchived(event.target.value==='true');resetSelection();}}/>
        <RowsPerPageSelector value={table.rowsPerPage} onChange={value=>{table.setRowsPerPage(value);resetSelection();}}/>
      </div>
      {selected.size>0&&<div className="flex flex-wrap items-center gap-3 border-y border-slate-200 p-4 dark:border-slate-700"><span>{selected.size} rentang dipilih</span><button className={button} onClick={()=>beginOperation(archived?'restore':'archive',rows.filter(row=>selected.has(row.id)))}>{archived?'Pulihkan pilihan':'Arsipkan pilihan'}</button><button className={button} onClick={()=>setSelected(new Set())}>Batalkan pilihan</button></div>}
      <AdminDataTable<Period,SortKey> caption="Rentang pelaksanaan per cabang olahraga" rows={rows} columns={columns} getRowId={row=>row.id} getRowLabel={row=>row.label||row.cabor_name} sortKey={table.sortKey} sortDirection={table.sortDirection} onSort={key=>{table.handleSort(key);resetSelection();}} selectedIds={selected} onSelectedIdsChange={setSelected} selectionEnabled={archived?canRestore:canArchive} loading={list.isPending} error={list.isError?getApiErrorMessage(list.error,'Rentang jadwal belum dapat dimuat.'):''} onRetry={()=>void list.refetch()} emptyTitle={archived?'Belum ada rentang diarsipkan':'Belum ada rentang jadwal'} emptyDescription="Tambahkan rentang pelaksanaan, lalu aktifkan penayangannya untuk Web Publik." rowActions={row=><div className="flex gap-1">{canUpdate&&!archived&&<button className={button} aria-label={`Ubah ${row.label||row.cabor_name}`} onClick={()=>openForm(row)}><Pencil className="size-4"/></button>}<button className={button} aria-label={`Riwayat ${row.label||row.cabor_name}`} onClick={()=>{setHistoryTarget(row);setHistoryPage(1);setCompared([]);}}><History className="size-4"/></button>{canArchive&&!archived&&<button className={button} aria-label={`Arsipkan ${row.label||row.cabor_name}`} onClick={()=>beginOperation('archive',[row])}><Trash2 className="size-4"/></button>}{canRestore&&archived&&<button className={button} aria-label={`Pulihkan ${row.label||row.cabor_name}`} onClick={()=>beginOperation('restore',[row])}><ArchiveRestore className="size-4"/></button>}</div>}/>
      <TablePagination startItem={total?(table.currentPage-1)*table.rowsPerPage+1:0} endItem={Math.min(table.currentPage*table.rowsPerPage,total)} totalItems={total} currentPage={table.currentPage} totalPages={pages} onPageChange={value=>{table.setCurrentPage(value);setSelected(new Set());}} itemLabel="rentang jadwal"/>
    </div>
    <ModalForm isOpen={!!edit} onClose={()=>{setEdit(null);setError('');}} title={edit?.id?'Ubah Rentang Jadwal':'Tambah Rentang Jadwal'} onSubmit={event=>void save(event)} submitting={busy} submitText="Simpan rentang jadwal" size="large" draft={edit?{entityId:edit.id||'new-schedule-period',version:'schedule-period-v1',value:edit,onRestore:setEdit}:undefined}>
      {edit&&<div className="space-y-4">{error&&<AdminAlert>{error}</AdminAlert>}{references.isError&&<AdminAlert>Referensi cabang olahraga belum tersedia. <button type="button" onClick={()=>void references.refetch()}>Muat ulang referensi</button></AdminAlert>}
        <SelectInput label="Cabang olahraga" required value={edit.cabor_id} disabled={references.isPending} options={(references.data||[]).map(row=>({value:row.id,label:row.name}))} onChange={event=>setEdit({...edit,cabor_id:event.target.value})}/>
        <TextInput label="Nama khusus (opsional)" value={edit.label} maxLength={120} placeholder="Contoh: Sepakbola Putri" helpText="Kosongkan untuk menggunakan nama cabang olahraga. Satu cabang dapat memiliki beberapa kategori atau rentang." onChange={event=>setEdit({...edit,label:event.target.value})}/>
        <div className="grid gap-4 sm:grid-cols-2"><TextInput label="Tanggal mulai" type="date" required min="2000-01-01" max="2100-12-31" value={edit.starts_on} onChange={event=>setEdit({...edit,starts_on:event.target.value})}/><TextInput label="Tanggal selesai" type="date" required min={edit.starts_on||'2000-01-01'} max="2100-12-31" value={edit.ends_on} onChange={event=>setEdit({...edit,ends_on:event.target.value})}/></div>
        {edit.starts_on&&edit.ends_on&&<p className="rounded-xl bg-blue-50 p-4 font-bold text-blue-900 dark:bg-blue-950/50 dark:text-blue-100">{formatSchedulePeriod(edit.starts_on,edit.ends_on)}</p>}
        <TextArea label="Keterangan untuk pengunjung (opsional)" value={edit.notes} maxLength={1000} rows={3} onChange={event=>setEdit({...edit,notes:event.target.value})}/>
        <label className="flex min-h-11 items-center gap-3 text-sm font-bold"><input type="checkbox" className="size-5 accent-blue-600" checked={edit.is_published} onChange={event=>setEdit({...edit,is_published:event.target.checked})}/>Tampilkan pada halaman Jadwal Web Publik</label>
        <TextArea label="Alasan perubahan" value={edit.reason} required minLength={5} maxLength={500} onChange={event=>setEdit({...edit,reason:event.target.value})}/>
      </div>}
    </ModalForm>
    <ModalForm isOpen={!!operation} onClose={()=>{setOperation(null);setError('');}} title={operation?.kind==='archive'?'Arsipkan Rentang Jadwal':operation?.kind==='restore'?'Pulihkan Rentang sebagai Draf':'Pulihkan Riwayat sebagai Perubahan Baru'} onSubmit={event=>void runOperation(event)} submitting={busy} submitText="Konfirmasi perubahan">
      {error&&<AdminAlert>{error}</AdminAlert>}<p className="mb-4">{operation?.rows.length||0} rentang jadwal akan diproses. Pengarsipan mempertahankan data dan riwayatnya.</p><TextArea label="Alasan perubahan" required minLength={5} maxLength={500} value={reason} onChange={event=>setReason(event.target.value)}/>
    </ModalForm>
    <Modal isOpen={!!historyTarget&&!operation} onClose={()=>setHistoryTarget(null)} title={`Riwayat ${historyTarget?.label||historyTarget?.cabor_name||'rentang jadwal'}`} maxWidth="4xl">
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Pilih dua catatan untuk membandingkan. Pemulihan mencatat perubahan baru dengan versi terbaru sebagai acuan.</p>
      {history.isPending?<p role="status">Memuat riwayat...</p>:history.isError?<AdminAlert>{getApiErrorMessage(history.error,'Riwayat belum dapat dimuat.')} <button className={button} onClick={()=>void history.refetch()}>Coba lagi</button></AdminAlert>:<>
        <ol className="space-y-3">{revisions.map(row=><li key={row.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex flex-wrap items-start justify-between gap-3"><label className="flex min-h-11 items-center gap-3 font-bold"><input type="checkbox" className="size-5" checked={compared.includes(row.id)} disabled={compared.length===2&&!compared.includes(row.id)} onChange={event=>setCompared(event.target.checked?[...compared,row.id]:compared.filter(id=>id!==row.id))}/>Versi {row.version} · {actionNames[row.action]||'Perubahan tercatat'}</label>{canUpdate&&!historyTarget?.archived&&<button className={button} onClick={()=>beginOperation('revision',[historyTarget!],row.id)}>Pulihkan versi ini</button>}</div><p className="mt-2">{formatSchedulePeriod(row.snapshot.starts_on,row.snapshot.ends_on)} · {row.actor_username}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.reason} · {new Date(row.created_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}</p></li>)}</ol>
        {!revisions.length&&<p>Belum ada riwayat perubahan.</p>}
        {pair.length===2&&<section className="mt-5 rounded-xl bg-slate-100 p-4 dark:bg-slate-800"><h3 className="font-black">Perbandingan versi {pair[0].version} dan {pair[1].version}</h3>{Object.entries(fields).filter(([key])=>pair[0].snapshot[key as keyof typeof fields]!==pair[1].snapshot[key as keyof typeof fields]).map(([key,label])=><div key={key} className="mt-3 break-words"><strong>{label}</strong><p>Sebelumnya: {historyValue(key as keyof typeof fields,pair[0].snapshot[key as keyof typeof fields])}</p><p>Sesudahnya: {historyValue(key as keyof typeof fields,pair[1].snapshot[key as keyof typeof fields])}</p></div>)}</section>}
        <TablePagination startItem={history.data?.total?(historyPage-1)*20+1:0} endItem={Math.min(historyPage*20,history.data?.total||0)} totalItems={history.data?.total||0} currentPage={historyPage} totalPages={Math.max(1,Math.ceil((history.data?.total||0)/20))} onPageChange={page=>{setHistoryPage(page);setCompared([]);}} itemLabel="riwayat"/>
      </>}
    </Modal>
  </div>;
}
