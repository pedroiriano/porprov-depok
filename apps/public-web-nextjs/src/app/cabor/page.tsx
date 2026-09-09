import type { Metadata } from "next";
import { publicApiUrl, unwrapCollection } from "@/lib/public-api";
import { normalizeCabor, type CaborModel, type RawCabor } from "@/lib/public-models";
import { CaborDirectory } from "@/components/CaborDirectory";
import { PublicPageHero } from "@/components/PublicPageHero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cabang Olahraga",
  description: "Daftar cabang olahraga, nomor pertandingan, venue, dan jadwal PORPROV XV Jawa Barat 2026 di Kota Depok.",
  alternates: { canonical: "/cabor" },
};

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
    <main className="bg-slate-50 dark:bg-slate-950">
      <PublicPageHero eyebrow="Master Data Resmi" title="Cabang Olahraga" description="Kenali nomor pertandingan, venue, serta agenda setiap cabang olahraga PORPROV XV Jawa Barat 2026 di Kota Depok." icon="ri-basketball-line" breadcrumbs={[{ label: "Cabang Olahraga" }]} />
      {cabors.length === 0 ? (
        <div className="container my-14 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900/60" role={unavailable ? "alert" : "status"}>
          <h2 className="text-xl font-black">{unavailable ? "Data cabor belum dapat dihubungi" : "Data cabor belum tersedia"}</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{unavailable ? "Periksa API Gateway dan Master Data Service." : "Data akan tampil setelah dipublikasikan panitia."}</p>
        </div>
      ) : <CaborDirectory cabors={cabors} />}
    </main>
  );
}
