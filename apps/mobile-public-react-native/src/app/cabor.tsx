import { View, Text, FlatList, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Sport {
  id: string;
  name: string;
  category: string;
  status: string;
  venues_count?: number;
  icon_url?: string;
}

export default function CaborScreen() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      const response = await api.get('/master/sports');
      setSports(response.data.data);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data cabang olahraga.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Sport }) => (
    <View className="bg-background-elevated p-4 rounded-2xl mb-4 border border-slate-700/50 shadow-md flex-row items-center">
      <View className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 items-center justify-center overflow-hidden mr-4">
        {item.icon_url ? (
          <Image source={{ uri: item.icon_url }} className="w-8 h-8 opacity-80" />
        ) : (
          <Text className="text-xl">🏅</Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-white text-lg font-bold">{item.name}</Text>
        <Text className="text-slate-400 text-sm">{item.category}</Text>
      </View>
      <View className="bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
        <Text className="text-xs text-slate-300">Aktif</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background p-4">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-400">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={sports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
