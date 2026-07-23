import type { Metadata } from "next";
import Link from "next/link";
import { publicApiUrl, unwrapCollection } from "@/lib/public-api";
import { normalizeCityGuide, type RawCityGuide } from "@/lib/public-models";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "City Guide | PORPROV XV Jawa Barat 2026",
  description: "Jelajahi keindahan, kuliner, dan akomodasi terbaik di Kota Depok selama perhelatan PORPROV XV Jawa Barat 2026.",
};

async function getCityGuides() {
  const response = await fetch(publicApiUrl("/master-data/city-guides"), { cache: "no-store" });
  if (!response.ok) return [];
  const rawGuides = unwrapCollection<RawCityGuide>(await response.json());
  return rawGuides.map(normalizeCityGuide);
}

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("kopi") || cat.includes("cafe") || cat.includes("makan") || cat.includes("kuliner") || cat.includes("coffee") || cat.includes("restaurant")) {
    return "ri-restaurant-2-line text-amber-500 bg-amber-500/20";
  }
  if (cat.includes("inap") || cat.includes("hotel") || cat.includes("akomodasi") || cat.includes("apartemen")) {
    return "ri-hotel-bed-line text-indigo-500 bg-indigo-500/20";
  }
  if (cat.includes("wisata") || cat.includes("taman")) {
    return "ri-map-2-line text-sky-500 bg-sky-500/20";
  }
  return "ri-map-pin-2-line text-emerald-500 bg-emerald-500/20";
};

export default async function CityGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const resolvedParams = await searchParams;
  const activeCategory = resolvedParams.category?.toLowerCase() || "semua";
  const allGuides = await getCityGuides();

  const categories = [
    { id: "semua", label: "Semua", icon: "ri-apps-2-line" },
    { id: "wisata", label: "Wisata", icon: "ri-map-2-line" },
    { id: "kuliner", label: "Kuliner", icon: "ri-restaurant-2-line" },
    { id: "akomodasi", label: "Akomodasi", icon: "ri-hotel-bed-line" },
  ];

  const filteredGuides = activeCategory === "semua" 
    ? allGuides 
    : allGuides.filter(g => g.category.toLowerCase().includes(activeCategory));

  return (
    <main className="min-h-screen bg-slate-950 pb-24 pt-24 md:pt-32">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 size-[600px] rounded-full bg-sky-600/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        
        <div className="container relative z-10 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-400">
            <i className="ri-compass-3-line text-base"></i>
            Depok City Guide
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Jelajahi Kota <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Tuan Rumah.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            Temukan keindahan budaya, kuliner legendaris, tempat wisata memukau, hingga kenyamanan akomodasi terbaik di Kota Depok selama gelaran PORPROV XV 2026.
          </p>
        </div>
      </section>

      {/* Tabs / Filters */}
      <div className="sticky top-[72px] z-20 md:top-[88px] bg-slate-950/80 backdrop-blur-xl border-y border-slate-800 py-4 mb-12 shadow-lg">
        <div className="container flex items-center justify-start md:justify-center overflow-x-auto pb-2 md:pb-0 scrollbar-hide gap-3">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Link 
                key={cat.id}
                href={cat.id === "semua" ? "/city-guide" : `/city-guide?category=${cat.id}`}
                className={`flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(56,189,248,0.3)]" 
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600"
                }`}
              >
                <i className={cat.icon}></i>
                {cat.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grid Content */}
      <div className="container">
        {filteredGuides.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredGuides.map((guide) => (
              <article 
                key={guide.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-sky-500/50 hover:shadow-[0_10px_40px_rgba(56,189,248,0.15)]"
              >
                {/* Image Area */}
                <div className="relative h-56 overflow-hidden">
                  {guide.imageUrl ? (
                    <img 
                      src={guide.imageUrl} 
                      alt={guide.title}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="size-full bg-slate-800 flex items-center justify-center">
                      <i className="ri-image-line text-4xl text-slate-600"></i>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
                  
                  {/* Category Pill */}
                  <div className="absolute left-4 top-4">
                    <span className="inline-block rounded-lg bg-slate-950/60 backdrop-blur-md px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white border border-white/10">
                      {guide.category}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 shadow-inner -mt-12 relative z-10 backdrop-blur-xl">
                      <div className={`flex size-full items-center justify-center rounded-xl ${getCategoryIcon(guide.category)}`}>
                        <i className={`text-xl ${getCategoryIcon(guide.category).split(' ')[0]}`}></i>
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-black text-white group-hover:text-sky-400 transition-colors line-clamp-2">
                      {guide.title}
                    </h2>
                    
                    <p className="mt-3 text-sm leading-relaxed text-slate-400 line-clamp-3">
                      {guide.description || guide.address || "Tidak ada deskripsi tersedia."}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center text-xs text-slate-500 max-w-[60%]">
                      <i className="ri-map-pin-line me-1.5 shrink-0"></i>
                      <span className="truncate">{guide.address || "Depok"}</span>
                    </div>

                    {guide.mapUrl && (
                      <a 
                        href={guide.mapUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-800 px-4 text-xs font-bold text-white transition hover:bg-sky-500 focus:outline-none"
                      >
                        Buka Peta
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 py-24 px-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 mb-6 text-slate-500">
              <i className="ri-search-eye-line text-4xl"></i>
            </div>
            <h3 className="text-2xl font-black text-white">Panduan Tidak Ditemukan</h3>
            <p className="mt-2 text-slate-400 max-w-md mx-auto">
              Maaf, belum ada data City Guide untuk kategori "{activeCategory}". Panitia masih melengkapi panduan ini.
            </p>
            <Link 
              href="/city-guide" 
              className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-slate-800 px-6 font-bold text-white transition hover:bg-slate-700"
            >
              Kembali ke Semua
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
