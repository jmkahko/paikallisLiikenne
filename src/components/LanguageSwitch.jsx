import { useLanguage, useText } from '../i18n/texts.jsx'

/**
 * Kielivalinta otsikkoriville (issue #29): kielikoodit vierekkäin (FI | EN),
 * valittu lihavoituna. Kielet tulevat tietokannasta (ui_language,
 * enabled = 1); valinta näytetään vasta, kun kieliä on useampi.
 */
export default function LanguageSwitch() {
  const t = useText()
  const { lang, languages, setLang } = useLanguage()

  if (languages.length < 2) return null

  return (
    <div className="lang-switch" role="group" aria-label={t('app.language')}>
      {languages.map((l) => {
        const active = l.code === lang
        return (
          <button
            key={l.code}
            type="button"
            className={`lang-switch__btn${active ? ' lang-switch__btn--active' : ''}`}
            aria-pressed={active}
            aria-label={l.name}
            title={l.name}
            lang={l.code}
            onClick={() => setLang(l.code)}
          >
            {l.code.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
