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
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Distance Badge */}
            {guide.distanceKm !== undefined && (
              <div className="absolute right-0 top-0 rounded-bl-xl bg-red-600 px-3 py-1 text-[10px] font-black text-white shadow-sm">
                {guide.distanceKm < 0.1 
                  ? "< 100 M" 
                  : `${guide.distanceKm.toFixed(1).replace('.', ',')} KM`}
              </div>
            )}

            <div>
              <div className="flex flex-col items-center gap-2 text-center pt-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <i className={`text-xl ${getCategoryIcon(guide.category)}`} aria-hidden="true"></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {guide.category}
                </p>
              </div>
              
              <h3 className="mt-4 text-center text-sm font-black uppercase leading-tight text-slate-900 dark:text-white line-clamp-2">
                {guide.title}
              </h3>
            </div>

            <div className="mt-6 flex justify-center">
              {guide.mapUrl ? (
                <a 
                  href={guide.mapUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors"
                >
                  <i className="ri-map-pin-line" aria-hidden="true"></i>
                  Lihat di Peta
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <i className="ri-map-pin-line opacity-50" aria-hidden="true"></i>
                  Peta belum tersedia
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
