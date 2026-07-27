import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const configuredBasePath = env.VITE_BASE_PATH?.trim() || '/'
  const base = configuredBasePath.endsWith('/') ? configuredBasePath : `${configuredBasePath}/`

  return {
    // CHANGE: Deployment intranet melayani Admin dari /admin/ pada origin HTTPS
    // yang sama. Development lokal tetap menggunakan root path.
    base,
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
