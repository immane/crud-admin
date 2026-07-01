import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'
import { ApiResponse } from '@/types/api'

const service: any = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 30000
})

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
      Message({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(new Error(res.message || 'Error'))
    }

    return res
  },
  (error: AxiosError<any>) => {
    const errorMessage = error.response?.data?.message || error.message || 'Error'

    Message({
      message: errorMessage,
      type: 'error',
      duration: 5 * 1000
    })

    return Promise.reject(error)
  }
)

export default service
