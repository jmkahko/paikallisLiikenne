import { useEffect, useRef, useState, useCallback } from 'react'
import { getAlerts } from '../api/digitransit.js'

/**
 * Hakee Tampereen häiriötiedotteet ja päivittää annetulla intervallilla.
 * Polling pysäytetään kun välilehti ei ole näkyvissä (Page Visibility API)
 * ja jatketaan kun välilehti palaa näkyviin. Tiedotteet muuttuvat harvoin,
 * joten oletusväli on pidempi kuin lähdöillä. Kielen vaihtuessa tiedotteet
 * haetaan heti uudelleen.
 *
 * @param {string} lang - käyttöliittymän kieli (useLanguage().lang)
 * @param {number} intervalMs
 */
export function useAlerts(lang, intervalMs = 60_000) {
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)
  const cancelledRef = useRef(false)
  const requestRef = useRef(0) // vain uusin haku päivittää tilan (kielen vaihto kesken haun)

  const fetchNow = useCallback(async () => {
    const request = ++requestRef.current
    setLoading(true)
    try {
      const result = await getAlerts(lang)
      if (cancelledRef.current || request !== requestRef.current) return
      setAlerts(result)
      setError(null)
      setLastUpdated(new Date())
    } catch (e) {
      if (cancelledRef.current || request !== requestRef.current) return
      setError(e)
    } finally {
      if (!cancelledRef.current && request === requestRef.current) setLoading(false)
    }
  }, [lang])

  useEffect(() => {
    cancelledRef.current = false

    const isVisible = () =>
      typeof document === 'undefined' || document.visibilityState !== 'hidden'

    function clearTimer() {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    function startPolling() {
      clearTimer()
      timerRef.current = window.setInterval(() => {
        if (isVisible()) fetchNow()
      }, intervalMs)
    }

    function handleVisibilityChange() {
      if (isVisible()) {
        fetchNow()
        startPolling()
      } else {
        clearTimer()
      }
    }

    if (isVisible()) {
      fetchNow()
      startPolling()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelledRef.current = true
      clearTimer()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchNow, intervalMs])

  return { alerts, error, loading, lastUpdated, refresh: fetchNow }
}
