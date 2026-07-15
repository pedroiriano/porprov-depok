/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ScheduleMatchCard } from "@/components/ScheduleMatchCard";
import { publicApiUrl, unwrapCollection } from "@/lib/public-api";
import {
  normalizeCabor,
  normalizeCityGuide,
  normalizeEnrichedMatch,
  normalizeVenueModel,
  type RawCabor,
  type RawCityGuide,
  type RawEnrichedMatch,
  type RawVenueModel,
} from "@/lib/public-models";

export const dynamic = "force-dynamic";

const getVenue = cache(async (id: string) => {
  const response = await fetch(publicApiUrl(`/venues/${encodeURIComponent(id)}`), { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Venue Service merespons ${response.status}`);
  return normalizeVenueModel(await response.json() as RawVenueModel);
});

async function getCollection<T>(path: string): Promise<T[]> {
  const response = await fetch(publicApiUrl(path), { cache: "no-store" });
  if (!response.ok) return [];
  return unwrapCollection<T>(await response.json());
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const venue = await getVenue(id);
    if (!venue) return { title: "Venue tidak ditemukan" };
    return { title: `${venue.name} | Venue PORPROV Depok`, description: `${venue.name}, ${venue.address || "venue PORPROV XV Jawa Barat 2026 di Kota Depok"}.` };
  } catch {
    return { title: "Detail Venue PORPROV" };
  }
}

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venue = await getVenue(id);
  if (!venue) notFound();

  const [rawCabors, rawGuides, rawMatches] = await Promise.all([
    getCollection<RawCabor>("/master-data/cabors"),
    getCollection<RawCityGuide>("/master-data/city-guides"),
    getCollection<RawEnrichedMatch>("/schedule/matches/enriched"),
  ]);
  const cabors = rawCabors.map(normalizeCabor).filter((cabor) => venue.caborIds.includes(cabor.id));
  const guides = rawGuides.map(normalizeCityGuide).filter((guide) => venue.cityGuideIds.includes(guide.id));
  const matches = rawMatches.map(normalizeEnrichedMatch).filter((match) => match.venueId === venue.id);
  const coordinateAvailable = venue.latitude !== 0 || venue.longitude !== 0;

  return (
    <main className="pb-20 pt-24 md:pb-24 md:pt-28">
      <section className="relative min-h-[520px] overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-950 to-slate-900" aria-hidden="true" />
        {venue.imageUrl && (
          // PERFORMANCE: URL Media Library ditentukan saat runtime.
          <img src={venue.imageUrl} alt="" className="absolute inset-0 size-full object-cover opacity-45" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" aria-hidden="true" />
        <div className="container relative flex min-h-[520px] flex-col justify-end py-14">
          <Link href="/venue" className="mb-auto inline-flex min-h-11 w-fit items-center text-sm font-bold text-slate-200 hover:text-white"><i className="ri-arrow-left-line me-2" aria-hidden="true" />Semua venue</Link>
          <span className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider backdrop-blur">Kesiapan · {venue.readinessStatus}</span>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">{venue.name}</h1>
          <p className="mt-4 flex max-w-3xl items-start gap-2 text-lg text-slate-200"><i className="ri-map-pin-line mt-1 shrink-0 text-primary-300" aria-hidden="true" />{venue.address || "Alamat sedang diverifikasi panitia"}</p>
        </div>
      </section>

      <div className="container mt-12 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="space-y-12">
          <section aria-labelledby="facility-title"><p className="text-sm font-black uppercase tracking-wider text-primary-500">Arena Pertandingan</p><h2 id="facility-title" className="mt-2 text-3xl font-black">Fasilitas & kapasitas</h2><p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-300">{venue.facilities || "Informasi fasilitas sedang diverifikasi oleh pengelola venue dan panitia PORPROV."}</p>
            <dl className="mt-7 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-primary-500/10 p-5"><dt className="text-sm font-bold text-slate-500">Kapasitas</dt><dd className="mt-2 text-2xl font-black">{venue.capacity ? new Intl.NumberFormat("id-ID").format(venue.capacity) : "TBA"}</dd></div><div className="rounded-2xl bg-primary-500/10 p-5"><dt className="text-sm font-bold text-slate-500">Cabang olahraga</dt><dd className="mt-2 text-2xl font-black">{cabors.length}</dd></div><div className="rounded-2xl bg-primary-500/10 p-5"><dt className="text-sm font-bold text-slate-500">Jadwal aktif</dt><dd className="mt-2 text-2xl font-black">{matches.length}</dd></div></dl>
          </section>
          <section aria-labelledby="venue-schedule-title"><h2 id="venue-schedule-title" className="text-3xl font-black">Jadwal di venue ini</h2>{matches.length ? <div className="mt-6 grid gap-5">{matches.map((match) => <ScheduleMatchCard key={match.id} match={match} />)}</div> : <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-slate-500 dark:border-slate-700">Belum ada jadwal yang dipublikasikan untuk venue ini.</p>}</section>
          {guides.length > 0 && <section aria-labelledby="nearby-title"><h2 id="nearby-title" className="text-3xl font-black">Panduan di sekitar venue</h2><div className="mt-6 grid gap-5 sm:grid-cols-2">{guides.map((guide) => <article key={guide.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">{guide.imageUrl && <div className="h-40 overflow-hidden"><img src={guide.imageUrl} alt="" className="size-full object-cover" /></div>}<div className="p-5"><p className="text-xs font-black uppercase tracking-wider text-primary-500">{guide.category}</p><h3 className="mt-2 text-lg font-black">{guide.title}</h3><p className="mt-2 line-clamp-3 text-sm text-slate-500">{guide.description || guide.address}</p></div></article>)}</div></section>}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="font-black">Navigasi venue</h2><p className="mt-3 text-sm leading-relaxed text-slate-500">Gunakan tautan rute resmi untuk membuka navigasi pada perangkat Anda.</p>{venue.mapRouteUrl ? <a href={venue.mapRouteUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary-500 px-4 font-black text-white hover:bg-primary-600"><i className="ri-direction-line me-2" aria-hidden="true" />Buka rute</a> : <p className="mt-5 rounded-xl bg-slate-100 p-4 text-sm dark:bg-slate-800">Tautan rute belum tersedia.</p>}{coordinateAvailable && <p className="mt-4 text-xs text-slate-500">Koordinat: {venue.latitude.toFixed(6)}, {venue.longitude.toFixed(6)}</p>}</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="font-black">Cabang olahraga</h2>{cabors.length ? <ul className="mt-4 space-y-2">{cabors.map((cabor) => <li key={cabor.id}><Link href={`/cabor/${encodeURIComponent(cabor.id)}`} className="flex min-h-11 items-center justify-between rounded-xl px-3 font-bold hover:bg-primary-500/10 hover:text-primary-600">{cabor.name}<i className="ri-arrow-right-s-line" aria-hidden="true" /></Link></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Cabor belum ditautkan.</p>}</div>
        </aside>
      </div>
    </main>
  );
}
