import React, { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Input } from '@douyinfe/semi-ui'
import { IconSend } from '@douyinfe/semi-icons'
import { languageOptions } from '@/consts/languages'
import DigitalHumanStage from '@/components/DigitalHumanStage'
import { getDigitalHumanStatus, type DigitalHumanInfo } from '@/api/digitalHuman'
import 'flag-icons/css/flag-icons.min.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const Chat: React.FC = () => {
  const { langCode } = useParams<{ langCode: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [digitalHuman, setDigitalHuman] = useState<DigitalHumanInfo>({ status: 'not_created' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 获取当前语言信息
  const currentLanguage = languageOptions.find(lang => lang.code === langCode)

  // 仅在有消息更新时滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    let isMounted = true

    getDigitalHumanStatus()
      .then(data => {
        if (isMounted) {
          setDigitalHuman(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          setDigitalHuman({ status: 'failed' })
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true)
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `你好！我是你的${currentLanguage?.label || '语言'}学习助手。你说的是："${userMessage}"。让我们开始练习吧！`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1000)
  }

  // 发送消息
  const handleSend = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    simulateAIResponse(inputValue.trim())
  }

  // 按回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧数字人区域 */}
        <div className="hidden lg:flex w-2/5 xl:w-1/3 bg-gradient-to-b from-indigo-100/50 to-purple-100/50 flex-col items-center justify-center p-8 border-r border-slate-200/30">
          <div className="relative">
            {/* 光环效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full blur-3xl opacity-30 animate-pulse" />
            <div className="absolute inset-4 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full blur-2xl opacity-40" />

            {/* 数字人容器 */}
            <DigitalHumanStage
              status={digitalHuman.status}
              imageUrl={digitalHuman.frontendPicUrl}
              isThinking={isTyping}
              languageLabel={currentLanguage?.label || '语言'}
            />

            {/* 装饰元素 */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">AI</span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">AI 语言导师</h2>
            <p className="text-slate-600 max-w-xs">
              我将帮助你练习{currentLanguage?.label || '语言'}， 通过自然对话提升你的语言能力
            </p>
          </div>

          {/* 学习统计 */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-xs text-slate-500">对话次数</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <div className="text-xs text-slate-500">准确率</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-xs text-slate-500">学习天数</div>
            </div>
          </div>
        </div>

        {/* 右侧聊天区域 */}
        <div className="flex-1 flex flex-col bg-white/50">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium">开始你的语言学习之旅</p>
                <p className="text-sm mt-2">在下方输入框中输入你想说的话</p>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-md'
                        : 'bg-white text-slate-700 rounded-bl-md border border-slate-100'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}
                    >
                      {message.timestamp.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* AI 正在输入 */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="flex-shrink-0 p-4 bg-white/80 backdrop-blur-sm border-t border-slate-200/50">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-3">
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <Input
                    value={inputValue}
                    onChange={setInputValue}
                    onKeyPress={handleKeyPress}
                    placeholder="输入你想说的话..."
                    className="border-none shadow-none"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <Button
                  theme="solid"
                  type="primary"
                  icon={<IconSend />}
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="rounded-xl h-12 w-12"
                  style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                按 Enter 发送消息，Shift + Enter 换行
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
