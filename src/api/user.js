import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/api-login',
    method: 'post',
    data
  })
}

export function getInfo() {
  return request({
    url: '/api/user',
    method: 'get'
  })
}

export function logout() {
  // dummy operation no used
  return request({
    url: '/api/user',
    method: 'get'
  })
}
