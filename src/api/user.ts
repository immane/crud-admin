import request from '@/utils/request'
import { ApiResponse } from '@/types/api'
import { API_PREFIX, AUTH_API_PREFIX, apiPath } from '@/api/prefix'

export interface LoginPayload {
  identifier: string
  password: string
}

export interface LoginResponse {
  access_token: string
  expires_in?: number
  refresh_token?: string
}

export interface UserInfo {
  roles?: string[]
  username?: string
  email?: string
  [key: string]: any
}

export function login(data: LoginPayload): Promise<ApiResponse<LoginResponse>> {
  return request({
    url: apiPath(AUTH_API_PREFIX, 'login'),
    method: 'post',
    data
  }) as Promise<ApiResponse<LoginResponse>>
}

export function getInfo(): Promise<ApiResponse<UserInfo>> {
  return request({
    url: apiPath(API_PREFIX, 'app/users/me'),
    method: 'get'
  }) as Promise<ApiResponse<UserInfo>>
}

export function logout(refreshToken?: string): Promise<ApiResponse<UserInfo>> {
  return request({
    url: apiPath(AUTH_API_PREFIX, 'logout'),
    method: 'post',
    data: refreshToken ? { refresh_token: refreshToken } : undefined
  }) as Promise<ApiResponse<UserInfo>>
}
