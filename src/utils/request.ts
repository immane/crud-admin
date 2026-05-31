import axios, { AxiosError, AxiosRequestConfig } from 'axios'
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
      config.headers['X-Auth-Token'] = getToken()
    }
    return config
  },
  error => Promise.reject(error)
)

service.interceptors.response.use(
  (response: { data: ApiResponse }) => {
    const res = response.data

    if (res.code !== 0) {
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