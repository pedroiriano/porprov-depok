import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FilePenLine, Image as ImageIcon, Layers3, Loader2, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import Modal from '../components/Modal';
import ModalForm from '../components/common/ModalForm';
import { MediaInput, TextArea, TextInput } from '../components/common/FormInputs';
import { AdminAlert, AdminEmptyState, AdminErrorState, AdminLoadingState, AdminPageHeader } from '../components/cuba/AdminPrimitives';
import MediaSelectorModal from '../components/media/MediaSelectorModal';
import {
  apiClient,
  authConfig,
  getApiErrorMessage,
  resolveMediaUrl,
  unwrapApiData,
} from '../lib/api';
import type { HeroContent } from '../types/master-data';
import RevisionHistory from '../components/common/RevisionHistory';
import { applyRevisionFields } from '../lib/revision';

interface HeroFormState {
  title: string;
  highlight_text: string;
  description: string;
  background_image_url: string;
  is_active: boolean;
}

const emptyForm: HeroFormState = {
  title: '',
  highlight_text: '',
  description: '',
  background_image_url: '',
  is_active: false,
};

function heroImageURL(value: string) {
  return value.startsWith('/assets/') ? value : resolveMediaUrl(value);
}

function titleSegments(title: string, highlightText: string) {
  if (!highlightText) return { base: title, highlight: '' };
  const index = title.toLocaleLowerCase('id-ID').lastIndexOf(highlightText.toLocaleLowerCase('id-ID'));
  if (index < 0) return { base: title, highlight: '' };
  return {
    base: `${title.slice(0, index)}${title.slice(index + highlightText.length)}`.trim(),
    highlight: title.slice(index, index + highlightText.length),
  };
}

function validateHeroForm(form: HeroFormState) {
  if (!form.title.trim()) return 'Judul tampilan utama wajib diisi.';
  if (!form.description.trim()) return 'Isi tampilan utama wajib diisi.';
  if (!form.background_image_url.trim()) return 'Pilih gambar tampilan utama dari Pustaka Media.';
  const highlight = form.highlight_text.trim().toLocaleLowerCase('id-ID');
  if (highlight && !form.title.toLocaleLowerCase('id-ID').includes(highlight)) {
    return 'Teks sorotan harus merupakan bagian dari judul tampilan utama.';
  }
  return '';
}

export default function HeroManagement() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<HeroContent | null>(null);
  const [form, setForm] = useState<HeroFormState>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'danger'>('success');
  const [formError, setFormError] = useState('');
  const [archiveTarget, setArchiveTarget] = useState<HeroContent | null>(null);
  const [archiveReason, setArchiveReason] = useState('Diarsipkan melalui Tampilan Utama');
  const requestConfig = () => authConfig(auth.user?.access_token);

  const heroesQuery = useQuery({
    queryKey: ['heroes'],
    queryFn: async () => {
      const response = await apiClient.get<HeroContent[] | { data: HeroContent[] }>(
        '/master-data/heroes',
        requestConfig(),
      );
      return unwrapApiData(response.data) ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: HeroFormState) => {
      if (editing) {
        await apiClient.put(`/master-data/heroes/${editing.id}`, payload, requestConfig());
        return 'Tampilan utama berhasil diperbarui.';
      }
      await apiClient.post('/master-data/heroes', payload, requestConfig());
      return 'Tampilan utama berhasil ditambahkan.';
    },
    onSuccess: async (message) => {
      setFeedbackTone('success');
      setFeedback(message);
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFormError('');
      await queryClient.invalidateQueries({ queryKey: ['heroes'] });
    },
    onError: (error) => setFormError(getApiErrorMessage(error, 'Gagal menyimpan tampilan utama.')),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ hero, reason }: { hero: HeroContent; reason: string }) => {
      await apiClient.delete(`/master-data/heroes/${hero.id}`, {
        ...requestConfig(),
        data: { reason },
      });
      return hero;
    },
    onSuccess: async (hero) => {
      setFeedbackTone('success');
      setFeedback(`${hero.title} dipindahkan ke Arsip Terhapus.`);
      setArchiveTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['heroes'] }),
        queryClient.invalidateQueries({ queryKey: ['soft-delete'] }),
      ]);
    },
    onError: (error) => {
      setFeedbackTone('danger');
      setFeedback(getApiErrorMessage(error, 'Gagal mengarsipkan tampilan utama.'));
      setArchiveTarget(null);
    },
  });

  const heroes = useMemo(() => {
    const result = [...(heroesQuery.data ?? [])];
    return result.sort((left, right) => Number(right.is_active) - Number(left.is_active)
      || new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());
  }, [heroesQuery.data]);
  const activeHero = heroes.find((hero) => hero.is_active);
  const draftCount = heroes.filter((hero) => !hero.is_active).length;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, is_active: !activeHero });
    setFeedback('');
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (hero: HeroContent) => {
    setEditing(hero);
    setForm({
      title: hero.title,
      highlight_text: hero.highlight_text ?? '',
      description: hero.description,
      background_image_url: hero.background_image_url,
      is_active: hero.is_active,
    });
    setFeedback('');
    setFormError('');
    setFormOpen(true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const error = validateHeroForm(form);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError('');
    saveMutation.mutate({
      ...form,
      title: form.title.trim(),
      highlight_text: form.highlight_text.trim(),
      description: form.description.trim(),
      background_image_url: form.background_image_url.trim(),
    });
  };

  return (
    <section aria-labelledby="hero-management-title">
      <AdminPageHeader
        eyebrow="Editorial Landing Page"
        title="Tampilan Utama"
        description="Kelola pesan pembuka dan gambar latar Web Publik dengan satu tampilan aktif sebagai sumber tayang resmi."
        actions={(
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm hover:bg-blue-700">
            <Plus className="size-4" aria-hidden="true" /> Tambah Tampilan
          </button>
        )}
      />
      <h1 id="hero-management-title" className="sr-only">Tampilan Utama</h1>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-200"><Layers3 className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Total Tampilan</p><p className="text-2xl font-black text-slate-950 dark:text-white">{heroes.length}</p></div></div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200"><CheckCircle2 className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Tampilan aktif</p><p className="truncate text-base font-black text-slate-950 dark:text-white" title={activeHero?.title}>{activeHero?.title || 'Belum tersedia'}</p></div></div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200"><FilePenLine className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Draf</p><p className="text-2xl font-black text-slate-950 dark:text-white">{draftCount}</p></div></div></div>
      </div>

      {feedback && <div className="mb-4"><AdminAlert tone={feedbackTone}>{feedback}</AdminAlert></div>}

      {heroesQuery.isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><AdminLoadingState label="Memuat Tampilan Utama..." /></div>
      ) : heroesQuery.isError ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><AdminErrorState message={getApiErrorMessage(heroesQuery.error, 'Gagal memuat Tampilan Utama.')} onRetry={() => void heroesQuery.refetch()} /></div>
      ) : heroes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><AdminEmptyState icon={ImageIcon} title="Belum ada tampilan utama" description="Tambahkan tampilan pertama untuk mengganti konten cadangan Web Publik." action={<button type="button" onClick={openCreate} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700">Tambah tampilan pertama</button>} /></div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {heroes.map((hero) => {
            const segments = titleSegments(hero.title, hero.highlight_text ?? '');
            return (
              <article key={hero.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="relative isolate flex min-h-72 items-end overflow-hidden p-5 sm:p-7">
                  <img src={heroImageURL(hero.background_image_url)} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/15" aria-hidden="true" />
                  <div className="w-full">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${hero.is_active ? 'bg-emerald-400/20 text-emerald-100 ring-emerald-300/40' : 'bg-white/15 text-white ring-white/25'}`}>
                      {hero.is_active && <CheckCircle2 className="size-3.5" aria-hidden="true" />} {hero.is_active ? 'Aktif' : 'Draf'}
                    </span>
                    <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
                      {segments.base || hero.title}
                      {segments.highlight && <span className="block text-sky-200">{segments.highlight}</span>}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-100 sm:text-base">{hero.description}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-300">Diperbarui {new Date(hero.updated_at).toLocaleString('id-ID')}</p>
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <button type="button" onClick={() => openEdit(hero)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/40"><Pencil className="size-4" aria-hidden="true" /> Edit</button>
                    <button type="button" onClick={() => { setArchiveReason('Diarsipkan melalui Tampilan Utama'); setArchiveTarget(hero); }} disabled={deleteMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"><Trash2 className="size-4" aria-hidden="true" /> Arsipkan</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ModalForm isOpen={formOpen} onClose={() => !saveMutation.isPending && setFormOpen(false)} title={editing ? 'Ubah Tampilan Utama' : 'Tambah Tampilan Utama'} onSubmit={submit} submitting={saveMutation.isPending} submitText={editing ? 'Simpan Perubahan' : 'Tambah Tampilan'} size="large" draft={{ entityId: editing?.id || 'new-hero', version: 'hero-v1', value: form, onRestore: setForm }}>
        <RevisionHistory entityName="Hero" displayName="Tampilan Utama" entityId={editing?.id} onRestore={(payload) => setForm((current) => applyRevisionFields(current, payload))} />
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/35 dark:text-blue-100">
          <p className="flex items-center gap-2 font-black"><Sparkles className="size-4" aria-hidden="true" /> Panduan Tampilan Web Publik</p>
          <p className="mt-1 leading-relaxed">Gunakan judul ringkas, isi dua sampai tiga baris, serta gambar lanskap dari Pustaka Media. Teks sorotan harus merupakan bagian dari judul.</p>
        </div>
        {formError && <AdminAlert>{formError}</AdminAlert>}
        <TextInput label="Judul Tampilan" required maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Contoh: Panggung Juara Jawa Barat." />
        <TextInput label="Teks Sorotan Judul" maxLength={100} value={form.highlight_text} onChange={(event) => setForm({ ...form, highlight_text: event.target.value })} placeholder="Contoh: Jawa Barat." helpText="Opsional dan harus sama persis dengan bagian judul yang ingin disorot." />
        <TextArea label="Isi Tampilan" required maxLength={1200} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tulis ringkasan utama portal..." />
        <MediaInput label="Latar Belakang Gambar" required value={form.background_image_url} onClear={() => setForm({ ...form, background_image_url: '' })} onSelect={() => setMediaOpen(true)} placeholderText="Pilih dari Pustaka Media" previewVariant="landscape" helpText="Gunakan gambar lanskap dengan subjek utama tetap terbaca pada layar ponsel maupun desktop." />
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="mt-0.5 size-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900" />
          <span><span className="block font-black text-slate-900 dark:text-white">Jadikan tampilan aktif</span><span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">Mengaktifkan tampilan ini otomatis menonaktifkan tampilan aktif sebelumnya.</span></span>
        </label>
      </ModalForm>

      <MediaSelectorModal isOpen={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={(url) => setForm((current) => ({ ...current, background_image_url: url }))} />

      <Modal isOpen={archiveTarget !== null} onClose={() => !deleteMutation.isPending && setArchiveTarget(null)} title="Arsipkan Tampilan Utama" description="Tampilan dipindahkan ke Arsip Terhapus dan dapat dipulihkan sesuai kewenangan." closeDisabled={deleteMutation.isPending}>
        <form className="space-y-4 p-4 sm:p-6" onSubmit={(event) => { event.preventDefault(); if (archiveTarget) deleteMutation.mutate({ hero: archiveTarget, reason: archiveReason.trim() || 'Diarsipkan melalui Tampilan Utama' }); }}>
          <p className="text-sm text-slate-600 dark:text-slate-300">Anda akan mengarsipkan <strong className="text-slate-900 dark:text-white">{archiveTarget?.title}</strong>.</p>
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Alasan pengarsipan</span><textarea required maxLength={240} rows={3} value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setArchiveTarget(null)} disabled={deleteMutation.isPending} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Batal</button><button type="submit" disabled={deleteMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50">{deleteMutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} {deleteMutation.isPending ? 'Mengarsipkan...' : 'Arsipkan Tampilan'}</button></div>
        </form>
      </Modal>
    </section>
  );
}
