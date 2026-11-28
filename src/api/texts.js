// Käyttöliittymän tekstit – MySQL-tietokannasta (issue #29)
//
// Selain kutsuu oman palvelimen /api/texts.php:tä, joka lukee tekstit
// tietokannasta. Dev-tilassa Vite-server ohjaa saman polun Docker-containerin
// PHP:lle (localhost:8080), joten `docker compose up` pitää olla käynnissä.

const ENDPOINT = '/api/texts.php'

/**
 * @param {string} lang toivottu kieli (esim. 'fi'). Palvelin palauttaa
 *   suomen, jos kieli ei ole käytössä.
 * @returns {Promise<{lang: string, locale: string,
 *   languages: Array<{code: string, name: string, locale: string}>,
 *   texts: Record<string, string>}>}
 */
export async function getTexts(lang, { signal } = {}) {
  const res = await fetch(`${ENDPOINT}?lang=${encodeURIComponent(lang)}`, { signal })

  let json = null
  try {
    json = await res.json()
  } catch {
    // Ei JSONia: esim. Viten proxy ei saa yhteyttä Dockeriin
  }
  if (!res.ok || !json?.texts) {
    throw new Error(`HTTP ${res.status}: ${json?.error || res.statusText}`)
  }
  return json
}
