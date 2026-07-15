import Link from "next/link";
import { publicApiUrl, unwrapCollection } from "@/lib/public-api";
import { normalizeCabor, type CaborModel, type RawCabor } from "@/lib/public-models";

export const dynamic = "force-dynamic";

export default async function CaborPage() {
  let cabors: CaborModel[] = [];
  let unavailable = false;
  try {
    const response = await fetch(publicApiUrl("/master-data/cabors"), { cache: "no-store" });
    if (!response.ok) throw new Error(`API ${response.status}`);
    cabors = unwrapCollection<RawCabor>(await response.json()).map(normalizeCabor);
  } catch (error) {
    unavailable = true;
    console.error("Gagal memuat cabor dari API:", error);
  }

  return (
    <main className="container py-32 md:py-40">
      <header className="max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-primary-500">Master Data Resmi</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Cabang Olahraga</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">Kenali nomor pertandingan, venue, serta agenda setiap cabang olahraga PORPROV XV Jawa Barat 2026 di Kota Depok.</p>
      </header>

      {cabors.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/60" role={unavailable ? "alert" : "status"}>
          <h2 className="text-xl font-black">{unavailable ? "Data cabor belum dapat dihubungi" : "Data cabor belum tersedia"}</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{unavailable ? "Periksa API Gateway dan Master Data Service." : "Data akan tampil setelah dipublikasikan panitia."}</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-[30px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cabors.map((cabor) => (
            <Link key={cabor.id} href={`/cabor/${encodeURIComponent(cabor.id)}`} className="group flex min-h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:border-slate-800 dark:bg-slate-900">
              <span className="mx-auto flex size-20 items-center justify-center overflow-hidden rounded-full bg-primary-500/10 text-3xl text-primary-600 dark:text-primary-300">
                {cabor.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cabor.iconUrl} alt="" className="size-12 object-contain" />
                ) : <i className="ri-medal-fill" aria-hidden="true" />}
              </span>
              <h2 className="mt-6 text-xl font-black transition group-hover:text-primary-600 dark:group-hover:text-primary-300">{cabor.name}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{cabor.description}</p>
              <span className="mt-auto pt-5 text-xs font-black uppercase tracking-wider text-primary-600 dark:text-primary-300">{cabor.category} · Lihat detail</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
