// Käyttöliittymän tekstit tietokannasta (issue #29).
//
//   const t = useText()
//   t('app.heading')                → 'Paikallisliikenne'
//   t('app.subtitle', [MAX_STOPS])  → 'Reaaliaikaiset Nysse-lähdöt — valitse jopa 6 pysäkkiä.'
//   t('app.footer', [<a …>Digitransit</a>, …])  → React-solmuja (linkit tekstin keskellä)
//
// Avain on muotoa 'ryhmä.avain' (tietokannan text_group + text_key). Jos
// avainta ei löydy, näytetään avain itse, jotta puuttuva teksti huomataan.
//
// TextProvider hakee tekstit ennen sovelluksen renderöintiä. Ilman tekstejä
// sovellus ei toimi, joten epäonnistunut haku näyttää vikailmoituksen.
// Kieli: käyttäjän valitsema (localStorage) tai oletuksena suomi. Palvelin
// palauttaa suomen, jos kieli ei ole käytössä (ui_language.enabled).
import { createContext, Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { getTexts } from '../api/texts.js'

const TextContext = createContext(null)
const PLACEHOLDER_RE = /\{(\d+)\}/
const LANG_KEY = 'paikallis.lang.v1' // tallennetaan vain, kun käyttäjä valitsee kielen
const DEFAULT_LANG = 'fi'

// Tallennettu valinta tai oletuskieli (selaimen kieliasetusta ei käytetä).
function initialLang() {
  try {
    return window.localStorage.getItem(LANG_KEY) || DEFAULT_LANG
  } catch {
    return DEFAULT_LANG // localStorage estetty
  }
}

/**
 * Korvaa paikanpitimet {0}, {1}, … arvoilla. Jos kaikki arvot ovat lukuja tai
 * tekstiä, palautetaan merkkijono (käy myös title- ja aria-label-attribuuttiin),
 * muuten taulukko React-solmuja.
 */
export function formatText(template, values = []) {
  const parts = template.split(PLACEHOLDER_RE) // parittomissa indekseissä paikanpitimen numero
  if (parts.length === 1) return template
  const value = (n) => values[Number(n)] ?? `{${n}}`
  if (values.every((v) => v === null || typeof v !== 'object')) {
    return parts.map((p, i) => (i % 2 ? value(p) : p)).join('')
  }
  return parts.map((p, i) => (i % 2 ? <Fragment key={i}>{value(p)}</Fragment> : p))
}

export function TextProvider({ children }) {
  const [lang, setLang] = useState(initialLang)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  // Kielen vaihtuessa vanhat tekstit näkyvät, kunnes uudet ovat tulleet.
  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    getTexts(lang, { signal: controller.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e)
      })
    return () => controller.abort()
  }, [lang, attempt])

  // <html lang> ja välilehden otsikko seuraavat tietokannasta tullutta kieltä.
  useEffect(() => {
    if (!data) return
    document.documentElement.lang = data.lang
    if (data.texts['app.title']) document.title = data.texts['app.title']
  }, [data])

  const value = useMemo(() => {
    if (!data) return null
    const { texts } = data
    const t = (key, values) => (key in texts ? formatText(texts[key], values) : key)
    function chooseLang(code) {
      try {
        window.localStorage.setItem(LANG_KEY, code)
      } catch {
        // ei tallennusta → valinta pätee tämän sivulatauksen ajan
      }
      setLang(code)
    }
    return { t, lang: data.lang, locale: data.locale, languages: data.languages, setLang: chooseLang }
  }, [data])

  if (error) return <ServiceDown error={error} onRetry={() => setAttempt((n) => n + 1)} />
  if (!value) return <div className="app-status app-status--loading" aria-busy="true" />
  return <TextContext.Provider value={value}>{children}</TextContext.Provider>
}

/** @returns {(key: string, values?: Array) => string | Array} */
export function useText() {
  return useContext(TextContext).t
}

/** @returns {{lang: string, locale: string, languages: Array<{code, name, locale}>, setLang: (code: string) => void}} */
export function useLanguage() {
  const { lang, locale, languages, setLang } = useContext(TextContext)
  return { lang, locale, languages, setLang }
}

// Sovelluksen ainoat kovakoodatut tekstit: tietokanta ei vastaa, joten
// kieltäkään ei tiedetä — ilmoitus näytetään sekä suomeksi että englanniksi.
function ServiceDown({ error, onRetry }) {
  return (
    <div className="app-status" role="alert">
      <p className="app-status__title">Palvelu ei ole juuri nyt käytettävissä.</p>
      <p>Yritä hetken kuluttua uudelleen.</p>
      <p className="app-status__title" lang="en">The service is currently unavailable.</p>
      <p lang="en">Please try again in a moment.</p>
      <button type="button" className="app-status__btn" onClick={onRetry}>
        Yritä uudelleen / <span lang="en">Try again</span>
      </button>
      <p className="app-status__detail">{error.message}</p>
    </div>
  )
}
