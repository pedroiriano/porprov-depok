import { Trophy } from "lucide-react";

export default function Medali() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            Klasemen Medali
          </h1>
          <p className="text-text-muted mt-2">Daftar perolehan medali resmi secara nasional per Kontingen.</p>
        </div>
      </div>

      <div className="glass-card bg-background-surface border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 text-sm uppercase tracking-wider text-text-muted border-b border-slate-200 dark:border-slate-800">
                <th className="p-5 font-semibold text-center w-20">Rank</th>
                <th className="p-5 font-semibold">Kontingen Daerah</th>
                <th className="p-5 font-semibold text-center">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center mx-auto border border-yellow-300">
                    🥇
                  </div>
                </th>
                <th className="p-5 font-semibold text-center">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto border border-slate-400">
                    🥈
                  </div>
                </th>
                <th className="p-5 font-semibold text-center">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mx-auto border border-amber-600">
                    🥉
                  </div>
                </th>
                <th className="p-5 font-semibold text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {[
                { rank: 1, name: "Kota Depok", gold: 45, silver: 30, bronze: 25 },
                { rank: 2, name: "Kota Bandung", gold: 42, silver: 35, bronze: 30 },
                { rank: 3, name: "Kab. Bogor", gold: 38, silver: 20, bronze: 15 },
                { rank: 4, name: "Kota Bekasi", gold: 20, silver: 22, bronze: 30 },
                { rank: 5, name: "Kab. Bekasi", gold: 18, silver: 19, bronze: 15 },
              ].map((item, idx) => (
                <tr key={item.rank} className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 ${idx === 0 ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                  <td className="p-5 font-bold text-center">
                    {idx === 0 ? (
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 mx-auto font-black">1</span>
                    ) : (
                      <span className="text-text-muted">{item.rank}</span>
                    )}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"></div>
                      <span className="font-bold text-lg">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-5 text-center font-black text-xl text-text-primary">{item.gold}</td>
                  <td className="p-5 text-center font-bold text-lg text-text-secondary">{item.silver}</td>
                  <td className="p-5 text-center font-bold text-lg text-text-muted">{item.bronze}</td>
                  <td className="p-5 text-center font-black text-2xl text-primary-600 dark:text-primary-400 bg-slate-50 dark:bg-slate-900/30">
                    {item.gold + item.silver + item.bronze}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
