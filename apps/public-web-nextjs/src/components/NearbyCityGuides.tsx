import Link from "next/link";
import { type CityGuideModel } from "@/lib/public-models";

interface GuideWithDistance extends CityGuideModel {
  distanceKm?: number;
}

interface NearbyCityGuidesProps {
  guides: GuideWithDistance[];
  venueName: string;
}

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("kopi") || cat.includes("cafe") || cat.includes("makan") || cat.includes("kuliner") || cat.includes("coffee") || cat.includes("restaurant")) {
    return "ri-cup-line text-blue-500";
  }
  if (cat.includes("inap") || cat.includes("hotel") || cat.includes("apartemen")) {
    return "ri-hotel-bed-line text-indigo-500";
  }
  if (cat.includes("wisata") || cat.includes("taman")) {
    return "ri-map-2-line text-green-500";
  }
  return "ri-map-pin-2-line text-sky-500";
};

export function NearbyCityGuides({ guides, venueName }: NearbyCityGuidesProps) {
  if (!guides || guides.length === 0) return null;

  return (
    <section aria-labelledby="nearby-title">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 id="nearby-title" className="text-sm font-black uppercase tracking-wider text-primary-500 flex items-center gap-2">
            <span className="w-5 h-[2px] bg-primary-500 rounded-full"></span>
            Di Sekitar Venue Ini
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Rekomendasi fasilitas terdekat berdasarkan kalkulasi jarak riil dari {venueName}
          </p>
        </div>
        <Link href="/city-guide" className="shrink-0 text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline">
          Lihat City Guide Lengkap &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {guides.map((guide) => (
          <article 
            key={guide.id} 
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-primary-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Cover Image */}
            <div className="relative h-32 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              {guide.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={guide.imageUrl} alt={guide.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                  <i className={`text-3xl ${getCategoryIcon(guide.category)}`} aria-hidden="true"></i>
                </div>
              )}
              {/* Distance Badge on Image */}
              {guide.distanceKm !== undefined && (
                <div className="absolute right-0 top-0 rounded-bl-xl bg-red-600 px-3 py-1.5 text-[10px] font-black text-white shadow-sm z-10">
                  {guide.distanceKm < 0.1 
                    ? "< 100 M" 
                    : `${guide.distanceKm.toFixed(1).replace('.', ',')} KM`}
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-2 flex items-center gap-1.5">
                  <i className={getCategoryIcon(guide.category)} aria-hidden="true"></i>
                  {guide.category.replace("-", " ")}
                </p>
                <h3 className="text-sm font-black uppercase leading-tight text-slate-900 dark:text-white line-clamp-2">
                  {guide.title}
                </h3>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {guide.mapUrl ? (
                  <a 
                    href={guide.mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 py-2.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                  >
                    <i className="ri-direction-line" aria-hidden="true"></i>
                    Rute ke Lokasi
                  </a>
                ) : (
                  <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 py-2.5 text-xs font-bold text-slate-400">
                    <i className="ri-map-pin-line opacity-50" aria-hidden="true"></i>
                    Rute belum tersedia
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
