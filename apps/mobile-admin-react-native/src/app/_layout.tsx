import { Stack, Redirect, useSegments } from 'react-router';
import { View, Text } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import '../global.css';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

function RootLayoutNav() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    
    const inAuthGroup = segments[0] === 'login';

    if (!token && !inAuthGroup) {
      // Redirect to the login page.
      router.replace('/login');
    } else if (token && inAuthGroup) {
      // Redirect away from the login page.
      router.replace('/');
    }
  }, [token, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1e3a8a', // primary-900
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: '#f8fafc',
        }
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'PORPROV Admin/Koresponden',
        }} 
      />
      <Stack.Screen 
        name="match/[id]" 
        options={{ 
          title: 'Panel LiveScore',
          headerBackTitle: 'Kembali'
        }} 
      />
    </Stack>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
