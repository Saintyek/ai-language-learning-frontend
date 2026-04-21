// Profile API Types

export type LanguageLevel = 'beginner' | 'intermediate' | 'advanced' | 'master'
export type Motivation = 'work' | 'travel' | 'exam' | 'career' | 'entertainment' | 'interest'
export type Goal = 'speaking' | 'listening' | 'reading' | 'writing' | 'vocabulary'
export type DailyTime = '15min' | '30min' | '1hour' | '1hour+'

export interface LanguageProfile {
  id: number
  userId: number
  language: string
  level: LanguageLevel
  motivations: Motivation[]
  goals: Goal[]
  dailyTime: DailyTime
  createdAt: string
  updatedAt: string
}

export interface CreateProfileRequest {
  level: LanguageLevel
  motivations: Motivation[]
  goals: Goal[]
  dailyTime: DailyTime
}

export interface GetProfileResponse {
  message: string
  data: LanguageProfile | null
}

export interface CreateProfileResponse {
  message: string
  data: LanguageProfile
}

// API Helper Functions

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

const getApiBaseUrl = () => (import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL ?? '') : '')

const parseErrorResponse = async (response: Response) => {
  try {
    const data = await response.json()
    if (typeof data?.message === 'string' && data.message) {
      return data.message
    }
    if (typeof data?.error === 'string' && data.error) {
      return data.error
    }
  } catch {
    const text = await response.text().catch(() => '')
    if (text) {
      return text
    }
  }

  return `Request failed with status: ${response.status}`
}

// API Functions

/**
 * Get profile for a specific language
 */
export const getProfile = async (language: string): Promise<GetProfileResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/profile/${language}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('authExpiry')
    window.location.href = '/?auth=required'
    throw new Error('Unauthorized, please login again')
  }

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response))
  }

  return response.json()
}

/**
 * Create or update profile for a specific language
 */
export const upsertProfile = async (
  language: string,
  data: CreateProfileRequest
): Promise<CreateProfileResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/profile/${language}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('authExpiry')
    window.location.href = '/?auth=required'
    throw new Error('Unauthorized, please login again')
  }

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response))
  }

  return response.json()
}

/**
 * Delete profile for a specific language
 */
export const deleteProfile = async (language: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/profile/${language}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('authExpiry')
    window.location.href = '/?auth=required'
    throw new Error('Unauthorized, please login again')
  }

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response))
  }
}
