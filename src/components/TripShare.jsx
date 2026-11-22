import { useEffect, useState } from 'react'
import { shareTripLink } from './tripLink.js'

/**
 * Jaa-painike vuoronäkymään (issue #24). Jos jakovalikko tai leikepöytä ei
 * ole käytettävissä (esim. http-yhteys muualta kuin localhostista), linkki
 * näytetään tekstikentässä käsin kopioitavaksi.
 */
export default function TripShare({ url, text }) {
  const [status, setStatus] = useState(null) // null | 'copied' | 'manual'

  // "Kopioitu"-ilmoitus häviää hetken kuluttua; käsinkopiointikenttä jää.
  useEffect(() => {
    if (status !== 'copied') return
    const id = setTimeout(() => setStatus(null), 3000)
    return () => clearTimeout(id)
  }, [status])

  async function handleShare() {
    const result = await shareTripLink(url, text)
    setStatus(result === 'copied' || result === 'manual' ? result : null)
  }

  return (
    <div className="trip-share">
      <button
        type="button"
        className="trip-share__btn"
        onClick={handleShare}
        title="Jaa linkki tähän vuoroon"
      >
        <span aria-hidden="true">🔗</span> Jaa
      </button>
      {status === 'copied' && (
        <span className="trip-share__status" role="status">
          Viesti ja linkki kopioitu leikepöydälle
        </span>
      )}
      {status === 'manual' && (
        <label className="trip-share__manual">
          <span>Kopioi linkki:</span>
          <input
            className="trip-share__url"
            readOnly
            value={url}
            autoFocus
            onFocus={(e) => e.target.select()}
          />
        </label>
      )}
    </div>
  )
}
