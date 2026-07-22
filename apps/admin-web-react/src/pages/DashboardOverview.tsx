import { useState, useEffect, useCallback } from 'react';
import { Users, Trophy, Activity, AlertTriangle, type LucideIcon } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { apiClient, authConfig, unwrapApiData } from '../lib/api';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  colorClass: string;
}

const StatCard = ({ title, value, icon: Icon, trend, colorClass }: StatCardProps) => (
  <div className="card p-6 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-text-muted mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-text-primary">{value}</h3>
      <p className={`text-xs font-medium mt-2 ${trend.startsWith('+') ? 'text-success-500' : 'text-danger-500'}`}>
        {trend} dibanding kemarin
      </p>
    </div>
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function DashboardOverview() {
  const auth = useAuth();
  const token = auth.user?.access_token;
  
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');

  const loadLogs = useCallback(async () => {
    if (!token) return;
    setLogsLoading(true);
    setLogsError('');
    try {
      const response = await apiClient.get('/audit/logs?limit=10', authConfig(token));
      setLogs(unwrapApiData<any[]>(response.data) || []);
    } catch {
      setLogsError('Gagal memuat log sistem terkini.');
    } finally {
      setLogsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Workspace Panitia</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Dashboard Operasional</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Pantau pertandingan, aktivitas sistem, dan pekerjaan penting dalam satu layar.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Atlet Terdaftar" 
          value="4,210" 
          icon={Users} 
          trend="+12%" 
          colorClass="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
        />
        <StatCard 
          title="Medali Didistribusikan" 
          value="156" 
          icon={Trophy} 
          trend="+45" 
          colorClass="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
        />
        <StatCard 
          title="Skor Masuk (Hari Ini)" 
          value="892" 
          icon={Activity} 
          trend="+210" 
          colorClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
        />
        <StatCard 
          title="Insiden Sistem" 
          value="3" 
          icon={AlertTriangle} 
          trend="-2" 
          colorClass="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Matches */}
        <section className="card lg:col-span-2" aria-labelledby="active-match-title">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 id="active-match-title" className="font-bold text-lg">Pertandingan Sedang Berlangsung</h2>
            <button type="button" className="min-h-11 rounded-md px-3 text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/10">Lihat Semua</button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="p-4">Waktu</th>
                    <th className="p-4">Cabang Olahraga</th>
                    <th className="p-4">Pertandingan</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {[
                    { time: '14:00', cabor: 'Sepak Bola', match: 'Depok vs Bogor', status: 'Live' },
                    { time: '14:30', cabor: 'Bulutangkis', match: 'Ginting vs Jojo', status: 'Live' },
                    { time: '15:00', cabor: 'Renang', match: 'Final 100m Gaya Bebas', status: 'Menunggu' },
                  ].map((item, i) => (
                    <tr key={i} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="p-4 font-medium">{item.time}</td>
                      <td className="p-4 text-text-secondary">{item.cabor}</td>
                      <td className="p-4 font-semibold">{item.match}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          item.status === 'Live' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </section>

        {/* System Logs */}
        <section className="card p-5 flex flex-col h-full" aria-labelledby="system-log-title">
          <h2 id="system-log-title" className="font-bold text-lg mb-4">Log Sistem Terkini</h2>
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
            {logsLoading ? (
              <div className="flex justify-center py-4"><span className="text-sm text-text-muted">Memuat log...</span></div>
            ) : logsError ? (
              <div className="flex justify-center py-4"><span className="text-sm text-danger-500">{logsError}</span></div>
            ) : logs.length === 0 ? (
              <div className="flex justify-center py-4"><span className="text-sm text-text-muted">Tidak ada log terbaru.</span></div>
            ) : logs.map((log) => (
              <div key={log.id} className="flex gap-3 items-start">
                <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${
                  log.action === 'CREATE' ? 'bg-success-500' : log.action === 'UPDATE' ? 'bg-warning-500' : log.action === 'DELETE' ? 'bg-danger-500' : 'bg-blue-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium">
                    <span className="font-bold">{log.actor_id || 'Sistem'}</span> melakukan {log.action} pada data {log.entity_name}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{new Date(log.created_at).toLocaleString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
