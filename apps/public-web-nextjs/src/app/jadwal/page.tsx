import { Calendar, Filter, Search, MapPin, Clock } from "lucide-react";

export default function Jadwal() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Jadwal Pertandingan</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Filter dan pantau jadwal dari 64 Cabang Olahraga.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari atlet, cabor, venue..." 
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* Date Carousel (Horizontal scroll) */}
      <div className="flex overflow-x-auto gap-3 pb-4 mb-6 scrollbar-hide">
        {["12 Nov", "13 Nov", "14 Nov", "15 Nov", "16 Nov", "17 Nov", "18 Nov"].map((date, idx) => (
          <button 
            key={idx}
            className={`flex-none flex flex-col items-center justify-center px-6 py-3 rounded-xl border transition-all ${
              idx === 2 
                ? "bg-primary-500 text-white border-primary-600 shadow-md" 
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-300"
            }`}
          >
            <span className={`text-xs font-medium mb-1 ${idx === 2 ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
              {idx === 2 ? "HARI INI" : "Rabu"}
            </span>
            <span className="font-bold whitespace-nowrap">{date}</span>
          </button>
        ))}
      </div>

      {/* Schedule List */}
      <div className="flex flex-col gap-6">
        {/* Group by Cabor */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center">🏸</div>
            Bulutangkis
          </h2>
          
          <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                {/* Time & Status */}
                <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 sm:w-24 shrink-0 border-b sm:border-b-0 border-slate-100 dark:border-slate-800 pb-3 sm:pb-0">
                  <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-bold">
                    <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" /> 09:00
                  </div>
                  {i === 1 ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 uppercase tracking-wider animate-pulse-subtle">Live</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">Tunda</span>
                  )}
                </div>
                
                {/* Match Details */}
                <div className="flex-1 flex flex-col gap-3">
                  <div className="text-xs font-semibold text-primary-600 dark:text-primary-400">Tunggal Putra - Perempat Final</div>
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                        <span className="font-semibold text-sm">A. Ginting (KOTA DEPOK)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                        <span className="font-semibold text-sm">J. Christie (KOTA BANDUNG)</span>
                      </div>
                    </div>
                    {i === 1 && (
                      <div className="flex flex-col gap-2 shrink-0 text-right font-mono font-bold text-lg border-l border-slate-200 dark:border-slate-700 pl-4">
                        <span className="text-primary-600 dark:text-primary-400">1</span>
                        <span className="text-slate-500 dark:text-slate-400">0</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <MapPin className="w-3 h-3" /> GOR Balai Kota Depok
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
