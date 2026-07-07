import { Search, Download, Server } from 'lucide-react';

export default function AuditLog() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Sistem Audit Log</h2>
          <p className="text-text-muted text-sm mt-1">Jejak rekam seluruh aktivitas administratif yang bersifat immutable.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-text-secondary px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
          <Download className="w-4 h-4" /> Export ke CSV
        </button>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50 rounded-t-xl">
          <div className="flex gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari User ID atau Entitas..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select className="bg-white border border-slate-300 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 text-text-secondary font-medium">
              <option>Semua Aksi</option>
              <option>CREATE</option>
              <option>UPDATE</option>
              <option>DELETE</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
            <Server className="w-4 h-4 text-slate-400" /> 
            Terhubung ke Database Audit (PostgreSQL)
          </div>
        </div>

        {/* Table */}
        <div className="table-container border-none rounded-none">
          <table className="table-base">
            <thead className="table-header bg-slate-100/50">
              <tr>
                <th className="table-cell">Waktu (WIB)</th>
                <th className="table-cell">Aktor (User ID)</th>
                <th className="table-cell">Aksi</th>
                <th className="table-cell">Layanan & Entitas</th>
                <th className="table-cell">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {[
                { time: '2026-07-07 14:12:05', user: 'USR-89001', action: 'CREATE', service: 'master-data', entity: 'Cabor', ip: '192.168.1.45' },
                { time: '2026-07-07 13:45:22', user: 'USR-89001', action: 'UPDATE', service: 'schedule-service', entity: 'Match', ip: '192.168.1.45' },
                { time: '2026-07-07 10:20:11', user: 'SYS-ROOT', action: 'DELETE', service: 'user-service', entity: 'User', ip: '10.0.0.5' },
                { time: '2026-07-07 09:15:40', user: 'USR-90022', action: 'CREATE', service: 'master-data', entity: 'Venue', ip: '172.16.2.11' },
                { time: '2026-07-06 18:30:00', user: 'USR-89001', action: 'UPDATE', service: 'livescore-service', entity: 'Score', ip: '192.168.1.45' },
              ].map((item, i) => (
                <tr key={i} className="table-row">
                  <td className="table-cell text-slate-500">{item.time}</td>
                  <td className="table-cell font-bold text-primary-700">{item.user}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-0.5 font-bold rounded ${
                      item.action === 'CREATE' ? 'bg-success-100 text-success-700' : 
                      item.action === 'UPDATE' ? 'bg-warning-100 text-warning-700' : 
                      'bg-danger-100 text-danger-700'
                    }`}>
                      {item.action}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-slate-600 font-sans font-medium">{item.service} / <span className="font-bold text-slate-800">{item.entity}</span></span>
                  </td>
                  <td className="table-cell text-slate-400">{item.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/50 rounded-b-xl">
          <div className="text-sm text-text-muted">Total record: <span className="font-bold">14,293</span></div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-300 rounded bg-white disabled:opacity-50 text-sm">Prev</button>
            <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm">1</button>
            <button className="px-3 py-1 border border-slate-300 rounded bg-white text-sm">2</button>
            <button className="px-3 py-1 border border-slate-300 rounded bg-white text-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
