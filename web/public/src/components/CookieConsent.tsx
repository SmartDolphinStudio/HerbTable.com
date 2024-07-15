import { useEffect, useState } from 'react'
import { t } from '../i18n'
import { getCookie, setCookie } from '../utils/cookies'

const CONSENT_COOKIE = 'herbtable_cookie_consent'

/** Bottom-right cookie consent banner with policy modal. */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showPolicy, setShowPolicy] = useState(false)

  useEffect(() => {
    const consent = getCookie(CONSENT_COOKIE)
    if (!consent) setVisible(true)
  }, [])

  const handleAccept = () => {
    setCookie(CONSENT_COOKIE, 'accepted', { days: 365, sameSite: 'lax' })
    setVisible(false)
  }

  const handleDecline = () => {
    setCookie(CONSENT_COOKIE, 'declined', { days: 365, sameSite: 'lax' })
    setVisible(false)
  }

  if (!visible && !showPolicy) return null

  return (
    <>
      {visible && (
        <div className="fixed bottom-6 right-6 z-[90] max-w-sm w-[calc(100%-3rem)] bg-white border border-black/10 shadow-2xl rounded-xl p-6 animate-[fadeIn_0.3s_ease-out]">
          <h3 className="font-headline-lg text-headline-lg text-primary mb-2">{t('cookies.title')}</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">{t('cookies.description')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAccept}
              className="px-5 py-2.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('cookies.accept')}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="px-5 py-2.5 border border-black/10 font-label-md text-label-md text-on-surface rounded-lg hover:bg-surface-container transition-colors"
            >
              {t('cookies.decline')}
            </button>
            <button
              type="button"
              onClick={() => setShowPolicy(true)}
              className="font-label-md text-label-md text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              {t('cookies.policy')}
            </button>
          </div>
        </div>
      )}

      {showPolicy && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-6"
          onClick={() => setShowPolicy(false)}
        >
          <div
            className="bg-white rounded-xl border border-black/10 shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-lg text-headline-lg text-primary">{t('cookies.policy')}</h2>
              <button
                type="button"
                onClick={() => setShowPolicy(false)}
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
              {t('cookies.policyContent')}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPolicy(false)}
                className="px-6 py-2.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:opacity-90 transition-opacity"
              >
                {t('cookies.accept')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
