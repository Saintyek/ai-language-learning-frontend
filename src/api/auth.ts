import { post } from '../utils/request'

// 定义用户信息类型
export interface UserInfo {
  id: number | string
  username: string
  email: string
  avatar?: string
  createdAt: string
  updatedAt?: string
}

// 定义登录请求参数类型
export interface LoginParams {
  email: string
  password: string
}

// 定义 API 响应格式
interface ApiResponse<T> {
  message: string
  data: T
}

// 定义登录响应数据类型
interface LoginData {
  id: number | string
  username: string
  email: string
  createdAt: string
  updatedAt?: string
  token?: string
}

// 定义注册请求参数类型
export interface RegisterParams {
  username: string
  email: string
  password: string
  confirmPassword: string
}

// 定义注册响应数据类型
interface RegisterData {
  id: number | string
  username: string
  email: string
  createdAt: string
  updatedAt?: string
  token?: string
}

// 登录 API
export const login = async (params: LoginParams): Promise<{ token?: string; userInfo: UserInfo }> => {
  const response = await post<ApiResponse<LoginData>>('/api/auth/login', params)
  const { data } = response
  return {
    token: data.token, // 目前后端未返回 token
    userInfo: {
      id: data.id,
      username: data.username,
      email: data.email,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    }
  }
}

// 注册 API
export const register = async (params: RegisterParams): Promise<{ token?: string; userInfo: UserInfo }> => {
  const response = await post<ApiResponse<RegisterData>>('/api/auth/register', params)
  const { data } = response
  return {
    token: data.token, // 目前后端未返回 token
    userInfo: {
      id: data.id,
      username: data.username,
      email: data.email,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    }
  }
}

// 认证数据过期时间：1天（毫秒）
const AUTH_EXPIRY_TIME = 24 * 60 * 60 * 1000

// 保存 token 和用户信息到 localStorage
export const saveAuthData = (token: string | undefined, userInfo: UserInfo): void => {
  // 保存过期时间
  localStorage.setItem('authExpiry', String(Date.now() + AUTH_EXPIRY_TIME))

  if (token) {
    localStorage.setItem('token', token)
  }
  // 暂时用用户 ID 作为临时标识（后续后端返回 token 后可移除）
  if (!token && userInfo.id) {
    localStorage.setItem('userId', String(userInfo.id))
  }
  localStorage.setItem('userInfo', JSON.stringify(userInfo))
}

// 检查认证数据是否过期，如果过期则清除
export const checkAndClearExpiredAuth = (): boolean => {
  const expiryStr = localStorage.getItem('authExpiry')
  if (!expiryStr) {
    // 没有过期时间，清除所有认证数据
    clearAuthData()
    return true
  }

  const expiry = parseInt(expiryStr, 10)
  if (Date.now() > expiry) {
    // 已过期，清除认证数据
    clearAuthData()
    return true
  }

  return false
}

// 从 localStorage 获取用户信息
export const getUserInfo = (): UserInfo | null => {
  // 先检查是否过期
  if (checkAndClearExpiredAuth()) {
    return null
  }

  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    try {
      return JSON.parse(userInfoStr)
    } catch (error) {
      console.error('解析用户信息失败:', error)
      return null
    }
  }
  return null
}

// 清除认证数据
export const clearAuthData = (): void => {
  localStorage.removeItem('token')
  localStorage.removeItem('userId')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('authExpiry')
}

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  // 先检查是否过期
  if (checkAndClearExpiredAuth()) {
    return false
  }

  return !!localStorage.getItem('token') || !!localStorage.getItem('userId')
}
