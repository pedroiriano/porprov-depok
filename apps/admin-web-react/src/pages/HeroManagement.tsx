import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Image as ImageIcon, Loader2, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import ModalForm from '../components/common/ModalForm';
import { MediaInput, TextArea, TextInput } from '../components/common/FormInputs';
import MediaSelectorModal from '../components/media/MediaSelectorModal';
import {
  apiClient,
  authConfig,
  getApiErrorMessage,
  resolveMediaUrl,
  unwrapApiData,
} from '../lib/api';
import type { HeroContent } from '../types/master-data';

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

export default function HeroManagement() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<HeroContent | null>(null);
  const [form, setForm] = useState<HeroFormState>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
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
        return 'Hero berhasil diperbarui.';
      }
      await apiClient.post('/master-data/heroes', payload, requestConfig());
      return 'Hero berhasil ditambahkan.';
    },
    onSuccess: async (message) => {
      setFeedback(message);
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ['heroes'] });
    },
    onError: (error) => setFeedback(getApiErrorMessage(error, 'Gagal menyimpan Hero.')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (hero: HeroContent) => {
      await apiClient.delete(`/master-data/heroes/${hero.id}`, {
        ...requestConfig(),
        data: { reason: 'Hero diarsipkan dari workspace Hero Utama' },
      });
      return hero;
    },
    onSuccess: async (hero) => {
      setFeedback(`${hero.title} dipindahkan ke Recycle Bin.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['heroes'] }),
        queryClient.invalidateQueries({ queryKey: ['soft-delete'] }),
      ]);
    },
    onError: (error) => setFeedback(getApiErrorMessage(error, 'Gagal mengarsipkan Hero.')),
  });

  const heroes = useMemo(() => heroesQuery.data ?? [], [heroesQuery.data]);
  const activeHero = heroes.find((hero) => hero.is_active);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, is_active: !activeHero });
    setFeedback('');
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
    setFormOpen(true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFeedback('');
    saveMutation.mutate(form);
  };

  return (
    <section className="space-y-6" aria-labelledby="hero-management-title">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-slate-700 dark:bg-slate-900">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Konten Landing Page</p>
          <h1 id="hero-management-title" className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl dark:text-white">Hero Utama</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Kelola judul, isi, sorotan judul, dan gambar latar yang tampil pertama kali di Web Publik.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          <Plus className="h-5 w-5" aria-hidden="true" /> Tambah Hero
        </button>
      </header>

      {feedback && <div role="status" className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-medium text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">{feedback}</div>}

      {heroesQuery.isLoading ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" role="status"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /><span className="sr-only">Memuat Hero</span></div>
      ) : heroesQuery.isError ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">{getApiErrorMessage(heroesQuery.error, 'Gagal memuat Hero.')}</div>
      ) : heroes.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 text-center dark:border-slate-700 dark:bg-slate-900">
          <ImageIcon className="h-12 w-12 text-slate-400" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Belum ada Hero</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Tambahkan Hero pertama untuk mengganti konten fallback Web Publik.</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {heroes.map((hero) => {
            const segments = titleSegments(hero.title, hero.highlight_text ?? '');
            return (
              <article key={hero.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="relative isolate flex min-h-72 items-end overflow-hidden p-5 sm:p-7">
                  <img src={heroImageURL(hero.background_image_url)} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/20" aria-hidden="true" />
                  <div className="w-full">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {hero.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-100 ring-1 ring-emerald-300/40"><CheckCircle2 className="h-4 w-4" /> Aktif</span>
                      ) : (
                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-white ring-1 ring-white/20">Draft</span>
                      )}
                    </div>
                    <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                      {segments.base || hero.title}
                      {segments.highlight && <span className="block bg-gradient-to-r from-sky-300 via-white to-amber-300 bg-clip-text text-transparent">{segments.highlight}</span>}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-200 sm:text-base">{hero.description}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Diperbarui {new Date(hero.updated_at).toLocaleString('id-ID')}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openEdit(hero)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-indigo-200 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 sm:flex-none dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"><Pencil className="h-4 w-4" /> Edit</button>
                    <button type="button" onClick={() => { if (window.confirm(`Arsipkan Hero “${hero.title}”?`)) deleteMutation.mutate(hero); }} disabled={deleteMutation.isPending} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 sm:flex-none dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /> Arsipkan</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ModalForm isOpen={formOpen} onClose={() => !saveMutation.isPending && setFormOpen(false)} title={editing ? 'Edit Hero Utama' : 'Tambah Hero Utama'} onSubmit={submit} submitting={saveMutation.isPending} submitText={editing ? 'Simpan Perubahan' : 'Tambah Hero'} size="large">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">
          <p className="flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4" /> Panduan tampilan Techwind</p>
          <p className="mt-1 leading-relaxed">Gunakan judul singkat, isi maksimal 2–3 baris, dan gambar lanskap berkualitas tinggi. Teks sorotan harus merupakan bagian dari judul.</p>
        </div>
        <TextInput label="Judul Hero" required maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Contoh: Panggung Juara Jawa Barat." />
        <TextInput label="Teks Sorotan Judul" maxLength={100} value={form.highlight_text} onChange={(event) => setForm({ ...form, highlight_text: event.target.value })} placeholder="Contoh: Jawa Barat." />
        <TextArea label="Isi Hero" required maxLength={1200} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tulis ringkasan utama portal..." />
        <MediaInput label="Latar Belakang Gambar" required value={form.background_image_url} onClear={() => setForm({ ...form, background_image_url: '' })} onSelect={() => setMediaOpen(true)} placeholderText="Pilih dari Media Library" />
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="mt-0.5 size-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900" />
          <span><span className="block font-bold text-slate-900 dark:text-white">Tampilkan sebagai Hero aktif</span><span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">Mengaktifkan Hero ini otomatis menonaktifkan Hero aktif sebelumnya.</span></span>
        </label>
      </ModalForm>

      <MediaSelectorModal isOpen={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={(url) => setForm((current) => ({ ...current, background_image_url: url }))} />
    </section>
  );
}
