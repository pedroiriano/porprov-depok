import { View, Text, ScrollView, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import EventSource from 'react-native-sse';

export default function MedaliScreen() {
  const dummyStandings = [
    { id: '1', rank: 1, region: 'Kota Depok', gold: 125, silver: 89, bronze: 76 },
    { id: '2', rank: 2, region: 'Kota Bandung', gold: 110, silver: 95, bronze: 80 },
    { id: '3', rank: 3, region: 'Kab. Bekasi', gold: 98, silver: 102, bronze: 90 },
    { id: '4', rank: 4, region: 'Kota Bogor', gold: 85, silver: 70, bronze: 85 },
    { id: '5', rank: 5, region: 'Kab. Bogor', gold: 76, silver: 80, bronze: 92 },
    { id: '6', rank: 6, region: 'Kota Bekasi', gold: 60, silver: 55, bronze: 65 },
  ];

  const [standings, setStandings] = useState(dummyStandings);
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
          // Assuming Medals update event has 'action' === 'MEDAL_UPDATE' and 'data' with the new standings or specific kontingen
          if (data.action === 'MEDAL_UPDATE' || data.kontingen_id) {
            // This is a placeholder logic for updating medals
            // In a real scenario, you'd merge the array or refetch
            // For now, let's just trigger a re-render or update dummy if matched
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
      {/* Header Info */}
      <View className="px-4 py-4 bg-slate-900 border-b border-slate-800">
        <Text className="text-white font-bold text-lg">Klasemen Medali</Text>
        <Text className="text-slate-400 text-sm">Pembaruan Terakhir: Hari ini, 15:30 WIB</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          <View className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            
            {/* Table Header */}
            <View className="flex-row items-center bg-slate-950/50 px-4 py-3 border-b border-slate-800">
              <View className="w-8 items-center"><Text className="text-slate-400 font-bold text-xs">#</Text></View>
              <View className="flex-1 px-2"><Text className="text-slate-400 font-bold text-xs uppercase tracking-wider">Kontingen</Text></View>
              <View className="w-10 items-center"><Text className="text-amber-400 font-bold text-xs">E</Text></View>
              <View className="w-10 items-center"><Text className="text-slate-300 font-bold text-xs">P</Text></View>
              <View className="w-10 items-center"><Text className="text-amber-700 font-bold text-xs">P</Text></View>
              <View className="w-12 items-center"><Text className="text-blue-400 font-bold text-xs">TOT</Text></View>
            </View>

            {/* Table Rows */}
            {standings.map((item, index) => (
              <View 
                key={item.id} 
                className={`flex-row items-center px-4 py-4 ${
                  index !== standings.length - 1 ? 'border-b border-slate-800' : ''
                } ${item.region === 'Kota Depok' ? 'bg-primary-900/20' : ''}`}
              >
                <View className="w-8 items-center">
                  <Text className={`font-black ${item.rank <= 3 ? 'text-white' : 'text-slate-500'}`}>
                    {item.rank}
                  </Text>
                </View>
                
                <View className="flex-1 px-2 flex-row items-center space-x-2 gap-2">
                  <View className="w-6 h-6 bg-slate-800 rounded-full items-center justify-center border border-slate-700">
                    <Text className="text-[8px] text-white">JB</Text>
                  </View>
                  <Text className={`font-bold ${item.region === 'Kota Depok' ? 'text-primary-300' : 'text-slate-200'}`}>
                    {item.region}
                  </Text>
                </View>

                <View className="w-10 items-center">
                  <Text className="text-slate-300 font-medium">{item.gold}</Text>
                </View>
                <View className="w-10 items-center">
                  <Text className="text-slate-400 font-medium">{item.silver}</Text>
                </View>
                <View className="w-10 items-center">
                  <Text className="text-slate-500 font-medium">{item.bronze}</Text>
                </View>
                <View className="w-12 items-center">
                  <Text className="text-white font-bold">
                    {item.gold + item.silver + item.bronze}
                  </Text>
                </View>
              </View>
            ))}
            
          </View>
        </View>
        
        {/* Legend */}
        <View className="px-6 pb-10 flex-row justify-center space-x-6 gap-6">
          <View className="flex-row items-center space-x-2 gap-2">
            <View className="w-3 h-3 bg-amber-400 rounded-full" />
            <Text className="text-slate-400 text-xs">Emas</Text>
          </View>
          <View className="flex-row items-center space-x-2 gap-2">
            <View className="w-3 h-3 bg-slate-300 rounded-full" />
            <Text className="text-slate-400 text-xs">Perak</Text>
          </View>
          <View className="flex-row items-center space-x-2 gap-2">
            <View className="w-3 h-3 bg-amber-700 rounded-full" />
            <Text className="text-slate-400 text-xs">Perunggu</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
