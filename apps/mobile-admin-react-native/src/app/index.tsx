import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, MapPin, ChevronRight, Activity } from 'lucide-react-native';

const ASSIGNED_MATCHES = [
  {
    id: 'm1',
    cabor: 'Sepak Bola',
    teams: 'Kota Depok vs Kab. Bogor',
    time: '14:00',
    venue: 'Stadion Merpati',
    status: 'Menunggu',
    score: '0 - 0'
  },
  {
    id: 'm2',
    cabor: 'Bulutangkis',
    teams: 'A. Ginting vs J. Christie',
    time: '16:00',
    venue: 'GOR Balai Kota',
    status: 'Berlangsung',
    score: '21 - 19'
  }
];

export default function KorespondenDashboard() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 px-4 py-6 bg-slate-50">
      <View className="mb-6">
        <Text className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Tugas Hari Ini</Text>
        <Text className="text-2xl font-bold text-slate-900">12 November 2026</Text>
      </View>

      <View className="flex-col gap-4">
        {ASSIGNED_MATCHES.map((match) => (
          <Pressable 
            key={match.id}
            onPress={() => router.push(`/match/${match.id}`)}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm active:scale-95 transition-transform"
          >
            <View className="p-4 border-b border-slate-100 flex-row justify-between items-center">
              <Text className="font-bold text-primary-700">{match.cabor}</Text>
              <View className={`px-2 py-1 rounded text-xs font-bold ${
                match.status === 'Berlangsung' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
              }`}>
                <Text className={match.status === 'Berlangsung' ? 'text-red-600 text-xs font-bold uppercase' : 'text-slate-500 text-xs font-bold uppercase'}>
                  {match.status}
                </Text>
              </View>
            </View>
            
            <View className="p-4 flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="font-semibold text-lg text-slate-900 mb-2">{match.teams}</Text>
                <View className="flex-row items-center gap-2 mb-1">
                  <Clock size={14} color="#64748b" />
                  <Text className="text-sm text-slate-500">{match.time}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <MapPin size={14} color="#64748b" />
                  <Text className="text-sm text-slate-500">{match.venue}</Text>
                </View>
              </View>
              
              <View className="items-center justify-center pl-4 border-l border-slate-100">
                <Text className="text-xl font-black text-slate-900 mb-1">{match.score}</Text>
                <ChevronRight size={24} color="#cbd5e1" />
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <View className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-100 flex-row gap-3">
        <Activity size={24} color="#3b82f6" />
        <View className="flex-1">
          <Text className="font-semibold text-blue-900 mb-1">Sistem Terhubung</Text>
          <Text className="text-xs text-blue-700">Koneksi ke API Gateway stabil. LiveScore akan disinkronisasi seketika.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
