export interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant'
  content: string
  id?: string
}

export interface StreamChatParams {
  messages: ChatMessagePayload[]
  signal?: AbortSignal
  onChunk: (chunk: string) => void
}

interface StreamEventPayload {
  type?: string
  delta?: string
  content?: string
  text?: string
  message?: string
  error?: string
  done?: boolean
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

const getApiBaseUrl = () => (import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL ?? '' : '')

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

    if (eventName === 'done' || payloadType === 'done' || payloadType === 'complete' || payload?.done) {
      return { remainingBuffer, done: true }
    }

    if (eventName === 'start') {
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
  onChunk: (chunk: string) => void,
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

export const streamChatMessage = async ({
  messages,
  signal,
  onChunk,
}: StreamChatParams): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/chat/messages/stream`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ messages }),
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
  const processBuffer = contentType.includes('text/event-stream') ? processSSEBuffer : processNDJSONBuffer

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const result = processBuffer(buffer, onChunk)
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
    const result = processBuffer(buffer + '\n\n', onChunk)
    if (result.errorMessage) {
      throw new Error(result.errorMessage)
    }
  }
}