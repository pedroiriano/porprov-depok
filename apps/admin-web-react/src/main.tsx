import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

import { ThemeProvider } from './components/ThemeProvider'

const appOrigin = window.location.origin

const oidcConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY || 'http://localhost:8080/realms/porprov',
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || 'porprov-admin-web',
  redirect_uri: `${appOrigin}/`,
  post_logout_redirect_uri: `${appOrigin}/`,
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname)
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="admin-theme">
      <AuthProvider {...oidcConfig}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
