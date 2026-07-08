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

  useEffect(() => {
    // Menghubungkan ke Realtime Gateway via API Gateway (Port 8080)
    const eventSource = new EventSource("http://localhost:8080/api/v1/stream/livescore");

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: LiveScore = JSON.parse(event.data);
        setScores((prev) => ({
          ...prev,
          [data.matchId]: data
        }));
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
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${connected ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <Activity className={`w-5 h-5 ${connected ? 'text-red-500 animate-pulse-subtle' : 'text-slate-400'}`} />
            </div>
            LiveScore
            {!connected && <span className="text-sm font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Menghubungkan...</span>}
          </h1>
          <p className="text-text-muted mt-2">Pembaruan skor secara real-time dari seluruh venue via NATS JetStream & SSE.</p>
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

            return (
              <div key={match.id} className={`glass-card bg-background-surface border-l-4 ${liveData ? 'border-l-red-500' : 'border-l-slate-300'} border border-slate-200 dark:border-slate-800 transition-colors duration-500`}>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    {match.cabor} <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {match.round}
                  </span>
                  <span className={`text-xs font-bold flex items-center gap-1 ${liveData ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                    <Clock className="w-3 h-3" /> {liveData ? status : match.time}
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 text-lg">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                      <span className="font-semibold">{match.teamA}</span>
                    </div>
                    <span className="text-3xl font-black text-text-primary transition-all duration-300 transform scale-100">{scoreA}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 text-lg">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                      <span className="font-medium text-text-secondary">{match.teamB}</span>
                    </div>
                    <span className="text-3xl font-black text-text-secondary transition-all duration-300 transform scale-100">{scoreB}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Mini Standings & Updates */}
        <div className="flex flex-col gap-6">
          <div className="glass-card p-5 bg-background-surface border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold mb-4">Pembaruan Terkini</h3>
            <div className="flex flex-col gap-4 relative">
              <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800"></div>
              {[
                { time: "Baru saja", text: "SSE Streaming terhubung ke Realtime Gateway." },
                { time: "14:15", text: "Emas pertama untuk Kota Bandung di cabor Renang 100m." },
                { time: "14:00", text: "Cuaca buruk, cabor Panahan ditunda sementara." }
              ].map((ev, i) => (
                <div key={i} className="flex gap-4 relative z-10">
                  <div className={`w-3.5 h-3.5 rounded-full ${i===0 && connected ? 'bg-green-500' : 'bg-primary-500'} mt-1 shrink-0 ring-4 ring-background-surface`}></div>
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
