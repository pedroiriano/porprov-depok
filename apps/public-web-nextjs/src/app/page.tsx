import Image from "next/image";
import Link from "next/link";
import { HeroSection } from "@/components/HeroSection";
import { VenueShowcase } from "@/components/VenueShowcase";

const informationLinks = [
  {
    href: "/livescore",
    icon: "ri-live-line",
    eyebrow: "Realtime",
    title: "LiveScore Center",
    description: "Ikuti perubahan skor dan status pertandingan dari arena.",
    accent: "from-red-500/20 to-orange-500/5 text-red-500",
  },
  {
    href: "/jadwal",
    icon: "ri-calendar-event-line",
    eyebrow: "Terjadwal",
    title: "Jadwal Pertandingan",
    description: "Temukan waktu bertanding berdasarkan tanggal dan cabang olahraga.",
    accent: "from-sky-500/20 to-cyan-500/5 text-sky-500",
  },
  {
    href: "/medali",
    icon: "ri-medal-line",
    eyebrow: "Klasemen",
    title: "Perolehan Medali",
    description: "Pantau perjalanan kontingen dalam perebutan podium Jawa Barat.",
    accent: "from-amber-500/20 to-yellow-500/5 text-amber-500",
  },
  {
    href: "/cabor",
    icon: "ri-basketball-line",
    eyebrow: "Eksplorasi",
    title: "Cabang Olahraga",
    description: "Kenali cabang dan nomor pertandingan PORPROV XV 2026.",
    accent: "from-emerald-500/20 to-teal-500/5 text-emerald-500",
  },
];

export default function Home() {
  return (
    <>
      <HeroSection />

      <section id="tuan-rumah" className="relative py-16 md:py-24" aria-labelledby="host-title">
        <div className="container relative">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-[30px]">
            <div className="md:col-span-6">
              <div className="relative mx-auto max-w-xl">
                <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-primary-500/20 via-transparent to-amber-400/20 blur-2xl sm:-inset-4" aria-hidden="true" />
                <div className="grid grid-cols-2 items-end gap-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <Image src="/assets/images/maskot-toca.png" width={400} height={500} className="h-72 w-full object-contain md:h-96" alt="Toca, maskot PORPROV XV Jawa Barat 2026" />
                    <p className="mt-3 text-center text-sm font-black uppercase tracking-[0.18em] text-primary-500">Toca</p>
                  </div>
                  <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <Image src="/assets/images/maskot-toci.png" width={400} height={500} className="h-64 w-full object-contain md:h-80" alt="Toci, maskot PORPROV XV Jawa Barat 2026" />
                    <p className="mt-3 text-center text-sm font-black uppercase tracking-[0.18em] text-amber-500">Toci</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-6">
              <div className="lg:ms-6">
                <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-primary-500">Tuan Rumah PORPROV XV</p>
                <h2 id="host-title" className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
                  Selamat datang di
                  <span className="block text-primary-500">Kota Depok.</span>
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
                  Depok menyambut kontingen dari seluruh Jawa Barat dengan arena pertandingan, konektivitas kota, dan keramahan warga untuk pengalaman olahraga yang berkesan.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <Link href="/venue" className="group flex min-h-32 items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-700">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-2xl text-primary-500 transition group-hover:bg-primary-500 group-hover:text-white">
                      <i className="ri-map-pin-line" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-lg font-bold">Lokasi Utama</span>
                      <span className="mt-1 block text-sm leading-relaxed text-slate-500 dark:text-slate-400">Alun-Alun Kota Depok dan seluruh venue pertandingan.</span>
                      <span className="mt-3 inline-flex items-center text-sm font-bold text-primary-500">Lihat lokasi <i className="ri-arrow-right-line ms-1 transition group-hover:translate-x-1" aria-hidden="true" /></span>
                    </span>
                  </Link>

                  <Link href="/cabor" className="group flex min-h-32 items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-2xl text-amber-500 transition group-hover:bg-amber-500 group-hover:text-white">
                      <i className="ri-medal-line" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-lg font-bold">Cabang Olahraga</span>
                      <span className="mt-1 block text-sm leading-relaxed text-slate-500 dark:text-slate-400">Jelajahi cabang dan nomor yang dipertandingkan.</span>
                      <span className="mt-3 inline-flex items-center text-sm font-bold text-amber-500">Lihat cabor <i className="ri-arrow-right-line ms-1 transition group-hover:translate-x-1" aria-hidden="true" /></span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="informasi" className="relative scroll-mt-24 overflow-hidden py-16 md:py-24" aria-labelledby="information-title">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" aria-hidden="true" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-primary-500">Pusat Informasi Pertandingan</p>
            <h2 id="information-title" className="text-3xl font-black tracking-tight md:text-4xl">Semua informasi penting dalam satu lintasan.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-300">Akses cepat untuk penonton, atlet, kontingen, media, dan masyarakat Jawa Barat.</p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {informationLinks.map((item) => (
              <Link key={item.href} href={item.href} className="group relative min-h-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:border-slate-800 dark:bg-slate-900">
                <div className={`absolute inset-0 -z-0 bg-gradient-to-br opacity-70 ${item.accent}`} aria-hidden="true" />
                <div className="relative z-10">
                  <span className={`flex size-14 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-sm dark:bg-slate-950/70 ${item.accent.split(" ").at(-1)}`}>
                    <i className={item.icon} aria-hidden="true" />
                  </span>
                  <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{item.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.description}</p>
                  <span className="mt-5 inline-flex items-center text-sm font-bold text-primary-500">Buka informasi <i className="ri-arrow-right-line ms-1 transition group-hover:translate-x-1" aria-hidden="true" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <VenueShowcase />

      <section id="panduan-penonton" className="relative scroll-mt-24 overflow-hidden py-16 md:py-24" aria-labelledby="spectator-title">
        <div className="container relative">
          <div className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
            <div className="grid items-stretch lg:grid-cols-12">
              <div className="relative min-h-72 lg:col-span-5 lg:min-h-[430px]">
                <Image src="/assets/images/peta-venue.png" alt="Ilustrasi peta venue PORPROV di Kota Depok" fill sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-950" aria-hidden="true" />
              </div>
              <div className="relative flex flex-col justify-center p-7 sm:p-10 lg:col-span-7 lg:p-14">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">Panduan Penonton</p>
                <h2 id="spectator-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Rencanakan hari pertandingan Anda.</h2>
                <p className="mt-4 max-w-2xl leading-relaxed text-slate-300">Periksa venue dan jadwal sebelum berangkat. Informasi rute, kapasitas, fasilitas, dan kesiapan arena diperbarui dari sistem panitia.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/venue" className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                    <i className="ri-road-map-line me-2 text-lg" aria-hidden="true" /> Lihat Semua Venue
                  </Link>
                  <Link href="/jadwal" className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/30 px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                    <i className="ri-calendar-check-line me-2 text-lg" aria-hidden="true" /> Susun Agenda
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
