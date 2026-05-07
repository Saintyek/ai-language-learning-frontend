export interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant'
  content: string
  id?: string
}

export interface StreamChatParams {
  messages: ChatMessagePayload[]
  signal?: AbortSignal
  onChunk: (chunk: string) => void
  /** 场景标识，格式为 "一级场景/二级场景" */
  scenario?: string
  /** 目标学习语言：cn-中文, jp-日文, es-西班牙语, us-美式英语 */
  language?: string
  /** 会话ID，如果传了则会保存消息到该会话 */
  sessionId?: string
  /** 是否启用 TTS 语音合成 */
  enableTTS?: boolean
  /** TTS 音频回调 */
  onAudio?: (audioBase64: string) => void
}

interface StreamEventPayload {
  type?: string
  delta?: string
  content?: string
  text?: string
  message?: string
  error?: string
  done?: boolean
  audio?: string
  ttsEnabled?: boolean
}

const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream, application/x-ndjson, application/json',
  }

  const token = localStorage.getItem('token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

const getApiBaseUrl = () => (import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL ?? '') : '')

const parseEventData = (value: string): StreamEventPayload | null => {
  const trimmedValue = value.trim()
  if (!trimmedValue) return null

  try {
    return JSON.parse(trimmedValue) as StreamEventPayload
  } catch {
    return null
  }
}

const getChunkText = (payload: StreamEventPayload | null) => {
  if (!payload) return ''

  return payload.delta ?? payload.content ?? payload.text ?? ''
}

const getErrorMessage = (payload: StreamEventPayload | null) => {
  if (!payload) return ''
  return payload.error ?? payload.message ?? ''
}

const processSSEBuffer = (
  buffer: string,
  onChunk: (chunk: string) => void,
  onAudio?: (audioBase64: string) => void
): { remainingBuffer: string; done: boolean; errorMessage?: string } => {
  const events = buffer.split(/\r?\n\r?\n/)
  const remainingBuffer = events.pop() ?? ''

  for (const eventBlock of events) {
    const lines = eventBlock
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)

    if (!lines.length) continue

    let eventName = 'message'
    const dataLines: string[] = []

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim())
      }
    }

    const rawData = dataLines.join('\n')

    if (!rawData) continue
    if (rawData === '[DONE]') {
      return { remainingBuffer, done: true }
    }

    const payload = parseEventData(rawData)
    const payloadType = payload?.type

    if (eventName === 'error' || payloadType === 'error') {
      return {
        remainingBuffer,
        done: true,
        errorMessage: getErrorMessage(payload) || '对话生成失败，请稍后重试',
      }
    }

    if (
      eventName === 'done' ||
      payloadType === 'done' ||
      payloadType === 'complete' ||
      payload?.done
    ) {
      return { remainingBuffer, done: true }
    }

    if (eventName === 'start') {
      continue
    }

    // 处理音频事件
    if (eventName === 'audio' && payload?.audio && onAudio) {
      onAudio(payload.audio)
      continue
    }

    const chunkText = getChunkText(payload)
    if (chunkText) {
      onChunk(chunkText)
    }
  }

  return { remainingBuffer, done: false }
}

const processNDJSONBuffer = (
  buffer: string,
  onChunk: (chunk: string) => void
): { remainingBuffer: string; done: boolean; errorMessage?: string } => {
  const lines = buffer.split(/\n/)
  const remainingBuffer = lines.pop() ?? ''

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    if (trimmedLine === '[DONE]') {
      return { remainingBuffer, done: true }
    }

    const payload = parseEventData(trimmedLine)
    const payloadType = payload?.type

    if (payloadType === 'error') {
      return {
        remainingBuffer,
        done: true,
        errorMessage: getErrorMessage(payload) || '对话生成失败，请稍后重试',
      }
    }

    if (payloadType === 'done' || payloadType === 'complete' || payload?.done) {
      return { remainingBuffer, done: true }
    }

    const chunkText = getChunkText(payload) || trimmedLine
    if (chunkText) {
      onChunk(chunkText)
    }
  }

  return { remainingBuffer, done: false }
}

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

  return `请求失败，错误码: ${response.status}`
}

// 聊天会话相关类型
export interface ChatSession {
  id: string
  userId: number
  title: string
  scenario: string | null
  language: string | null
  createdAt: string
  updatedAt: string
}

export interface GetSessionsResponse {
  message: string
  data: ChatSession[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

export interface GetSessionDetailResponse {
  message: string
  data: (ChatSession & { messages: ChatMessage[] }) | null
}

export interface ChatMessage {
  id: number
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

// 获取聊天会话列表
export const getChatSessions = async (
  page: number = 1,
  limit: number = 20
): Promise<GetSessionsResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/chat/sessions?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(),
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
    throw new Error(await parseErrorResponse(response))
  }

  return response.json()
}

// 获取会话详情
export const getChatSessionDetail = async (
  sessionId: string
): Promise<GetSessionDetailResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/chat/sessions/${sessionId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
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
    throw new Error(await parseErrorResponse(response))
  }

  return response.json()
}

// 删除会话
export const deleteChatSession = async (sessionId: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
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
    throw new Error(await parseErrorResponse(response))
  }
}

// 创建会话响应类型
export interface CreateSessionResponse {
  message: string
  data: ChatSession
}

// 创建新会话
export const createChatSession = async (
  title?: string,
  scenario?: string,
  language?: string
): Promise<CreateSessionResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/chat/sessions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, scenario, language }),
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
    throw new Error(await parseErrorResponse(response))
  }

  return response.json()
}

export const streamChatMessage = async ({
  messages,
  signal,
  onChunk,
  scenario,
  language,
  sessionId,
  enableTTS,
  onAudio,
}: StreamChatParams): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/chat/messages/stream`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ messages, scenario, language, sessionId, enableTTS }),
    signal,
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
    throw new Error(await parseErrorResponse(response))
  }

  if (!response.body) {
    throw new Error('当前环境不支持流式响应，请稍后重试')
  }

  const contentType = response.headers.get('content-type') ?? ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  const isSSE = contentType.includes('text/event-stream')

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const result = isSSE
      ? processSSEBuffer(buffer, onChunk, onAudio)
      : processNDJSONBuffer(buffer, onChunk)
    buffer = result.remainingBuffer

    if (result.errorMessage) {
      throw new Error(result.errorMessage)
    }

    if (result.done) {
      break
    }
  }

  buffer += decoder.decode()
  if (buffer.trim()) {
    const result = isSSE
      ? processSSEBuffer(buffer + '\n\n', onChunk, onAudio)
      : processNDJSONBuffer(buffer + '\n\n', onChunk)
    if (result.errorMessage) {
      throw new Error(result.errorMessage)
    }
  }
}
