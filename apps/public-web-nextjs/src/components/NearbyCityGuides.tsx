import Image from "next/image";
import Link from "next/link";
import type { NearbyCategoryKey, NearbyCityGuide } from "@/lib/nearby-city-guides";

interface NearbyCityGuidesProps {
  guides: NearbyCityGuide[];
  venueName: string;
}

const categoryPresentation: Record<NearbyCategoryKey, { icon: string; image: string; accent: string }> = {
  "tempat-menginap": {
    icon: "ri-hotel-bed-line",
    image: "/assets/images/city-guide-fallback/tempat-menginap.jpg",
    accent: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  },
  "pusat-perbelanjaan": {
    icon: "ri-shopping-bag-3-line",
    image: "/assets/images/city-guide-fallback/pusat-perbelanjaan.jpg",
    accent: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
  },
  "wisata-kuliner": {
    icon: "ri-restaurant-2-line",
    image: "/assets/images/city-guide-fallback/wisata-kuliner.jpg",
    accent: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  },
  "coffee-shop": {
    icon: "ri-cup-line",
    image: "/assets/images/city-guide-fallback/coffee-shop.jpg",
    accent: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  },
  catering: {
    icon: "ri-restaurant-line",
    image: "/assets/images/city-guide-fallback/wisata-kuliner.jpg",
    accent: "bg-lime-500/15 text-lime-800 dark:text-lime-300",
  },
  "travel-transportasi": {
    icon: "ri-bus-2-line",
    image: "/assets/images/city-guide-fallback/lainnya.jpg",
    accent: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  },
  "rumah-sakit": {
    icon: "ri-hospital-line",
    image: "/assets/images/city-guide-fallback/rumah-sakit.jpg",
    accent: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  },
  lainnya: {
    icon: "ri-map-2-line",
    image: "/assets/images/city-guide-fallback/lainnya.jpg",
    accent: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
};

const formatDistance = (distanceKm?: number) => {
  if (distanceKm === undefined) return "Jarak belum tersedia";
  if (distanceKm < 0.1) return "< 100 m";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(distanceKm)} km`;
};

export function NearbyCityGuides({ guides, venueName }: NearbyCityGuidesProps) {
  const hasCalculatedDistance = guides.some((guide) => guide.distanceKm !== undefined);

  return (
    <section aria-labelledby="nearby-title">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-primary-700 dark:text-primary-300">
          <i className="ri-compass-3-line text-base" aria-hidden="true" />
          Jelajah Sekitar Venue
        </span>
        <h2 id="nearby-title" className="mt-5 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">
          Tempat Terdekat dari {venueName}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-slate-600 dark:text-slate-300">
          {hasCalculatedDistance
            ? "Satu rekomendasi terdekat pada setiap kategori, dihitung dari koordinat resmi venue."
            : "Rekomendasi City Guide yang telah ditautkan dengan venue ini."}
        </p>
      </div>

      {!guides.length ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
          <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary-500/10 text-2xl text-primary-600 dark:text-primary-300">
            <i className="ri-map-pin-time-line" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Belum ada rekomendasi dalam radius terdekat</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            City Guide dalam radius 15 km dari {venueName} belum tersedia atau masih diverifikasi panitia.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => {
          const presentation = categoryPresentation[guide.nearbyCategoryKey];
          const imageUrl = guide.imageUrl || presentation.image;

          return (
            <article
              key={`${guide.nearbyCategoryKey}-${guide.id}`}
              className="group relative flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-700"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <Image
                  src={imageUrl}
                  alt={guide.imageUrl ? `Foto ${guide.title}` : `Visual kategori ${guide.nearbyCategoryLabel}`}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-transparent" aria-hidden="true" />

                <span className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider backdrop-blur-md ${presentation.accent}`}>
                  <i className={presentation.icon} aria-hidden="true" />
                  {guide.nearbyCategoryLabel}
                </span>

                <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-black text-white backdrop-blur-md">
                  <i className="ri-navigation-line text-primary-300" aria-hidden="true" />
                  {formatDistance(guide.distanceKm)}
                </span>

                {!guide.imageUrl && (
                  <span className="absolute bottom-4 left-4 text-[10px] font-bold uppercase tracking-wider text-white/80">
                    Visual kategori
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">
                    {guide.category}
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-xl font-black leading-snug text-slate-950 dark:text-white">
                    {guide.title}
                  </h3>
                  {guide.address && (
                    <p className="mt-3 line-clamp-2 flex items-start gap-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      <i className="ri-map-pin-line mt-0.5 shrink-0 text-primary-500" aria-hidden="true" />
                      {guide.address}
                    </p>
                  )}
                </div>

                {guide.mapUrl ? (
                  <a
                    href={guide.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Buka rute menuju ${guide.title}`}
                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                  >
                    <i className="ri-direction-line text-lg" aria-hidden="true" />
                    Buka Rute
                  </a>
                ) : (
                  <span className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <i className="ri-map-pin-line" aria-hidden="true" />
                    Rute belum tersedia
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/city-guide"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-5 text-sm font-black text-slate-700 transition hover:border-primary-500 hover:bg-primary-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-slate-700 dark:text-slate-200"
        >
          Lihat Semua City Guide
          <i className="ri-arrow-right-line" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
