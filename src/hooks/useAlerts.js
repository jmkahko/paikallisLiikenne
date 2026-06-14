import { useEffect, useRef, useState, useCallback } from 'react'
import { getAlerts } from '../api/digitransit.js'

/**
 * Hakee Tampereen häiriötiedotteet ja päivittää annetulla intervallilla.
 * Polling pysäytetään kun välilehti ei ole näkyvissä (Page Visibility API)
 * ja jatketaan kun välilehti palaa näkyviin. Tiedotteet muuttuvat harvoin,
 * joten oletusväli on pidempi kuin lähdöillä.
 *
 * @param {number} intervalMs
 */
export function useAlerts(intervalMs = 60_000) {
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)
  const cancelledRef = useRef(false)

  const fetchNow = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAlerts()
      if (cancelledRef.current) return
      setAlerts(result)
      setError(null)
      setLastUpdated(new Date())
    } catch (e) {
      if (cancelledRef.current) return
      setError(e)
    } finally {
      if (!cancelledRef.current) setLoading(false)
    }
  }, [])

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
