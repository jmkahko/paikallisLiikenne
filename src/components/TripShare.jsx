import { useEffect, useState } from 'react'
import { shareTripLink } from './tripLink.js'
import { useText } from '../i18n/texts.jsx'

/**
 * Jaa-painike vuoronäkymään (issue #24). Jos jakovalikko tai leikepöytä ei
 * ole käytettävissä (esim. http-yhteys muualta kuin localhostista), linkki
 * näytetään tekstikentässä käsin kopioitavaksi.
 */
export default function TripShare({ url, text }) {
  const t = useText()
  const [status, setStatus] = useState(null) // null | 'copied' | 'manual'

  // "Kopioitu"-ilmoitus häviää hetken kuluttua; käsinkopiointikenttä jää.
  useEffect(() => {
    if (status !== 'copied') return
    const id = setTimeout(() => setStatus(null), 3000)
    return () => clearTimeout(id)
  }, [status])

  async function handleShare() {
    const result = await shareTripLink(url, text, t('app.heading'))
    setStatus(result === 'copied' || result === 'manual' ? result : null)
  }

  return (
    <div className="trip-share">
      <button
        type="button"
        className="trip-share__btn"
        onClick={handleShare}
        title={t('trip.share.title')}
      >
        <span aria-hidden="true">🔗</span> {t('trip.share.button')}
      </button>
      {status === 'copied' && (
        <span className="trip-share__status" role="status">
          {t('trip.share.copied')}
        </span>
      )}
      {status === 'manual' && (
        <label className="trip-share__manual">
          <span>{t('trip.share.manual')}</span>
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
