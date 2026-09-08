import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource-variable/nunito/wght.css'
import '@fontsource-variable/nunito/wght-italic.css'
import './index.css'
import App from './App.tsx'

import { AppErrorBoundary } from './components/AppErrorBoundary'
import { ThemeProvider } from './components/ThemeProvider'

const appOrigin = window.location.origin
const configuredBasePath = import.meta.env.BASE_URL || '/'
const routerBasePath = configuredBasePath === '/' ? undefined : configuredBasePath.replace(/\/$/, '')
const oidcRedirectUrl = new URL(configuredBasePath, `${appOrigin}/`).toString()

const oidcConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY || 'http://localhost:8080/realms/porprov',
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || 'porprov-admin-web',
  // SECURITY: Redirect OIDC harus kembali ke base path deployment yang sama.
  redirect_uri: oidcRedirectUrl,
  post_logout_redirect_uri: oidcRedirectUrl,
  // RELIABILITY: Perpanjang sesi sebelum token kedaluwarsa dan sinkronkan
  // logout lintas tab tanpa menyimpan credential aplikasi di browser.
  automaticSilentRenew: true,
  monitorSession: true,
  revokeTokensOnSignout: true,
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
    <AppErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="admin-theme">
        <AuthProvider {...oidcConfig}>
          <QueryClientProvider client={queryClient}>
            <App routerBasePath={routerBasePath} />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
