"use client";

import { useState, useEffect } from "react";
import { Activity, Clock } from "lucide-react";

interface LiveScore {
  matchId: string;
  scoreA: number;
  scoreB: number;
  status: string;
}

export default function LiveScorePage() {
  const [scores, setScores] = useState<Record<string, LiveScore>>({});
  const [connected, setConnected] = useState(false);
  const [flashCard, setFlashCard] = useState<string | null>(null);

  useEffect(() => {
    // Menghubungkan ke Realtime Gateway via API Gateway (Port 8080)
    // Rute yang benar sesuai API Gateway adalah /api/v1/stream/events (proxy ke 8085)
    const eventSource = new EventSource("http://localhost:8080/api/v1/stream/events");

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: LiveScore = JSON.parse(event.data);
        if (data.matchId) {
          setScores((prev) => ({
            ...prev,
            [data.matchId]: data
          }));
          
          // Memicu animasi flash pada card yang terupdate
          setFlashCard(data.matchId);
          setTimeout(() => setFlashCard(null), 1000); // hilangkan efek setelah 1 detik
        }
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Data tiruan yang digabungkan dengan skor real-time
  const matches = [
    {
      id: "m1",
      cabor: "Sepak Bola",
      round: "Penyisihan Grup A",
      teamA: "Kota Depok",
      teamB: "Kab. Bogor",
      time: "45+2'",
    },
    {
      id: "m2",
      cabor: "Bulutangkis",
      round: "Final Tunggal Putra",
      teamA: "A. Ginting",
      teamB: "J. Christie",
      time: "Set 3",
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${connected ? 'bg-red-100 dark:bg-red-900/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <Activity className={`w-5 h-5 transition-colors ${connected ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
            </div>
            LiveScore
            {!connected && <span className="text-sm font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Menghubungkan ke NATS...</span>}
            {connected && <span className="text-sm font-normal text-red-500 bg-red-50 dark:bg-red-950 px-2 py-1 rounded border border-red-100 dark:border-red-900 animate-fade-in">LIVE</span>}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Pembaruan skor secara real-time dari seluruh venue via NATS JetStream & SSE.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {matches.map((match) => {
            const liveData = scores[match.id];
            const scoreA = liveData?.scoreA ?? 0;
            const scoreB = liveData?.scoreB ?? 0;
            const status = liveData?.status ?? "Belum Mulai";
            const isFlashing = flashCard === match.id;

            return (
              <div 
                key={match.id} 
                className={`glass-card bg-white dark:bg-slate-900 border-l-4 transition-all duration-700 overflow-hidden relative ${
                  liveData ? 'border-l-red-500 shadow-md' : 'border-l-slate-300 dark:border-l-slate-700'
                } border border-slate-200 dark:border-slate-800 rounded-xl ${
                  isFlashing ? 'bg-yellow-50 dark:bg-yellow-900/20 scale-[1.01] shadow-lg' : ''
                }`}
              >
                {/* Efek kilauan saat skor update */}
                {isFlashing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent -translate-x-full animate-[shimmer_0.7s_ease-in-out]"></div>
                )}

                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                    {match.cabor} <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span> {match.round}
                  </span>
                  <span className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${liveData ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                    {liveData && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                    <Clock className="w-3 h-3" /> {liveData ? status : match.time}
                  </span>
                </div>
                <div className="p-6 flex flex-col gap-5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 text-lg">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-400 text-sm">
                        {match.teamA.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">{match.teamA}</span>
                    </div>
                    <span className={`text-4xl font-black transition-all duration-500 ${isFlashing ? 'text-primary-600 dark:text-primary-400 scale-125' : 'text-slate-900 dark:text-white'}`}>
                      {scoreA}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 text-lg">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-400 text-sm">
                        {match.teamB.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{match.teamB}</span>
                    </div>
                    <span className={`text-4xl font-black transition-all duration-500 ${isFlashing ? 'text-primary-600 dark:text-primary-400 scale-125' : 'text-slate-700 dark:text-slate-300'}`}>
                      {scoreB}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Mini Standings & Updates */}
        <div className="flex flex-col gap-6">
          <div className="glass-card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <h3 className="font-bold mb-5 text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-500" /> Pembaruan Terkini
            </h3>
            <div className="flex flex-col gap-5 relative pl-2">
              <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
              {[
                { time: "Baru saja", text: "SSE Streaming terhubung ke Realtime Gateway." },
                { time: "14:15", text: "Emas pertama untuk Kota Bandung di cabor Renang 100m." },
                { time: "14:00", text: "Cuaca buruk, cabor Panahan ditunda sementara." }
              ].map((ev, i) => (
                <div key={i} className="flex gap-4 relative z-10 items-start">
                  <div className={`w-3.5 h-3.5 rounded-full ${i===0 && connected ? 'bg-green-500' : 'bg-primary-500'} mt-1.5 shrink-0 ring-4 ring-white dark:ring-slate-900 shadow-sm`}></div>
                  <div>
                    <div className="text-xs font-bold text-primary-600 dark:text-primary-400 mb-1">{ev.time}</div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{ev.text}</div>
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
