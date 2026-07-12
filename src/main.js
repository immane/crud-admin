import { configureCompat, createApp } from 'vue'

import 'normalize.css/normalize.css' // A modern alternative to CSS resets

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import locale from 'element-plus/es/locale/lang/zh-cn'

import '@/styles/index.scss' // global css

import App from './App'
import store from './store'
import router from './router'

import '@/icons' // icon
import '@/permission' // permission control

import request from '@/utils/request'
import $getValue from 'get-value'

configureCompat({ MODE: 2 })

const app = createApp(App)
app.config.globalProperties.$getValue = $getValue
app.config.globalProperties.axios = request
app.directive('fit-columns', { mounted: () => {} })
app.use(store)
app.use(router)
app.use(ElementPlus, { locale })
app.mount('#app')
