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
  const endpoint = env.DIGITRANSIT_ENDPOINT || ''

  // Proxy-asetukset tarvitaan vain dev-tilassa (npm run dev).
  // Build-vaiheessa (npm run build / Docker) proxya ei käytetä,
  // joten puuttuva endpoint ei ole ongelma.
  const proxyConfig = {}
  if (endpoint) {
    const endpointUrl = new URL(endpoint)
    proxyConfig['/api/digitransit.php'] = {
      target: endpointUrl.origin,
      changeOrigin: true,
      rewrite: () => endpointUrl.pathname,
      headers: apiKey
        ? { 'digitransit-subscription-key': apiKey }
        : {}
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
      proxy: proxyConfig
    }
  }
})
