import { useState } from 'react'
import { useLanguage, useText } from '../i18n/texts.jsx'

const SEVERITY_KEY = {
  INFO: 'alerts.severity.info',
  WARNING: 'alerts.severity.warning',
  SEVERE: 'alerts.severity.severe',
  UNKNOWN_SEVERITY: 'alerts.severity.info'
}

// Lajittelu: vakavin ensin, saman vakavuuden sisällä tuorein (myöhäisin
// alkupäivä) ensin. Tiedotteet ilman alkupäivää valuvat ryhmänsä loppuun.
const SEVERITY_RANK = { SEVERE: 3, WARNING: 2, INFO: 1, UNKNOWN_SEVERITY: 0 }

function compareAlerts(a, b) {
  const bySeverity =
    (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0)
  if (bySeverity !== 0) return bySeverity
  const aStart = a.start ? a.start.getTime() : 0
  const bStart = b.start ? b.start.getTime() : 0
  return bStart - aStart
}

function formatRange(start, end, t, locale) {
  const fmt = (d) =>
    d.toLocaleDateString(locale, { day: 'numeric', month: 'numeric' })
  if (start && end) return `${fmt(start)}–${fmt(end)}`
  if (start) return t('alerts.from', [fmt(start)])
  if (end) return t('alerts.until', [fmt(end)])
  return ''
}

function AlertItem({ alert }) {
  const t = useText()
  const { locale } = useLanguage()
  const sev = (alert.severity || 'UNKNOWN_SEVERITY').toLowerCase()
  const range = formatRange(alert.start, alert.end, t, locale)
  return (
    <li className={`alert-item alert-item--${sev}`}>
      <div className="alert-item__head">
        <span className="alert-item__sev">
          {t(SEVERITY_KEY[alert.severity] || 'alerts.severity.info')}
        </span>
        {range && <span className="alert-item__dates">{range}</span>}
      </div>
      {alert.routeNames.length > 0 && (
        <p className="alert-item__routes">
          {t('alerts.routes', [alert.routeNames.join(', ')])}
        </p>
      )}
      {alert.header && <p className="alert-item__header">{alert.header}</p>}
      {alert.description && alert.description !== alert.header && (
        <p className="alert-item__desc">{alert.description}</p>
      )}
      {alert.url && (
        <a
          href={alert.url}
          target="_blank"
          rel="noreferrer"
          className="alert-item__link"
        >
          {t('alerts.moreInfo')}
        </a>
      )}
    </li>
  )
}

function AlertsModal({ isOpen, onClose, alerts }) {
  const t = useText()
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{t('alerts.modalTitle', [alerts.length])}</h2>
          <button className="modal__close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>
        <div className="modal__content">
          {alerts.length === 0 ? (
            <p>{t('alerts.noneActive')}</p>
          ) : (
            <ul className="alerts__list">
              {alerts.map((a) => (
                <AlertItem key={a.id} alert={a} />
              ))}
            </ul>
          )}
        </div>
        <div className="modal__footer">
          <button className="modal__btn-close" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Alerts({
  alerts,
  loading,
  error,
  selectedStopIds,
  selectedRouteNames
}) {
  const t = useText()
  const [expanded, setExpanded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  // Älä vie tilaa jos ei tiedotteita eikä virhettä.
  if (!error && alerts.length === 0) return null

  const sorted = [...alerts].sort(compareAlerts)

  // Tiedote on relevantti jos se osuu valittuun pysäkkiin TAI valitun pysäkin
  // reittiin (esim. "raitiovaunu 1" ilman Stop-entityä) TAI se on kohdistamaton
  // koko verkon tiedote, joka koskee kaikkia (ei pysäkki- eikä reittirajausta).
  const relevant = sorted.filter((a) => {
    const matchesStop = a.stopIds.some((id) => selectedStopIds.has(id))
    const matchesRoute = a.routeNames.some((n) => selectedRouteNames.has(n))
    const untargeted = a.stopIds.length === 0 && a.routeNames.length === 0
    return matchesStop || matchesRoute || untargeted
  })

  return (
    <section className="alerts">
      <button
        type="button"
        className="alerts__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="alerts__title">
          <span aria-hidden="true">⚠️</span> {t('alerts.title')}
          {relevant.length > 0 && (
            <span className="alerts__badge">{relevant.length}</span>
          )}
        </span>
        <span className="alerts__chevron" aria-hidden="true">
          {expanded ? '▴' : '▾'}
        </span>
      </button>

      {expanded && (
        <div className="alerts__body">
          {error && (
            <p className="alerts__error">
              {t('alerts.loadError', [error.message || String(error)])}
            </p>
          )}
          {!error && relevant.length > 0 && (
            <>
              <p className="alerts__note">{t('alerts.affecting')}</p>
              <ul className="alerts__list">
                {relevant.map((a) => (
                  <AlertItem key={a.id} alert={a} />
                ))}
              </ul>
            </>
          )}
          {!error && relevant.length === 0 && (
            <p className="alerts__note">{t('alerts.noneAtStops')}</p>
          )}
          <button
            type="button"
            className="alerts__show-all"
            onClick={() => setModalOpen(true)}
          >
            {t('alerts.showAll', [alerts.length])}
          </button>
        </div>
      )}

      <AlertsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        alerts={sorted}
      />
    </section>
  )
}
