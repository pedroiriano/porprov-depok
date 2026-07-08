import React, { createContext, useContext, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Konfigurasi endpoint Keycloak (sesuaikan IP host)
const HOST_IP = '10.0.2.2'; // Emulator Android alias for localhost
const discovery = {
  authorizationEndpoint: `http://${HOST_IP}:8080/realms/porprov/protocol/openid-connect/auth`,
  tokenEndpoint: `http://${HOST_IP}:8080/realms/porprov/protocol/openid-connect/token`,
  revocationEndpoint: `http://${HOST_IP}:8080/realms/porprov/protocol/openid-connect/revoke`,
};

const clientId = 'porprov-mobile-admin';

export const AuthContext = createContext<any>(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'porprovadmin'
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    },
    discovery
  );

  useEffect(() => {
    SecureStore.getItemAsync('userToken').then(savedToken => {
      if (savedToken) {
        setToken(savedToken);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForToken(code);
    }
  }, [response]);

  const exchangeCodeForToken = async (code: string) => {
    try {
      const res = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          code,
          redirectUri,
          extraParams: request?.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
        },
        discovery
      );
      
      if (res.accessToken) {
        setToken(res.accessToken);
        await SecureStore.setItemAsync('userToken', res.accessToken);
      }
    } catch (err) {
      console.error('Exchange error:', err);
    }
  };

  const login = () => {
    promptAsync();
  };

  const logout = async () => {
    setToken(null);
    await SecureStore.deleteItemAsync('userToken');
  };

  return (
    <AuthContext.Provider value={{ token, isLoading, login, logout, request }}>
      {children}
    </AuthContext.Provider>
  );
};
