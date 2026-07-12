import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import store from '@/store'
import router from '@/router'
import { getToken, getRefreshToken, setToken, setRefreshToken } from '@/utils/auth'
import { AUTH_API_PREFIX, apiPath } from '@/api/prefix'
import { ApiResponse } from '@/types/api'

const service: any = axios.create({
  baseURL: process.env.VITE_BASE_API,
  timeout: 30000
})

const refreshService = axios.create({
  baseURL: process.env.VITE_BASE_API,
  timeout: 30000
})

let refreshPromise: Promise<string> | null = null

const authPaths = [
  apiPath(AUTH_API_PREFIX, 'login'),
  apiPath(AUTH_API_PREFIX, 'logout'),
  apiPath(AUTH_API_PREFIX, 'token/refresh')
]

const isAuthRequest = (url?: string) => authPaths.some(path => url?.includes(path))

const clearSession = async() => {
  await store.dispatch('user/resetToken')
  if (router.currentRoute.value.path !== '/login') {
    router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath }})
  }
}

const refreshAccessToken = () => {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return Promise.reject(new Error('Session expired, please login again'))

    refreshPromise = refreshService.post(apiPath(AUTH_API_PREFIX, 'token/refresh'), { refresh_token: refreshToken })
      .then(response => {
        const body = response.data
        const data = typeof body.code === 'undefined' ? body : body.data
        if (!data?.access_token) throw new Error(body.message || 'Failed to refresh session')

        store.commit('user/SET_TOKEN', data.access_token)
        setToken(data.access_token)
        if (data.refresh_token) {
          store.commit('user/SET_REFRESH_TOKEN', data.refresh_token)
          setRefreshToken(data.refresh_token)
        }
        return data.access_token
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

const retryUnauthorizedRequest = async(error: AxiosError<any>) => {
  const config = error.config as AxiosRequestConfig & { _retry?: boolean }
  const status = error.response?.status || error.response?.data?.code
  if (status !== 401 || !config || config._retry || isAuthRequest(config.url)) {
    return Promise.reject(error)
  }

  config._retry = true
  try {
    const token = await refreshAccessToken()
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` }
    return service(config)
  } catch (refreshError) {
    await clearSession()
    return Promise.reject(refreshError)
  }
}

service.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    if (store.getters.token) {
      if (!config.headers) {
        config.headers = {}
      }
      config.headers.Authorization = `Bearer ${getToken()}`
    }
    return config
  },
  error => Promise.reject(error)
)

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    if (response.status === 204) {
      return { code: 0, data: null, message: 'SUCCESS' }
    }

    const res = response.data

    if (typeof res.code === 'undefined') {
      return { code: 0, data: res, message: 'SUCCESS' }
    }

    if (![0, 200].includes(res.code)) {
      if (res.code === 401) {
        const error = Object.assign(new Error(res.message || 'Unauthorized'), {
          config: response.config,
          response: { ...response, data: res }
        }) as AxiosError<any>
        return retryUnauthorizedRequest(error)
      }
      ElMessage({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(new Error(res.message || 'Error'))
    }

    return res
  },
  (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      return retryUnauthorizedRequest(error)
    }
    const errorMessage = error.response?.data?.message || error.message || 'Error'

    ElMessage({
      message: errorMessage,
      type: 'error',
      duration: 5 * 1000
    })

    return Promise.reject(error)
  }
)

export default service
