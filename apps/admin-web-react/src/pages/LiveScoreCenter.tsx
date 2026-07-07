import { Check, X, Clock, MessageSquare, AlertCircle } from 'lucide-react';

export default function LiveScoreCenter() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">LiveScore Center & Verifikasi</h2>
          <p className="text-text-muted text-sm mt-1">Pantau antrean skor yang masuk dari koresponden lapangan untuk divalidasi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Queue */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">Antrean Verifikasi (Menunggu)</h3>
            <span className="px-3 py-1 bg-warning-100 text-warning-700 font-bold rounded-full text-xs">2 Antrean</span>
          </div>
          
          {[
            { id: '#VS-8902', cabor: 'Sepak Bola', match: 'Depok vs Bogor', score: '2 - 1', time: '14:32', reporter: 'Budi (Koresponden Venue A)', status: 'Menunggu' },
            { id: '#VS-8903', cabor: 'Bulutangkis', match: 'Ginting vs Jojo', score: '1 - 0', time: '14:35', reporter: 'Siti (Koresponden Venue B)', status: 'Menunggu' },
          ].map((item, i) => (
            <div key={i} className="card p-5 border-l-4 border-l-warning-500">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono font-bold text-text-muted">{item.id}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{item.cabor}</span>
                    <span className="text-xs text-text-muted flex items-center gap-1"><Clock className="w-3 h-3" /> {item.time}</span>
                  </div>
                  <h4 className="font-bold text-lg mb-1">{item.match}</h4>
                  <p className="text-sm text-text-secondary flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400" /> Dilaporkan oleh: <span className="font-medium">{item.reporter}</span>
                  </p>
                </div>
                
                <div className="flex flex-col items-center justify-center shrink-0 bg-slate-50 px-8 py-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-text-muted font-semibold uppercase mb-1">Skor Diajukan</span>
                  <span className="text-3xl font-black text-text-primary tracking-widest">{item.score}</span>
                </div>
              </div>
              
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-success-600 hover:bg-success-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                  <Check className="w-5 h-5" /> Setujui & Publikasi
                </button>
                <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-danger-200 text-danger-600 hover:bg-danger-50 px-6 py-2 rounded-lg font-semibold transition-colors">
                  <X className="w-5 h-5" /> Tolak
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Info */}
        <div className="flex flex-col gap-6">
          <div className="card p-5 bg-primary-50 border-primary-100">
            <h3 className="font-bold text-primary-800 flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5" /> Informasi Sistem
            </h3>
            <p className="text-sm text-primary-700 leading-relaxed mb-4">
              Setiap skor yang disetujui di sini akan dipublikasikan langsung ke aplikasi Public Web via NATS JetStream secara <em>real-time</em>.
            </p>
            <div className="bg-white p-3 rounded-lg border border-primary-200 flex justify-between items-center">
              <span className="text-sm font-semibold text-text-secondary">Status Koneksi NATS</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-success-600">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></span> Terhubung
              </span>
            </div>
          </div>
          
          <div className="card p-5">
            <h3 className="font-bold mb-4">Riwayat Persetujuan Terakhir</h3>
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-text-primary">Panahan - Final</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Disetujui oleh Anda (12:45)</p>
                  </div>
                  <Check className="w-4 h-4 text-success-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
