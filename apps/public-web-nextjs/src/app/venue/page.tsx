import { MapPin, Users, Activity, CheckCircle2 } from "lucide-react";

export default async function VenuePage() {
  let venues = [];
  try {
    const res = await fetch('http://localhost:8080/api/v1/venues', {
      cache: 'no-store', // Disable cache for realtime data in development
    });
    if (res.ok) {
      venues = await res.json();
    }
  } catch (error) {
    console.error("Gagal memuat venue dari API:", error);
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Venue & Lokasi Pertandingan</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Jelajahi fasilitas olahraga kelas dunia di Kota Depok yang akan menjadi saksi sejarah PORPROV XV Jawa Barat 2026.
        </p>
      </div>

      {venues.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center rounded-2xl max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <MapPin className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Belum Ada Data Venue</h2>
          <p className="text-slate-500">Data venue pertandingan sedang disiapkan oleh panitia pelaksana.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px]">
          {venues.map((venue: any) => (
            <div key={venue.id} className="group relative rounded-md shadow dark:shadow-gray-800 bg-white dark:bg-slate-900 overflow-hidden transition duration-500 hover:shadow-md hover:dark:shadow-gray-700">
              
              {/* Image Header */}
              <div className="relative h-64 overflow-hidden">
                {venue.image_url ? (
                  <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <MapPin className="w-16 h-16 text-slate-300 dark:text-slate-700" />
                  </div>
                )}
                <div className="absolute top-4 end-4 px-3 py-1 bg-white dark:bg-slate-900 rounded-md shadow dark:shadow-gray-800 text-sm font-semibold text-indigo-600">
                  {venue.readiness_status || 'Persiapan'}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold hover:text-indigo-600 transition-colors mb-2">
                  {venue.name}
                </h3>
                
                <div className="flex items-start text-slate-400 mb-4">
                  <MapPin className="w-4 h-4 me-2 shrink-0 mt-0.5" />
                  <p className="text-sm">{venue.address || 'Alamat belum tersedia'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-indigo-600 me-2" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{venue.capacity > 0 ? `${venue.capacity} Kursi` : '-'}</div>
                      <div className="text-xs text-slate-400">Kapasitas</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 text-indigo-600 me-2" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1" title={venue.facilities}>
                        {venue.facilities || '-'}
                      </div>
                      <div className="text-xs text-slate-400">Fasilitas</div>
                    </div>
                  </div>
                </div>

                {/* Interactive Map Iframe */}
                <div className="h-48 rounded-md overflow-hidden shadow dark:shadow-gray-800 relative w-full mb-4">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent((venue.latitude && venue.longitude) ? `${venue.latitude},${venue.longitude}` : (venue.name + ' Depok'))}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
                </div>
                
                {venue.map_route_url && (
                   <a href={venue.map_route_url} target="_blank" rel="noreferrer" className="btn bg-indigo-600 hover:bg-indigo-700 border-indigo-600 hover:border-indigo-700 text-white rounded-md w-full">
                     <i className="ri-map-pin-line align-middle me-2"></i> Buka di Google Maps
                   </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
