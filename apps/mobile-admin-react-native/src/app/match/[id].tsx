import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Minus, Plus, Save } from 'lucide-react-native';
import { api } from '../../lib/api';

export default function MatchLiveScore() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [saving, setSaving] = useState(false);

  const teamA = id === 'm2' ? 'A. Ginting' : 'Kota Depok';
  const teamB = id === 'm2' ? 'J. Christie' : 'Kab. Bogor';

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/livescore/update', {
        matchId: id,
        scoreA: scoreA,
        scoreB: scoreB,
        status: 'Berlangsung'
      });
      alert('Skor berhasil disinkronisasi ke server pusat!');
    } catch (error) {
      alert('Gagal menyinkronkan skor. Periksa koneksi Anda.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-900">
      <View className="p-6 items-center border-b border-slate-800">
        <Text className="text-slate-400 font-bold tracking-widest uppercase text-xs mb-2">LiveScore Input</Text>
        <Text className="text-white font-black text-xl text-center">Final - Pertandingan {id}</Text>
      </View>

      <View className="flex-row w-full mt-4">
        {/* Team A */}
        <View className="flex-1 items-center p-4 border-r border-slate-800">
          <Text className="text-white font-bold text-lg mb-6 text-center h-14">{teamA}</Text>
          
          <Pressable 
            onPress={() => setScoreA(Math.max(0, scoreA - 1))}
            className="w-16 h-16 bg-slate-800 rounded-full items-center justify-center mb-6 active:bg-slate-700"
          >
            <Minus size={32} color="#94a3b8" />
          </Pressable>

          <Text className="text-8xl font-black text-white mb-6 tracking-tighter">{scoreA}</Text>

          <Pressable 
            onPress={() => setScoreA(scoreA + 1)}
            className="w-24 h-24 bg-primary-600 rounded-full items-center justify-center shadow-lg active:bg-primary-700 active:scale-95 transition-transform"
          >
            <Plus size={48} color="#ffffff" />
          </Pressable>
        </View>

        {/* Team B */}
        <View className="flex-1 items-center p-4">
          <Text className="text-white font-bold text-lg mb-6 text-center h-14">{teamB}</Text>
          
          <Pressable 
            onPress={() => setScoreB(Math.max(0, scoreB - 1))}
            className="w-16 h-16 bg-slate-800 rounded-full items-center justify-center mb-6 active:bg-slate-700"
          >
            <Minus size={32} color="#94a3b8" />
          </Pressable>

          <Text className="text-8xl font-black text-white mb-6 tracking-tighter">{scoreB}</Text>

          <Pressable 
            onPress={() => setScoreB(scoreB + 1)}
            className="w-24 h-24 bg-danger-600 rounded-full items-center justify-center shadow-lg active:bg-danger-700 active:scale-95 transition-transform"
          >
            <Plus size={48} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      <View className="p-6 mt-8">
        <Pressable 
          onPress={handleSave}
          disabled={saving}
          className={`w-full py-4 rounded-xl flex-row justify-center items-center gap-2 shadow-lg active:scale-95 transition-transform ${
            saving ? 'bg-slate-700' : 'bg-success-600 active:bg-success-700'
          }`}
        >
          <Save size={24} color="#ffffff" />
          <Text className="text-white font-bold text-lg">
            {saving ? 'Menyinkronkan...' : 'Simpan & Sinkronisasi'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
