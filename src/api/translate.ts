/**
 * 翻译 API
 */

const getApiBaseUrl = () => (import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL ?? '') : '')

const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = localStorage.getItem('token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export interface TranslateRequest {
  text: string
  /** 目标语言，默认为中文 */
  targetLanguage?: 'zh' | 'en' | 'ja' | 'es'
}

export interface TranslateResponse {
  /** 翻译结果 */
  translation: string
  /** 拼音/发音指南 */
  pronunciation?: string
  /** 例句 */
  example?: {
    sentence: string
    translation: string
  }
}

/**
 * 翻译文本
 * @param request 翻译请求
 * @returns 翻译结果
 */
export const translateText = async (request: TranslateRequest): Promise<TranslateResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/translate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('authExpiry')
    window.location.href = '/?auth=required'
    throw new Error('未授权，请重新登录')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '翻译失败，请稍后重试' }))
    throw new Error(errorData.message || `请求失败，错误码: ${response.status}`)
  }

  return response.json()
}
