import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Redirect } from 'expo-router';
import { Shield } from 'lucide-react-native';

export default function Login() {
  const { token, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (token) {
    return <Redirect href="/" />;
  }

  return (
    <View className="flex-1 bg-slate-50 justify-center items-center p-6">
      <View className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm items-center border border-slate-100">
        <View className="w-16 h-16 bg-primary-100 rounded-2xl items-center justify-center mb-6">
          <Shield size={32} color="#0284c7" />
        </View>
        <Text className="text-2xl font-bold text-slate-800 mb-2">Login Mobile</Text>
        <Text className="text-center text-slate-500 mb-8">
          Masuk dengan akun Keycloak (Koresponden/Admin) untuk mengelola data.
        </Text>
        
        <TouchableOpacity 
          className="w-full bg-primary-600 rounded-xl py-4 flex-row justify-center items-center shadow-sm active:bg-primary-700"
          onPress={login}
        >
          <Text className="text-white font-bold text-lg">Login via Keycloak</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
