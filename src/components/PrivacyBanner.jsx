import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { useText } from '../i18n/texts.jsx'

const PRIVACY_KEY = 'paikallis.privacy.v1'

export default function PrivacyBanner() {
  const t = useText()
  const [accepted, setAccepted] = useLocalStorage(PRIVACY_KEY, false)

  if (accepted) return null

  return (
    <div className="privacy-banner">
      <div className="privacy-banner__content">
        <p className="privacy-banner__title">{t('privacy.title')}</p>
        <p className="privacy-banner__text">
          {t('privacy.text', [<code>localStorage</code>])}
        </p>
        <button
          className="privacy-banner__btn"
          onClick={() => setAccepted(true)}
        >
          {t('privacy.accept')}
        </button>
      </div>
    </div>
  )
}
