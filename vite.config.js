import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-tilassa Vite "matkii" PHP-proxya: kun selain kutsuu /api/digitransit.php,
// pyyntö ohjataan suoraan Digitransitiin ja avain (DIGITRANSIT_API_KEY,
// EI VITE_-prefixiä) injektoidaan headeriin palvelinpuolella. Avain ei
// päädy selainbundleen.
//
// Tuotannossa (Docker tai web-hotelli) /api/digitransit.php on oikea PHP-
// skripti, joka tekee saman tehtävän palvelimella.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.DIGITRANSIT_API_KEY || ''

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api/digitransit.php': {
          target: 'https://api.digitransit.fi',
          changeOrigin: true,
          rewrite: () => '/routing/v2/waltti/gtfs/v1/',
          headers: apiKey
            ? { 'digitransit-subscription-key': apiKey }
            : {}
        }
      }
    }
  }
})
