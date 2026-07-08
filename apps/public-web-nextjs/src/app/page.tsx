import { Trophy, Calendar, MapPin, ChevronRight, Activity } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";

export default function Home() {
  // PORPROV XV starts on November 7, 2026
  const targetDate = "2026-11-07T00:00:00+07:00";

  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-sports min-h-[500px] flex items-center">
        {/* Abstract Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-accent-500 blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 md:py-20 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-subtle"></span>
              Menuju Pembukaan PORPROV XV
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6 text-shadow-sm">
              Semangat Juara di <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-500 to-yellow-300">
                Kota Depok
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto md:mx-0">
              Saksikan ribuan atlet terbaik Jawa Barat memperebutkan kejayaan dalam 64 cabang olahraga bergengsi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button className="px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2">
                Lihat Jadwal <Calendar className="w-5 h-5" />
              </button>
              <button className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold transition-all backdrop-blur-md flex items-center justify-center gap-2">
                Jelajahi Venue <MapPin className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Countdown Widget */}
          <div className="w-full md:w-auto mt-8 md:mt-0">
            <div className="p-6 md:p-8 bg-white/10 border border-white/20 text-white min-w-[320px] rounded-3xl backdrop-blur-xl shadow-2xl">
              <h3 className="text-center font-bold text-blue-100 mb-2 uppercase tracking-wider text-sm">Hitung Mundur Pembukaan</h3>
              <p className="text-center text-blue-200/70 text-xs mb-6">Waktu Indonesia Barat (GMT+7)</p>
              <CountdownTimer targetDate={targetDate} />
            </div>
          </div>
        </div>
      </section>

      {/* Live Now Section (Flashscore Inspired) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-red-500 animate-pulse-subtle" />
            </div>
            <h2 className="text-2xl font-bold">Sedang Berlangsung</h2>
          </div>
          <a href="/livescore" className="text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center text-sm">
            Lihat Semua <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="uppercase tracking-wider">Bulutangkis - Final</span>
                <span className="text-red-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-subtle"></span> Set 2</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <span className="font-medium">Kota Depok</span>
                  </div>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">21</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <span className="font-medium">Kota Bandung</span>
                  </div>
                  <span className="text-xl font-bold text-slate-500 dark:text-slate-400">18</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Standings Mini */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold">Klasemen Medali Sementara</h2>
          </div>
          <a href="/medali" className="text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center text-sm">
            Klasemen Lengkap <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </div>
        
        <div className="glass-card overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-semibold">Peringkat</th>
                  <th className="p-4 font-semibold">Kontingen</th>
                  <th className="p-4 font-semibold text-center text-yellow-500">Emas</th>
                  <th className="p-4 font-semibold text-center text-slate-400">Perak</th>
                  <th className="p-4 font-semibold text-center text-amber-700">Perunggu</th>
                  <th className="p-4 font-semibold text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {[
                  { rank: 1, name: "Kota Depok", gold: 45, silver: 30, bronze: 25 },
                  { rank: 2, name: "Kota Bandung", gold: 42, silver: 35, bronze: 30 },
                  { rank: 3, name: "Kab. Bogor", gold: 38, silver: 20, bronze: 15 },
                ].map((item) => (
                  <tr key={item.rank} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 font-bold text-center w-16">{item.rank}</td>
                    <td className="p-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                      {item.name}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-900 dark:text-slate-100">{item.gold}</td>
                    <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">{item.silver}</td>
                    <td className="p-4 text-center font-bold text-slate-500 dark:text-slate-400">{item.bronze}</td>
                    <td className="p-4 text-center font-black text-primary-600 dark:text-primary-400">
                      {item.gold + item.silver + item.bronze}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
