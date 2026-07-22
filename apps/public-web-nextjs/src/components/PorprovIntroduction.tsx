import Image from "next/image";
import Link from "next/link";

const purposes = [
  {
    icon: "ri-user-star-line",
    title: "Penjaringan Bakat",
    description: "Menemukan potensi atlet terbaik dari berbagai daerah di Jawa Barat.",
  },
  {
    icon: "ri-shield-star-line",
    title: "Pembinaan Atlet",
    description: "Menjadi panggung pembinaan, pengalaman bertanding, dan peningkatan prestasi.",
  },
  {
    icon: "ri-trophy-line",
    title: "Menuju Kompetisi Nasional",
    description: "Mempersiapkan atlet daerah untuk melangkah menuju kompetisi nasional seperti PON.",
  },
];

export function PorprovIntroduction() {
  return (
    <section id="tentang-porprov" className="relative scroll-mt-24 overflow-hidden py-16 md:py-24" aria-labelledby="porprov-introduction-title">
      <div className="absolute -start-32 top-12 size-72 rounded-full bg-primary-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -end-24 bottom-0 size-72 rounded-full bg-amber-400/10 blur-3xl" aria-hidden="true" />

      <div className="container relative">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-[30px]">
          <div className="md:col-span-5">
            <div className="relative mx-auto max-w-lg overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-2xl sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.34),transparent_42%)]" aria-hidden="true" />
              <div className="absolute -bottom-20 -end-12 size-56 rounded-full border-[26px] border-red-500/20" aria-hidden="true" />

              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">Pekan Olahraga Provinsi</p>
                <div className="mt-7 rounded-2xl bg-white p-6 shadow-xl sm:p-8">
                  <Image
                    src="/assets/images/logo-porprov-dan-tulisan.png"
                    width={720}
                    height={260}
                    className="mx-auto h-auto w-full object-contain"
                    alt="Logo PORPROV XV Jawa Barat 2026"
                    priority
                  />
                </div>

                <blockquote className="mt-7 border-s-4 border-amber-300 ps-5 text-xl font-black leading-relaxed sm:text-2xl">
                  “Bergerak Bersama Menuju Depok Maju!”
                </blockquote>
                <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-200">
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Multi-event</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Jawa Barat</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">2026</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="lg:ms-8">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-primary-500">Tentang PORPROV XV</p>
              <h2 id="porprov-introduction-title" className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white md:text-5xl">
                Panggung olahraga terbesar di tingkat provinsi.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
                Pekan Olahraga Provinsi adalah ajang multi-event olahraga tingkat provinsi yang diselenggarakan secara periodik oleh Komite Olahraga Nasional Indonesia tingkat provinsi. PORPROV menjadi ruang kompetisi sekaligus jalur pengembangan prestasi atlet daerah.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {purposes.map((purpose) => (
                  <article key={purpose.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-700">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary-500/10 text-xl text-primary-600 dark:text-primary-300">
                      <i className={purpose.icon} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-black text-slate-950 dark:text-white">{purpose.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{purpose.description}</p>
                  </article>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/cabor" className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-500 px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500">
                  <i className="ri-medal-line me-2 text-lg" aria-hidden="true" /> Jelajahi Cabang Olahraga
                </Link>
                <Link href="/jadwal" className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-primary-400 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-primary-500 dark:hover:text-primary-300">
                  <i className="ri-calendar-event-line me-2 text-lg" aria-hidden="true" /> Lihat Jadwal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
