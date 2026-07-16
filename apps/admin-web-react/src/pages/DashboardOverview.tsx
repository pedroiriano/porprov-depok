import { useState, useEffect, useCallback } from 'react';
import { Users, Trophy, Activity, AlertTriangle } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { apiClient, authConfig, unwrapApiData } from '../lib/api';

const StatCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
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
    } catch (error) {
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Atlet Terdaftar" 
          value="4,210" 
          icon={Users} 
          trend="+12%" 
          colorClass="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Medali Didistribusikan" 
          value="156" 
          icon={Trophy} 
          trend="+45" 
          colorClass="bg-yellow-100 text-yellow-600" 
        />
        <StatCard 
          title="Skor Masuk (Hari Ini)" 
          value="892" 
          icon={Activity} 
          trend="+210" 
          colorClass="bg-emerald-100 text-emerald-600" 
        />
        <StatCard 
          title="Insiden Sistem" 
          value="3" 
          icon={AlertTriangle} 
          trend="-2" 
          colorClass="bg-red-100 text-red-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Matches */}
        <div className="card col-span-2">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-lg">Pertandingan Sedang Berlangsung</h3>
            <button className="text-sm text-indigo-600 font-medium hover:underline">Lihat Semua</button>
          </div>
          <div className="p-0">
            <div className="table-container border-none rounded-none">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell">Waktu</th>
                    <th className="table-cell">Cabang Olahraga</th>
                    <th className="table-cell">Pertandingan</th>
                    <th className="table-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { time: '14:00', cabor: 'Sepak Bola', match: 'Depok vs Bogor', status: 'Live' },
                    { time: '14:30', cabor: 'Bulutangkis', match: 'Ginting vs Jojo', status: 'Live' },
                    { time: '15:00', cabor: 'Renang', match: 'Final 100m Gaya Bebas', status: 'Menunggu' },
                  ].map((item, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell font-medium">{item.time}</td>
                      <td className="table-cell text-text-secondary">{item.cabor}</td>
                      <td className="table-cell font-semibold">{item.match}</td>
                      <td className="table-cell">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          item.status === 'Live' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="card p-5 flex flex-col h-full">
          <h3 className="font-bold text-lg mb-4">Log Sistem Terkini</h3>
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
        </div>
      </div>
    </div>
  );
}
