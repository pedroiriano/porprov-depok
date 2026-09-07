import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const configuredBasePath = env.VITE_BASE_PATH?.trim() || '/'
  const base = configuredBasePath.endsWith('/') ? configuredBasePath : `${configuredBasePath}/`
  const developmentSecurityHeaders = {
    'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://localhost:8000 http://localhost:8080",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
  }

  return {
    // CHANGE: Deployment intranet melayani Admin dari /admin/ pada origin HTTPS
    // yang sama. Development lokal tetap menggunakan root path.
    base,
    plugins: [
      react(),
      tailwindcss(),
    ],
    // SECURITY: Dev/preview tetap mengungkap masalah CSP dan header sebelum
    // build mencapai edge Nginx; origin OIDC/API lokal diizinkan eksplisit.
    server: { headers: developmentSecurityHeaders },
    preview: { headers: developmentSecurityHeaders },
  }
})
