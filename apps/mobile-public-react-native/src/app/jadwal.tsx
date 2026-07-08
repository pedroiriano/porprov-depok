import { View, Text, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import EventSource from 'react-native-sse';
import { MatchCard } from '../components/MatchCard';

export default function JadwalScreen() {
  const dummyMatches = [
    {
      id: '1',
      caborName: 'Bola Voli',
      round: 'Final Putra',
      team1: 'Kota Depok',
      team2: 'Kab. Bogor',
      score1: '3',
      score2: '1',
      status: 'FINISHED' as const,
      time: '09:00',
    },
    {
      id: '2',
      caborName: 'Bulu Tangkis',
      round: 'Semifinal Ganda Putri',
      team1: 'Kota Bandung',
      team2: 'Kota Bekasi',
      score1: '21',
      score2: '19',
      status: 'LIVE' as const,
      time: '13:00',
    },
    {
      id: '3',
      caborName: 'Sepak Bola',
      round: 'Penyisihan Grup A',
      team1: 'Kota Depok',
      team2: 'Kab. Sumedang',
      status: 'UPCOMING' as const,
      time: '15:30',
    },
    {
      id: '4',
      caborName: 'Pencak Silat',
      round: 'Tanding Kelas C Putra',
      team1: 'Kab. Bekasi',
      team2: 'Kota Bogor',
      status: 'UPCOMING' as const,
      time: '16:45',
  ];

  const [matches, setMatches] = useState(dummyMatches);
  const [sseConnected, setSseConnected] = useState(false);

  useEffect(() => {
    // 10.0.2.2 is loopback for Android emulator pointing to localhost
    const sse = new EventSource('http://10.0.2.2:8080/api/v1/stream/events');
    
    sse.addEventListener('open', () => {
      setSseConnected(true);
    });

    sse.addEventListener('message', (event: any) => {
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          if (data.matchId) {
            setMatches(prev => prev.map(m => {
              if (m.id === data.matchId) {
                return {
                  ...m,
                  score1: String(data.scoreA),
                  score2: String(data.scoreB),
                  status: (data.status === 'Berlangsung' ? 'LIVE' : data.status === 'Selesai' ? 'FINISHED' : 'UPCOMING') as any
                };
              }
              return m;
            }));
          }
        } catch (e) {
          console.error("Parse error", e);
        }
      }
    });

    sse.addEventListener('error', () => {
      setSseConnected(false);
    });

    return () => {
      sse.removeAllEventListeners();
      sse.close();
    };
  }, []);

  return (
    <View className="flex-1 bg-slate-950">
      {/* Filters (Dummy UI) */}
      <View className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex-row space-x-2 gap-2">
        <View className="bg-primary-600 px-4 py-2 rounded-full">
          <Text className="text-white font-semibold text-sm">Semua</Text>
        </View>
        <View className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
          <Text className="text-slate-300 font-medium text-sm">Hari Ini</Text>
        </View>
        <View className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
          <Text className="text-slate-300 font-medium text-sm">Kota Depok</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-slate-400 font-medium text-sm mb-4 uppercase tracking-wider">Selasa, 10 Nov 2026</Text>
        
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            caborName={match.caborName}
            round={match.round}
            team1={match.team1}
            team2={match.team2}
            score1={match.score1}
            score2={match.score2}
            status={match.status}
            time={match.time}
          />
        ))}
        
        <View className="pb-10" />
      </ScrollView>
    </View>
  );
}
