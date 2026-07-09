import { useState, useEffect } from 'react';
import { Clock, AlertCircle, Activity, Send, CheckCircle2 } from 'lucide-react';

export default function LiveScoreCenter() {
  const [events, setEvents] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  // State untuk form update
  const [matchId, setMatchId] = useState('m1');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [status, setStatus] = useState('Berlangsung');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

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

  const handleUpdateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('http://localhost:8080/api/v1/livescore/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId,
          scoreA: Number(scoreA),
          scoreB: Number(scoreB),
          status
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui skor');
      }

      setSubmitMessage({ type: 'success', text: 'Skor berhasil diperbarui dan disiarkan!' });
      
      // Hilangkan pesan sukses setelah 3 detik
      setTimeout(() => setSubmitMessage(null), 3000);
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error.message || 'Terjadi kesalahan' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">LiveScore Center (SSE Realtime)</h2>
          <p className="text-text-muted text-sm mt-1">Pantau pembaruan skor dan medali yang masuk via NATS JetStream secara real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kontrol Update Skor */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="card p-5 border-t-4 border-t-primary-500">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary-500" /> Form Update Skor
            </h3>
            
            {submitMessage && (
              <div className={`p-3 rounded-lg mb-4 text-sm flex items-start gap-2 ${submitMessage.type === 'success' ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-danger-50 text-danger-700 border border-danger-200'}`}>
                {submitMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span>{submitMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateScore} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">ID Pertandingan (Mock)</label>
                <select 
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900"
                >
                  <option value="m1">m1 - Sepak Bola (Depok vs Bogor)</option>
                  <option value="m2">m2 - Bulutangkis (Ginting vs Christie)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Skor Tim A</label>
                  <input 
                    type="number" 
                    min="0"
                    value={scoreA}
                    onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Skor Tim B</label>
                  <input 
                    type="number" 
                    min="0"
                    value={scoreB}
                    onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Status Pertandingan</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900"
                >
                  <option value="Belum Mulai">Belum Mulai</option>
                  <option value="Berlangsung">Berlangsung</option>
                  <option value="Istirahat">Istirahat</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || connectionStatus !== 'connected'}
                className="mt-2 w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-md hover:shadow-lg"
              >
                {isSubmitting ? 'Mengirim...' : 'Siarkan Skor (NATS)'}
              </button>
            </form>
          </div>

          <div className="card p-5 bg-primary-50 border-primary-100">
            <h3 className="font-bold text-primary-800 flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5" /> Status Sistem SSE
            </h3>
            <div className="bg-white p-3 rounded-lg border border-primary-200 flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-text-secondary">Koneksi Event Stream</span>
              <span className={`flex items-center gap-1.5 text-xs font-bold ${connectionStatus === 'connected' ? 'text-success-600' : connectionStatus === 'connecting' ? 'text-warning-500' : 'text-danger-500'}`}>
                <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-success-500 animate-pulse' : connectionStatus === 'connecting' ? 'bg-warning-500' : 'bg-danger-500'}`}></span> 
                {connectionStatus === 'connected' ? 'Terhubung' : connectionStatus === 'connecting' ? 'Menghubungkan...' : 'Terputus'}
              </span>
            </div>
            <p className="text-xs text-primary-700 leading-relaxed">
              Formulir di atas akan mengirim request ke <code>livescore-service</code> (via API Gateway), lalu dipublish ke NATS JetStream, dan diterima kembali di layar Anda secara realtime via <code>realtime-gateway</code>.
            </p>
          </div>
        </div>

        {/* Verification Queue / Live Stream */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">Live Event Stream Log</h3>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-full text-xs flex items-center gap-2">
              <Activity className="w-3 h-3 text-primary-500 animate-pulse" /> {events.length} Events Received
            </span>
          </div>
          
          {events.length === 0 ? (
            <div className="card p-8 flex flex-col items-center justify-center text-slate-500 text-center h-64">
              <Activity className="w-12 h-12 text-slate-300 mb-3" />
              <p>Belum ada event realtime yang diterima.</p>
              <p className="text-sm mt-1">Gunakan form di samping untuk mulai menyiarkan pembaruan skor.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {events.map((item, i) => (
                <div key={i} className="card p-4 border-l-4 border-l-primary-500 animate-fade-in bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-400">EVENT LOG</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-700">
                        {item.matchId ? `MATCH: ${item.matchId}` : 'UPDATE'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" /> Realtime via NATS</span>
                    </div>
                    <pre className="text-sm bg-slate-50 dark:bg-slate-950 p-3 rounded-lg overflow-x-auto text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
