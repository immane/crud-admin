import { reactive } from 'vue'
import en from './en'
import zh from './zh'

const messages = { en, zh }
const STORAGE_KEY = 'app_locale'

function detectLocale() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && messages[stored]) return stored
  const nav = navigator.language || ''
  if (nav.startsWith('zh')) return 'zh'
  return 'en'
}

const state = reactive({
  locale: detectLocale()
})

function t(key, ...args) {
  const keys = key.split('.')
  let value = messages[state.locale]
  for (const k of keys) {
    if (value == null) break
    value = value[k]
  }
  if (typeof value !== 'string') {
    console.warn(`[i18n] Missing key: ${key} (${state.locale})`)
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

export { t, setLocale }

export default {
  install(app) {
    app.config.globalProperties.$t = t
    app.config.globalProperties.$locale = state.locale
    app.config.globalProperties.$setLocale = setLocale
  }
}
