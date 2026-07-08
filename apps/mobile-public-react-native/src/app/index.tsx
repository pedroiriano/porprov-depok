import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, CalendarDays, Medal, MapPin } from 'lucide-react-native';
import { CountdownTimer } from '../components/CountdownTimer';

export default function HomeScreen() {
  const router = useRouter();
  const targetDate = "2026-11-07T00:00:00+07:00"; // 7 November 2026, Waktu Indonesia Barat

  return (
    <ScrollView className="flex-1 bg-slate-950">
      {/* Hero Section */}
      <View className="bg-primary-600 px-6 py-10 rounded-b-[40px] items-center relative overflow-hidden">
        {/* Abstract Background Element */}
        <View className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full blur-3xl opacity-50 -mr-20 -mt-20" />
        
        <Text className="text-blue-100 font-semibold mb-1 tracking-widest text-xs">OFFICIAL APP</Text>
        <Text className="text-white text-3xl font-black mb-2 text-center">PORPROV XV</Text>
        <Text className="text-primary-100 text-center mb-6 font-medium">Jawa Barat 2026 • Kota Depok</Text>
        
        <View className="bg-white/10 p-5 rounded-3xl w-full max-w-sm border border-white/20">
          <Text className="text-center font-bold text-white mb-1 uppercase tracking-wider text-xs">Hitung Mundur Pembukaan</Text>
          <Text className="text-center font-medium text-blue-200 text-[10px] mb-2">Waktu Indonesia Barat (GMT+7)</Text>
          <CountdownTimer targetDate={targetDate} />
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 py-8">
        <Text className="text-white text-lg font-bold mb-4">Akses Cepat</Text>
        
        <View className="flex-row flex-wrap justify-between gap-y-4">
          <TouchableOpacity 
            onPress={() => router.push('/cabor')}
            className="bg-slate-900 w-[48%] p-4 rounded-2xl border border-slate-800 items-center"
          >
            <View className="w-12 h-12 bg-blue-500/20 rounded-full items-center justify-center mb-3">
              <Trophy size={24} color="#3b82f6" />
            </View>
            <Text className="text-white font-semibold">Cabor</Text>
            <Text className="text-slate-400 text-xs text-center mt-1">Cabang Olahraga</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/jadwal')}
            className="bg-slate-900 w-[48%] p-4 rounded-2xl border border-slate-800 items-center"
          >
            <View className="w-12 h-12 bg-emerald-500/20 rounded-full items-center justify-center mb-3">
              <CalendarDays size={24} color="#10b981" />
            </View>
            <Text className="text-white font-semibold">Jadwal</Text>
            <Text className="text-slate-400 text-xs text-center mt-1">Jadwal & Hasil</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/medali')}
            className="bg-slate-900 w-[48%] p-4 rounded-2xl border border-slate-800 items-center"
          >
            <View className="w-12 h-12 bg-amber-500/20 rounded-full items-center justify-center mb-3">
              <Medal size={24} color="#f59e0b" />
            </View>
            <Text className="text-white font-semibold">Medali</Text>
            <Text className="text-slate-400 text-xs text-center mt-1">Klasemen Sementara</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-slate-900 w-[48%] p-4 rounded-2xl border border-slate-800 items-center"
          >
            <View className="w-12 h-12 bg-purple-500/20 rounded-full items-center justify-center mb-3">
              <MapPin size={24} color="#a855f7" />
            </View>
            <Text className="text-white font-semibold">Venue</Text>
            <Text className="text-slate-400 text-xs text-center mt-1">Peta & Lokasi</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View className="px-6 pb-8">
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <Text className="text-slate-300 text-sm text-center">
            Pekan Olahraga Provinsi XV Jawa Barat 2026 diselenggarakan dengan bangga di Kota Depok.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
