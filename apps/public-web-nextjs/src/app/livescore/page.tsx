import { Activity, Clock } from "lucide-react";

export default function LiveScore() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-red-500 animate-pulse-subtle" />
            </div>
            LiveScore
          </h1>
          <p className="text-text-muted mt-2">Pembaruan skor secara real-time dari seluruh venue.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card bg-background-surface border-l-4 border-l-red-500 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  ⚽ Sepak Bola <span className="w-1 h-1 bg-slate-300 rounded-full"></span> Penyisihan Grup A
                </span>
                <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 45+2'
                </span>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-lg">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <span className="font-semibold">Kota Depok</span>
                  </div>
                  <span className="text-2xl font-black text-text-primary">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-lg">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <span className="font-medium text-text-secondary">Kab. Bogor</span>
                  </div>
                  <span className="text-2xl font-black text-text-secondary">1</span>
                </div>
                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/50 text-xs text-text-muted">
                  <span className="text-primary-600 dark:text-primary-400 font-medium mr-2">32' Goal!</span> Kota Depok mencetak angka via tendangan penalti.
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Mini Standings & Updates */}
        <div className="flex flex-col gap-6">
          <div className="glass-card p-5 bg-background-surface border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold mb-4">Pembaruan Terkini</h3>
            <div className="flex flex-col gap-4 relative">
              <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800"></div>
              {[
                { time: "14:32", text: "Pertandingan Sepak Bola (Depok vs Bogor) dilanjutkan babak kedua." },
                { time: "14:15", text: "Emas pertama untuk Kota Bandung di cabor Renang 100m." },
                { time: "14:00", text: "Cuaca buruk, cabor Panahan ditunda sementara." }
              ].map((ev, i) => (
                <div key={i} className="flex gap-4 relative z-10">
                  <div className="w-3.5 h-3.5 rounded-full bg-primary-500 mt-1 shrink-0 ring-4 ring-background-surface"></div>
                  <div>
                    <div className="text-xs font-bold text-text-muted mb-0.5">{ev.time}</div>
                    <div className="text-sm">{ev.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
