import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, GitCompareArrows, History, RotateCcw } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../../lib/api';
import { AdminAlert, AdminEmptyState, AdminLoadingState } from '../cuba/AdminPrimitives';

interface AuditRevision {
  id: string;
  event_id: string;
  entity_name: string;
  entity_id: string;
  action: string;
  actor_id: string;
  payload: unknown;
  payload_hash: string;
  request_id?: string;
  created_at: string;
}

interface RevisionHistoryProps {
  entityName: string;
  displayName?: string;
  entityId?: string;
  onRestore: (payload: Record<string, unknown>) => void;
}

const revisionFieldLabels: Record<string, string> = {
  id: 'Nomor data', name: 'Nama', title: 'Judul', description: 'Deskripsi', status: 'Status', kategori: 'Kategori',
  technical_delegate: 'Delegasi teknis', total_medali: 'Jumlah medali', cabor_id: 'Cabang olahraga',
  gender_category: 'Kategori peserta', match_type: 'Tipe pertandingan', region_type: 'Jenis wilayah',
  address: 'Alamat', capacity: 'Kapasitas', facilities: 'Fasilitas', readiness_status: 'Kesiapan',
  contact_person: 'Narahubung', latitude: 'Lintang', longitude: 'Bujur', map_route_url: 'Alamat rute peta',
  match_date: 'Waktu pertandingan', venue_id: 'Lokasi pertandingan', round: 'Babak', participants: 'Peserta',
  highlight_text: 'Teks sorotan', body: 'Isi', is_active: 'Status aktif', image_url: 'Gambar',
  hero_image_url: 'Gambar utama', icon_url: 'Ikon', logo_url: 'Logo',
};
const revisionFieldLabel = (value: string) => revisionFieldLabels[value.toLocaleLowerCase('id-ID')] || value.replaceAll('_', ' ');

export default function RevisionHistory({ entityName, displayName = entityName, entityId, onRestore }: RevisionHistoryProps) {
  const auth = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const revisionsQuery = useQuery({
    queryKey: ['audit-revisions', entityName, entityId],
    enabled: expanded && Boolean(entityId),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ search: entityId || '', limit: '100' });
      const response = await apiClient.get<AuditRevision[]>(`/audit/logs?${params}`, { ...authConfig(auth.user?.access_token), signal });
      return unwrapApiData(response.data) ?? [];
    },
  });
  const revisions = useMemo(() => (revisionsQuery.data ?? []).filter((item) => (
    item.entity_id === entityId
    && item.entity_name.toLocaleLowerCase('id-ID') === entityName.toLocaleLowerCase('id-ID')
    && ['CREATE', 'UPDATE'].includes(item.action.toUpperCase())
    && item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)
  )), [entityId, entityName, revisionsQuery.data]);
  const selectedRevisions = useMemo(() => selectedIds.map((id) => revisions.find((item) => item.id === id)).filter(Boolean) as AuditRevision[], [revisions, selectedIds]);
  const comparison = useMemo(() => {
    if (selectedRevisions.length !== 2) return [];
    const [left, right] = selectedRevisions.map((item) => item.payload as Record<string, unknown>);
    return Array.from(new Set([...Object.keys(left), ...Object.keys(right)]))
      .filter((key) => !/(password|token|secret|credential|cookie|private.?key|file.?data)/i.test(key))
      .filter((key) => JSON.stringify(left[key]) !== JSON.stringify(right[key]))
      .map((key) => ({ key, left: left[key], right: right[key] }));
  }, [selectedRevisions]);

  const toggleSelection = (revisionId: string) => {
    setSelectedIds((current) => current.includes(revisionId)
      ? current.filter((id) => id !== revisionId)
      : [...current.slice(-1), revisionId]);
  };

  if (!entityId) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700" aria-label={`Riwayat perubahan ${displayName}`}>
      <button type="button" className="flex min-h-12 w-full items-center justify-between gap-3 bg-slate-50 px-4 text-left font-black text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:bg-slate-800/60 dark:text-white dark:hover:bg-slate-800" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
        <span className="flex items-center gap-2"><History className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />Riwayat perubahan</span>
        <ChevronDown className={`size-5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-700">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-300">Pilih dua catatan untuk membandingkan perubahan. Menggunakan catatan lama hanya mengisi formulir; perubahan baru tersimpan setelah tombol Simpan ditekan sehingga riwayat sebelumnya tetap utuh.</p>
          {notice && <AdminAlert tone="success">{notice}</AdminAlert>}
          {revisionsQuery.isLoading ? <AdminLoadingState label="Memuat riwayat perubahan..." /> : revisionsQuery.isError ? <AdminAlert>{getApiErrorMessage(revisionsQuery.error, 'Gagal memuat riwayat perubahan.')}</AdminAlert> : revisions.length === 0 ? <AdminEmptyState icon={History} title="Belum ada perubahan" description="Catatan pembuatan atau perubahan data ini belum tersedia." /> : (
            <ol className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {revisions.map((revision, index) => (
                <li key={revision.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                  <div className="flex min-w-0 items-start gap-3"><input type="checkbox" checked={selectedIds.includes(revision.id)} onChange={() => toggleSelection(revision.id)} aria-label={`Pilih catatan ${new Date(revision.created_at).toLocaleString('id-ID')} untuk dibandingkan`} className="mt-1 size-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><div className="min-w-0"><p className="font-black text-slate-950 dark:text-white">{index === 0 ? 'Perubahan terbaru' : 'Perubahan sebelumnya'}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{new Date(revision.created_at).toLocaleString('id-ID')} · Pelaku {revision.actor_id || 'Sistem'} · Nomor pelacakan {revision.request_id?.slice(0, 12) || 'Tidak tersedia'} · Sidik data {revision.payload_hash ? revision.payload_hash.slice(0, 12) : 'Tidak tersedia'}</p></div></div>
                  <button type="button" onClick={() => { onRestore(revision.payload as Record<string, unknown>); setNotice(`Catatan ${new Date(revision.created_at).toLocaleString('id-ID')} dimuat ke formulir. Periksa lalu simpan sebagai perubahan baru.`); }} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 text-sm font-black text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/40"><RotateCcw className="size-4" aria-hidden="true" />Gunakan catatan</button>
                </li>
              ))}
            </ol>
          )}
          {selectedRevisions.length === 2 && <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30" aria-label="Perbandingan dua perubahan"><h3 className="flex items-center gap-2 font-black text-slate-950 dark:text-white"><GitCompareArrows className="size-4 text-blue-600" aria-hidden="true" />Perbandingan dua perubahan</h3>{comparison.length === 0 ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Tidak ada perbedaan nilai yang dapat ditampilkan.</p> : <div className="mt-3 overflow-x-auto"><table className="min-w-[560px] w-full text-left text-xs"><thead><tr><th className="p-2">Bagian</th><th className="p-2">Catatan pertama</th><th className="p-2">Catatan kedua</th></tr></thead><tbody>{comparison.map((item) => <tr key={item.key} className="border-t border-blue-200 dark:border-blue-900"><th className="p-2 font-black">{revisionFieldLabel(item.key)}</th><td className="break-all p-2">{JSON.stringify(item.left) ?? 'Kosong'}</td><td className="break-all p-2">{JSON.stringify(item.right) ?? 'Kosong'}</td></tr>)}</tbody></table></div>}</section>}
        </div>
      )}
    </section>
  );
}
