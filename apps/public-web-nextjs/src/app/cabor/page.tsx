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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[30px]">
          {cabors.map((cabor: any) => (
            <div key={cabor.id} className="group relative rounded-md shadow dark:shadow-gray-800 bg-white dark:bg-slate-900 overflow-hidden text-center p-6 transition duration-500 hover:shadow-md hover:dark:shadow-gray-700">
              <div className="w-20 h-20 bg-indigo-600/5 text-indigo-600 rounded-full text-3xl flex align-middle justify-center items-center shadow-sm dark:shadow-gray-800 mx-auto">
                {cabor.icon_url?.String ? (
                  <img src={cabor.icon_url.String} alt={cabor.name} className="w-12 h-12 object-contain" />
                ) : (
                  <i className="ri-medal-fill"></i>
                )}
              </div>
              <div className="content mt-6">
                <h4 className="text-lg font-medium hover:text-indigo-600 mb-2 transition duration-500">
                  {cabor.name}
                </h4>
                <p className="text-slate-400 mb-4 line-clamp-2">
                  {cabor.description?.String || 'Cabang olahraga resmi PORPROV XV Jawa Barat 2026 yang akan dipertandingkan.'}
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
