import en from './en.json'
import zh from './zh.json'
import { getCookie, setCookie } from '../utils/cookies'

export type Lang = 'en' | 'zh'

const translations: Record<Lang, typeof en> = { en, zh }

const COOKIE_KEY = 'herbtable_lang'

function resolveInitialLang(): Lang {
  const stored = getCookie(COOKIE_KEY)
  if (stored === 'en' || stored === 'zh') return stored
  return 'en'
}

let currentLang: Lang = resolveInitialLang()

/** Set the current language and persist it in a cookie. */
export function setLang(lang: Lang) {
  currentLang = lang
  setCookie(COOKIE_KEY, lang, { days: 365, sameSite: 'lax' })
}

/** Toggle between English and Chinese. */
export function toggleLang() {
  const next = currentLang === 'en' ? 'zh' : 'en'
  setLang(next)
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

/** Get current language. */
export function getLang(): Lang {
  return currentLang
}

/** Get a nested translation value by dot-separated key. */
export function t(key: string): string {
  const keys = key.split('.')
  let value: unknown = translations[currentLang]
  for (const k of keys) {
    if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[k]
    } else {
      // Fallback to English
      value = translations.en
      for (const fk of keys) {
        if (value && typeof value === 'object' && fk in (value as Record<string, unknown>)) {
          value = (value as Record<string, unknown>)[fk]
        } else {
          return key
        }
      }
    }
  }
  return typeof value === 'string' ? value : key
}
