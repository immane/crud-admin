import request from '@/utils/request'
import { ApiResponse } from '@/types/api'

export interface LoginPayload {
  username: string
  password: string
}

export interface UserInfo {
  roles: string[]
  username: string
  [key: string]: any
}

export function login(data: LoginPayload): Promise<ApiResponse<string>> {
  return request({
    url: '/api-login',
    method: 'post',
    data
  }) as Promise<ApiResponse<string>>
}

export function getInfo(): Promise<ApiResponse<UserInfo>> {
  return request({
    url: '/api/user',
    method: 'get'
  }) as Promise<ApiResponse<UserInfo>>
}

export function logout(): Promise<ApiResponse<UserInfo>> {
  return request({
    url: '/api/user',
    method: 'get'
  }) as Promise<ApiResponse<UserInfo>>
}