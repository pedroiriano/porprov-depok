import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Menyelesaikan IP Backend secara dinamis.
// Jika di peranti fisik via Expo Go, gunakan IP LAN komputer yang terdeteksi oleh Expo.
// Jika di Android Emulator, gunakan 10.0.2.2.
// Jika di Web/iOS Simulator, gunakan localhost.
const debuggerHost = Constants.expoConfig?.hostUri;
const lanIp = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

const BASE_URL = Platform.OS === 'android' 
  ? (debuggerHost ? `http://${lanIp}:8080/api/v1` : 'http://10.0.2.2:8080/api/v1')
  : `http://${lanIp}:8080/api/v1`;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});
