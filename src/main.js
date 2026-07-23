import { createApp } from 'vue'

import 'normalize.css/normalize.css' // A modern alternative to CSS resets

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import enLocale from 'element-plus/es/locale/lang/en'
import zhLocale from 'element-plus/es/locale/lang/zh-cn'
import zhTwLocale from 'element-plus/es/locale/lang/zh-tw'
import jaLocale from 'element-plus/es/locale/lang/ja'

import '@/styles/index.scss' // global css

import App from './App'
import store from './store'
import router from './router'

import installIcons from '@/icons'
import installLegacyIcons from '@/icons/legacy-icons'
import i18n from '@/i18n'
import { applyTheme, getTheme } from '@/utils/theme'
import '@/permission' // permission control

import request from '@/utils/request'
import $getValue from 'get-value'

const localeMap = { en: enLocale, zh: zhLocale, 'zh-Hant': zhTwLocale, ja: jaLocale }

function detectLocale() {
  const stored = localStorage.getItem('app_locale')
  if (stored && localeMap[stored]) return stored
  const nav = navigator.language || ''
  if (nav.startsWith('zh')) return 'zh'
  return 'en'
}

const currentLocale = detectLocale()
applyTheme(getTheme())

const app = createApp(App)
installIcons(app)
installLegacyIcons(app)
app.config.globalProperties.$getValue = $getValue
app.config.globalProperties.$axios = request
app.directive('fit-columns', { mounted: () => {} })
app.use(store)
app.use(router)
app.use(i18n)
app.use(ElementPlus, { locale: localeMap[currentLocale] })
app.mount('#app')
