import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'

// 创建 axios 实例
// 注意：开发环境通过 Vite 代理转发请求，不设置 baseURL
// 生产环境可以通过环境变量设置 baseURL
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL : '',
  timeout: 15000, // 请求超时时间 15 秒
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token（目前后端未返回 token，暂时保留代码）
    const token = localStorage.getItem('token')
    
    // 如果 token 存在，添加到请求头中
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error: AxiosError) => {
    // 请求错误处理
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 后端响应格式: { message: string, data: any }
    const { message } = response.data
    
    // HTTP 状态码为 200 系列都认为成功
    if (response.status >= 200 && response.status < 300) {
      return response.data
    }
    
    return Promise.reject(new Error(message || '请求失败'))
  },
  (error: AxiosError) => {
    // 响应错误处理
    let errorMessage = '网络请求失败，请稍后重试'
    
    if (error.response) {
      // 服务器返回了错误状态码
      const { status, data } = error.response as any
      
      // 尝试从错误响应中获取 message
      const serverMessage = data?.message || data?.error
      
      switch (status) {
        case 400:
          errorMessage = serverMessage || '请求参数错误'
          break
        case 401:
          errorMessage = serverMessage || '未授权，请重新登录'
          // 如果是登录或注册接口，不自动跳转
          const url = error.config?.url || ''
          if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
            window.location.href = '/login'
          }
          break
        case 403:
          errorMessage = serverMessage || '拒绝访问'
          break
        case 404:
          errorMessage = serverMessage || '请求地址不存在'
          break
        case 409:
          errorMessage = serverMessage || '资源已存在'
          break
        case 500:
          errorMessage = serverMessage || '服务器内部错误'
          break
        case 502:
          errorMessage = '网关错误'
          break
        case 503:
          errorMessage = '服务不可用'
          break
        case 504:
          errorMessage = '网关超时'
          break
        default:
          errorMessage = serverMessage || `请求失败，错误码: ${status}`
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '网络连接失败，请检查网络'
    }
    
    console.error('响应错误:', error)
    return Promise.reject(new Error(errorMessage))
  }
)

// 封装 GET 请求
export function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.get(url, config)
}

// 封装 POST 请求
export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return request.post(url, data, config)
}

// 封装 PUT 请求
export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return request.put(url, data, config)
}

// 封装 DELETE 请求
export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.delete(url, config)
}

export default request
