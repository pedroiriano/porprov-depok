import Image from "next/image";
import Link from "next/link";

export function CityGuideSection() {
  return (
    <section id="city-guide" className="relative overflow-hidden bg-white dark:bg-slate-950 py-20 lg:py-32" aria-labelledby="city-guide-title">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -start-40 top-1/4 size-[500px] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute -end-40 bottom-1/4 size-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="container relative z-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Text Content - Left Side */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-400">
              <i className="ri-compass-3-line text-base"></i>
              Depok City Guide
            </div>
            
            <h2 id="city-guide-title" className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              Jelajahi Kota <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Tuan Rumah.</span>
            </h2>
            
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              Jadikan momen PORPROV XV 2026 tidak hanya tentang pertandingan. Temukan pesona budaya, kuliner legendaris, tempat wisata, hingga kenyamanan akomodasi terbaik di Kota Depok.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link 
                href="/city-guide" 
                className="group relative inline-flex h-12 md:h-14 items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-8 font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(56,189,248,0.4)] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <span className="relative z-10">Buka Panduan Kota</span>
                <i className="ri-arrow-right-up-line relative z-10 text-xl transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"></i>
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-indigo-600 to-sky-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              </Link>
            </div>
            
            {/* Quick Stats / Highlights */}
            <div className="mt-12 grid grid-cols-3 gap-4 divide-x divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800 pt-8">
              <div className="px-2">
                <div className="text-2xl font-black text-slate-900 dark:text-white">40+</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-500">Destinasi</div>
              </div>
              <div className="px-4">
                <div className="text-2xl font-black text-slate-900 dark:text-white">120+</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-500">Kuliner</div>
              </div>
              <div className="px-4">
                <div className="text-2xl font-black text-slate-900 dark:text-white">24/7</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-500">Transportasi</div>
              </div>
            </div>
          </div>

          {/* Bento Grid - Right Side */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              
              {/* Large Image Card - Tugu */}
              <div className="group relative h-[300px] sm:h-[400px] overflow-hidden rounded-3xl sm:col-span-2 shadow-2xl">
                <Image 
                  src="/assets/images/tugu-selamat-datang.png" 
                  alt="Tugu Selamat Datang Kota Depok" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-8 transform transition-transform duration-300 group-hover:-translate-y-2">
                  <div className="mb-3 inline-block rounded-lg bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider text-white border border-white/20">
                    Landmark
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">Tugu Selamat Datang</h3>
                  <p className="mt-2 text-sm text-slate-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100 line-clamp-2">
                    Ikon penyambutan kebanggaan Kota Depok dengan arsitektur modern bernuansa lokal.
                  </p>
                </div>
              </div>

              {/* Smaller Cards */}
              <Link href="/city-guide?category=wisata-buatan" className="group relative h-[220px] overflow-hidden rounded-3xl bg-slate-900 shadow-xl border border-slate-800 transition-all hover:border-sky-500/50 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]">
                <Image 
                  src="/assets/images/alun-alun.png" 
                  alt="Alun-Alun Kota Depok" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 backdrop-blur-md text-sky-400 mb-3 border border-sky-500/30">
                    <i className="ri-map-pin-2-line text-lg"></i>
                  </div>
                  <h3 className="text-xl font-bold text-white">Wisata & Rekreasi</h3>
                  <p className="mt-1 text-sm text-slate-400 group-hover:text-sky-200 transition-colors">Alun-alun, Taman, Sejarah</p>
                </div>
              </Link>

              <div className="grid grid-rows-2 gap-4 lg:gap-6">
                <Link href="/city-guide?category=wisata-kuliner" className="group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-slate-900 p-5 shadow-xl border border-slate-800 transition-all hover:bg-slate-800 hover:border-amber-500/50">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500">
                    <i className="ri-restaurant-2-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">Surga Kuliner</h3>
                    <p className="mt-1 text-xs text-slate-400">Rasa otentik khas daerah</p>
                  </div>
                </Link>
                
                <Link href="/city-guide?category=tempat-menginap" className="group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-slate-900 p-5 shadow-xl border border-slate-800 transition-all hover:bg-slate-800 hover:border-indigo-500/50">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-500">
                    <i className="ri-hotel-bed-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">Akomodasi</h3>
                    <p className="mt-1 text-xs text-slate-400">Nyaman & strategis</p>
                  </div>
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
