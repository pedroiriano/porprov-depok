import { publicApiUrl, readPgText, resolvePublicAssetUrl, unwrapCollection } from "@/lib/public-api";

interface RawCabor {
  id: string;
  name: string;
  description?: Parameters<typeof readPgText>[0];
  icon_url?: Parameters<typeof readPgText>[0];
  type?: string;
}

// SEO: Listing selalu dirender pada request agar data Master Data terbaru tidak tertahan hasil prerender build.
export const dynamic = "force-dynamic";

// INFO: Server Component mengambil data publik hanya melalui API Gateway.
export default async function CaborPage() {
  let cabors: RawCabor[] = [];
  try {
    const res = await fetch(publicApiUrl("/master-data/cabors"), {
      cache: "no-store",
    });
    if (res.ok) {
      cabors = unwrapCollection<RawCabor>(await res.json());
    }
  } catch (error) {
    console.error("Gagal memuat cabor dari API:", error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Daftar Cabang Olahraga</h1>
        <p className="text-slate-700 dark:text-slate-300 mt-2">Seluruh cabang olahraga yang dipertandingkan pada PORPROV XV Jawa Barat 2026 di Kota Depok.</p>
      </div>

      {cabors.length === 0 ? (
        <div className="glass p-12 text-center rounded-2xl">
          <h2 className="text-xl font-bold text-slate-500 mb-2">Belum Ada Data</h2>
          <p className="text-slate-400">Data cabang olahraga belum tersedia di database atau API sedang luring.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[30px]">
          {cabors.map((cabor) => (
            <div key={cabor.id} className="group relative rounded-md shadow dark:shadow-gray-800 bg-white dark:bg-slate-900 overflow-hidden text-center p-6 transition duration-500 hover:shadow-md hover:dark:shadow-gray-700">
              <div className="w-20 h-20 bg-indigo-600/5 text-indigo-600 rounded-full text-3xl flex align-middle justify-center items-center shadow-sm dark:shadow-gray-800 mx-auto">
                {resolvePublicAssetUrl(cabor.icon_url) ? (
                  // PERFORMANCE: URL ikon berasal dari Media Library runtime.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolvePublicAssetUrl(cabor.icon_url)} alt={`Ikon ${cabor.name}`} className="w-12 h-12 object-contain" />
                ) : (
                  <i className="ri-medal-fill"></i>
                )}
              </div>
              <div className="content mt-6">
                <h4 className="text-lg font-medium hover:text-indigo-600 mb-2 transition duration-500">
                  {cabor.name}
                </h4>
                <p className="text-slate-400 mb-4 line-clamp-2">
                  {readPgText(cabor.description) || "Cabang olahraga resmi PORPROV XV Jawa Barat 2026 yang akan dipertandingkan."}
                </p>
                <span className="text-indigo-600 text-sm font-semibold uppercase tracking-wider">
                  {cabor.type || 'Olahraga'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
