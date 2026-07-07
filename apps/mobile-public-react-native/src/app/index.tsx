import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center p-4">
      <View className="bg-background-elevated p-6 rounded-3xl border border-slate-700/50 shadow-xl items-center w-full max-w-sm">
        <Text className="text-white text-2xl font-bold mb-2">PORPROV XV</Text>
        <Text className="text-blue-200 text-center mb-6">Jawa Barat 2026</Text>
        
        <View className="bg-primary-500 px-6 py-3 rounded-xl w-full items-center">
          <Text className="text-white font-semibold">Lihat Cabor</Text>
        </View>
      </View>
    </View>
  );
}
