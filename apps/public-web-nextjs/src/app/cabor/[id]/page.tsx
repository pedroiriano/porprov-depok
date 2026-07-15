import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ScheduleMatchCard } from "@/components/ScheduleMatchCard";
import { publicApiUrl, unwrapCollection } from "@/lib/public-api";
import {
  normalizeCabor,
  normalizeEnrichedMatch,
  normalizeNomorTanding,
  normalizeVenueModel,
  type RawCabor,
  type RawEnrichedMatch,
  type RawNomorTanding,
  type RawVenueModel,
} from "@/lib/public-models";

export const dynamic = "force-dynamic";

const getCabor = cache(async (id: string) => {
  const response = await fetch(publicApiUrl(`/master-data/cabors/${encodeURIComponent(id)}`), { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Master Data Service merespons ${response.status}`);
  return normalizeCabor(await response.json() as RawCabor);
});

async function getCollection<T>(path: string): Promise<T[]> {
  const response = await fetch(publicApiUrl(path), { cache: "no-store" });
  if (!response.ok) return [];
  return unwrapCollection<T>(await response.json());
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const cabor = await getCabor(id);
    if (!cabor) return { title: "Cabor tidak ditemukan" };
    return { title: `${cabor.name} | PORPROV Depok`, description: cabor.description };
  } catch {
    return { title: "Detail Cabang Olahraga" };
  }
}

export default async function CaborDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cabor = await getCabor(id);
  if (!cabor) notFound();

  const [rawNomor, rawVenues, rawMatches] = await Promise.all([
    getCollection<RawNomorTanding>("/master-data/nomor-tandings"),
    getCollection<RawVenueModel>("/venues"),
    getCollection<RawEnrichedMatch>("/schedule/matches/enriched"),
  ]);
  const nomor = rawNomor.map(normalizeNomorTanding).filter((item) => item.caborId === cabor.id);
  const venues = rawVenues.map(normalizeVenueModel).filter((venue) => venue.caborIds.includes(cabor.id));
  const matches = rawMatches.map(normalizeEnrichedMatch).filter((match) => match.caborId === cabor.id);

  return (
    <main className="pb-20 pt-28 md:pb-24 md:pt-36">
      <section className="relative overflow-hidden bg-gradient-sports py-16 text-white md:py-24">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_75%_25%,white_0,transparent_28%)]" aria-hidden="true" />
        <div className="container relative">
          <Link href="/cabor" className="inline-flex min-h-11 items-center text-sm font-bold text-primary-100 hover:text-white"><i className="ri-arrow-left-line me-2" aria-hidden="true" />Semua cabor</Link>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            <span className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/10 text-5xl backdrop-blur">
              {cabor.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cabor.iconUrl} alt={`Ikon ${cabor.name}`} className="size-20 object-contain" />
              ) : <i className="ri-medal-fill" aria-hidden="true" />}
            </span>
            <div><p className="text-sm font-black uppercase tracking-[0.2em] text-primary-100">{cabor.category}</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">{cabor.name}</h1><p className="mt-4 max-w-3xl text-lg leading-relaxed text-blue-50">{cabor.description}</p></div>
          </div>
        </div>
      </section>

      <div className="container mt-12 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-12">
          <section aria-labelledby="nomor-title"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-wider text-primary-500">Disiplin</p><h2 id="nomor-title" className="mt-2 text-3xl font-black">Nomor pertandingan</h2></div><span className="text-sm font-bold text-slate-500">{nomor.length} nomor</span></div>
            {nomor.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2">{nomor.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h3 className="font-black">{item.name}</h3><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.genderCategory} · {item.matchType}</p></article>)}</div> : <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-slate-500 dark:border-slate-700">Nomor pertandingan sedang disahkan panitia.</p>}
          </section>
          <section aria-labelledby="schedule-title"><h2 id="schedule-title" className="text-3xl font-black">Jadwal {cabor.name}</h2>{matches.length ? <div className="mt-6 grid gap-5">{matches.map((match) => <ScheduleMatchCard key={match.id} match={match} />)}</div> : <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-slate-500 dark:border-slate-700">Jadwal belum dipublikasikan.</p>}</section>
        </div>
        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="font-black">Informasi resmi</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-black">{cabor.status}</dd></div><div><dt className="text-slate-500">Total medali</dt><dd className="mt-1 font-black">{cabor.totalMedals || "Menunggu penetapan"}</dd></div><div><dt className="text-slate-500">Technical Delegate</dt><dd className="mt-1 font-black">{cabor.technicalDelegate || "Menunggu penetapan"}</dd></div></dl></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="font-black">Venue terkait</h2>{venues.length ? <ul className="mt-4 space-y-2">{venues.map((venue) => <li key={venue.id}><Link href={`/venue/${encodeURIComponent(venue.id)}`} className="flex min-h-11 items-center justify-between rounded-xl px-3 font-bold hover:bg-primary-500/10 hover:text-primary-600">{venue.name}<i className="ri-arrow-right-s-line" aria-hidden="true" /></Link></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Venue belum ditautkan.</p>}</div>
        </aside>
      </div>
    </main>
  );
}
