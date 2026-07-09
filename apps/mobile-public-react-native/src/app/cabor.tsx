import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Trophy } from 'lucide-react-native';

interface Cabor {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
}

export default function CaborScreen() {
  const [cabors, setCabors] = useState<Cabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCabors();
  }, []);

  const fetchCabors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/master-data/cabors');
      setCabors(res.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat cabang olahraga');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-slate-400 mt-4 font-medium">Memuat Data Cabor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <Text className="text-red-400 text-center mb-4">{error}</Text>
        <View className="bg-primary-600 px-6 py-2 rounded-lg">
          <Text className="text-white font-bold" onPress={fetchCabors}>Coba Lagi</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <FlatList
        data={cabors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="bg-slate-900 rounded-2xl mb-4 p-4 flex-row items-center border border-slate-800 shadow-md">
            <View className="w-12 h-12 bg-blue-500/10 rounded-full items-center justify-center mr-4 border border-blue-500/20">
              <Trophy size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-lg mb-1">{item.name}</Text>
              {item.description ? (
                <Text className="text-slate-400 text-sm" numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="py-10 items-center">
            <Text className="text-slate-500 text-center">Belum ada data cabang olahraga.</Text>
          </View>
        }
      />
    </View>
  );
}
