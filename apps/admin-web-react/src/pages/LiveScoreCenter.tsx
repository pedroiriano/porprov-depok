import { useState, useEffect } from 'react';
import { Check, X, Clock, MessageSquare, AlertCircle, Activity } from 'lucide-react';
import { useAuth } from 'react-oidc-context';

export default function LiveScoreCenter() {
  const [events, setEvents] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const auth = useAuth();

  useEffect(() => {
    // Di produksi, endpoint diarahkan ke API Gateway (/api/v1/stream) yang me-reverse proxy ke realtime-gateway
    const sseUrl = 'http://localhost:8080/api/v1/stream/events';
    
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setConnectionStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents((prev) => [data, ...prev].slice(0, 50)); // Simpan 50 event terakhir
      } catch (err) {
        console.error('Gagal mem-parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setConnectionStatus('disconnected');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">LiveScore Center (SSE Realtime)</h2>
          <p className="text-text-muted text-sm mt-1">Pantau pembaruan skor dan medali yang masuk via NATS JetStream secara real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Queue / Live Stream */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">Live Event Stream</h3>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 font-bold rounded-full text-xs flex items-center gap-2">
              <Activity className="w-3 h-3 animate-pulse" /> {events.length} Events Received
            </span>
          </div>
          
          {events.length === 0 ? (
            <div className="card p-8 flex flex-col items-center justify-center text-slate-500 text-center">
              <Activity className="w-12 h-12 text-slate-300 mb-3" />
              <p>Belum ada event realtime yang diterima.</p>
              <p className="text-sm mt-1">Menunggu pembaruan skor atau medali dari backend...</p>
            </div>
          ) : (
            events.map((item, i) => (
              <div key={i} className="card p-5 border-l-4 border-l-primary-500 animate-fade-in">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-mono font-bold text-text-muted">EVENT</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.action || item.status || 'UPDATE'}
                      </span>
                      <span className="text-xs text-text-muted flex items-center gap-1"><Clock className="w-3 h-3" /> Realtime</span>
                    </div>
                    <pre className="text-sm bg-slate-50 p-3 rounded-lg overflow-x-auto text-slate-700">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Info */}
        <div className="flex flex-col gap-6">
          <div className="card p-5 bg-primary-50 border-primary-100">
            <h3 className="font-bold text-primary-800 flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5" /> Status Sistem SSE
            </h3>
            <p className="text-sm text-primary-700 leading-relaxed mb-4">
              Koneksi ini menggunakan Server-Sent Events (SSE) yang terhubung ke <code>realtime-gateway</code> (Port 8085) melalui API Gateway.
            </p>
            <div className="bg-white p-3 rounded-lg border border-primary-200 flex justify-between items-center">
              <span className="text-sm font-semibold text-text-secondary">Status Koneksi SSE</span>
              <span className={`flex items-center gap-1.5 text-xs font-bold ${connectionStatus === 'connected' ? 'text-success-600' : connectionStatus === 'connecting' ? 'text-warning-500' : 'text-danger-500'}`}>
                <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-success-500 animate-pulse' : connectionStatus === 'connecting' ? 'bg-warning-500' : 'bg-danger-500'}`}></span> 
                {connectionStatus === 'connected' ? 'Terhubung' : connectionStatus === 'connecting' ? 'Menghubungkan...' : 'Terputus'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
