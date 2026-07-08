// Server Component to fetch data
export default async function CaborPage() {
  // SSR fetch to API Gateway
  let cabors = [];
  try {
    const res = await fetch('http://localhost:8080/api/v1/master-data/cabors', {
      cache: 'no-store', // Disable cache for realtime data in development
    });
    if (res.ok) {
      cabors = await res.json();
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cabors.map((cabor: any) => (
            <div key={cabor.id} className="glass rounded-xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-md border border-white/40">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-4 text-primary-600 font-bold text-xl group-hover:scale-110 transition-transform">
                  {cabor.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{cabor.name}</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                  {cabor.description?.String || 'Cabang olahraga resmi PORPROV XV.'}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
                    ID: {cabor.id.substring(0, 8)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
