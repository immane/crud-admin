import { reactive } from 'vue'
import en from './en'
import zh from './zh'
import zhHant from './zh-Hant'
import ja from './ja'

const messages = { en, zh, 'zh-Hant': zhHant, ja }
const STORAGE_KEY = 'app_locale'

function detectLocale() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && messages[stored]) return stored
  const nav = navigator.language || ''
  if (nav.startsWith('zh')) {
    if (nav.includes('TW') || nav.includes('HK') || nav.includes('Hant')) return 'zh-Hant'
    return 'zh'
  }
  if (nav.startsWith('ja')) return 'ja'
  return 'en'
}

const state = reactive({ locale: detectLocale() })

function t(key, ...args) {
  const value = messages[state.locale]?.[key]
  if (typeof value !== 'string') {
    console.warn(`[i18n] Missing key: "${key}" (${state.locale})`)
    return key
  }
  if (args.length) {
    return value.replace(/\{(\d+)\}/g, (_, i) => String(args[i] ?? ''))
  }
  return value
}

function setLocale(locale) {
  if (messages[locale]) {
    state.locale = locale
    localStorage.setItem(STORAGE_KEY, locale)
  }
}

function getLocale() {
  return state.locale
}

export { t, setLocale, getLocale }

export default {
  install(app) {
    app.config.globalProperties.$t = t
    app.config.globalProperties.$locale = state.locale
    app.config.globalProperties.$setLocale = setLocale
  }
}
