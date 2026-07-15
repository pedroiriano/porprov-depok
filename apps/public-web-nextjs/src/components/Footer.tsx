import Image from "next/image";
import Link from "next/link";

const primaryLinks = [
  { href: "/", label: "Beranda" },
  { href: "/cabor", label: "Cabang Olahraga" },
  { href: "/venue", label: "Venue Pertandingan" },
  { href: "/jadwal", label: "Jadwal Tanding" },
  { href: "/medali", label: "Klasemen Medali" },
];

const informationLinks = [
  { href: "/#panduan-penonton", label: "Panduan Penonton" },
  { href: "/#tuan-rumah", label: "Tuan Rumah & Maskot" },
  { href: "/#informasi", label: "Pusat Informasi" },
  { href: "/livescore", label: "LiveScore Center" },
];

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-slate-950 text-slate-200">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/70 to-transparent" aria-hidden="true" />
      <div className="container relative py-14 md:py-18">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-12 lg:col-span-5">
            <Link href="/" className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" aria-label="Beranda PORPROV XV Jawa Barat 2026">
              <Image src="/assets/images/logo-porprov-dan-tulisan.png" className="h-10 w-auto object-contain brightness-0 invert" width={220} height={44} alt="PORPROV XV Jawa Barat 2026" />
            </Link>
            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-300 md:text-base">
              Portal informasi PORPROV XV Jawa Barat 2026 di Kota Depok untuk jadwal, venue, cabang olahraga, klasemen, dan pembaruan pertandingan.
            </p>
            <a href="https://diskominfo.depok.go.id/" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-primary-400 hover:bg-primary-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <i className="ri-global-line me-2 text-lg" aria-hidden="true" />
              Diskominfo Kota Depok
              <span className="sr-only"> (dibuka di tab baru)</span>
            </a>
          </div>

          <nav className="md:col-span-4 lg:col-span-2" aria-label="Pintasan footer">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Pintasan</h2>
            <ul className="mt-5 space-y-3">
              {primaryLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-11 items-center text-sm text-slate-300 transition hover:translate-x-1 hover:text-white">
                    <i className="ri-arrow-right-s-line me-1 text-primary-300" aria-hidden="true" /> {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-4 lg:col-span-2" aria-label="Informasi footer">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Informasi</h2>
            <ul className="mt-5 space-y-3">
              {informationLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-11 items-center text-sm text-slate-300 transition hover:translate-x-1 hover:text-white">
                    <i className="ri-arrow-right-s-line me-1 text-primary-300" aria-hidden="true" /> {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4 lg:col-span-3">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Status Portal</h2>
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                <span className="size-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" aria-hidden="true" />
                Informasi publik aktif
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">Data pertandingan diperbarui dari service resmi panitia melalui API Gateway.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container flex flex-col gap-3 py-6 text-center text-sm text-slate-400 md:flex-row md:items-center md:justify-between md:text-start">
          <p>© {new Date().getFullYear()} PORPROV XV Jawa Barat 2026.</p>
          <p>Dikelola oleh Diskominfo Kota Depok untuk masyarakat Jawa Barat.</p>
        </div>
      </div>
    </footer>
  );
}
