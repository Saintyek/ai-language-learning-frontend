import React from 'react'
import { Avatar } from '@douyinfe/semi-ui'
import type { DigitalHumanStatus } from '@/api/digitalHuman'

interface DigitalHumanStageProps {
  status: DigitalHumanStatus
  imageUrl?: string
  isThinking: boolean
  languageLabel: string
}

const statusCopy: Record<DigitalHumanStatus, { title: string; description: string }> = {
  not_created: {
    title: '数字人待创建',
    description: '接入火山训练结果后，将在这里展示你的专属导师形象。',
  },
  training: {
    title: '数字人生成中',
    description: '已提交克隆任务，形象训练完成后会自动展示。',
  },
  ready: {
    title: '数字人已就绪',
    description: '当前展示的是训练完成后可用于前端呈现的形象图。',
  },
  failed: {
    title: '数字人暂不可用',
    description: '训练结果获取失败，请稍后重试或检查后端任务状态。',
  },
}

const DigitalHumanStage: React.FC<DigitalHumanStageProps> = ({
  status,
  imageUrl,
  isThinking,
  languageLabel,
}) => {
  const copy = statusCopy[status]
  const showImage = status === 'ready' && imageUrl

  return (
    <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-white via-blue-50 to-indigo-100 shadow-2xl border-4 border-white/50 overflow-hidden">
      <div
        className={`absolute inset-0 transition-transform duration-700 ${isThinking ? 'scale-105' : 'scale-100'}`}
      >
        <div
          className={`absolute inset-5 rounded-full border border-cyan-200/70 ${isThinking ? 'animate-ping' : 'animate-pulse'}`}
        />
        <div className="absolute inset-7 rounded-full bg-gradient-to-br from-white/70 via-sky-100/60 to-indigo-200/80" />
        <div
          className={`absolute inset-x-10 top-6 h-20 rounded-full bg-cyan-300/25 blur-2xl transition-opacity duration-500 ${
            isThinking ? 'opacity-100' : 'opacity-60'
          }`}
        />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        {showImage ? (
          <div className="relative flex h-44 w-44 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-cyan-300/20 to-indigo-400/25 blur-2xl" />
            <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-white/80 shadow-xl">
              <img
                src={imageUrl}
                alt={`${languageLabel}数字人形象`}
                className={`h-full w-full object-cover transition-transform duration-700 ${
                  isThinking ? 'scale-105' : 'scale-100'
                }`}
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/15 to-transparent" />
            </div>
            <div
              className={`absolute -bottom-1 left-1/2 h-3 w-20 -translate-x-1/2 rounded-full bg-cyan-400/45 blur-md ${
                isThinking ? 'animate-pulse' : ''
              }`}
            />
          </div>
        ) : (
          <div className="relative flex h-44 w-44 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/70 to-indigo-100/80 shadow-inner" />
            <div className="absolute inset-5 rounded-full border border-dashed border-cyan-300/60" />
            <div className="relative flex flex-col items-center gap-3 px-5">
              <Avatar size="extra-large" color="blue">
                AI
              </Avatar>
              {status === 'training' && (
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '120ms' }} />
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '240ms' }} />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 rounded-2xl bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
          <p className="text-sm font-semibold text-slate-700">{copy.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{copy.description}</p>
        </div>
      </div>

      <div
        className={`absolute inset-y-0 left-[-30%] w-[40%] -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-1000 ${
          isThinking ? 'translate-x-[260%]' : 'translate-x-0 opacity-0'
        }`}
      />
    </div>
  )
}

export default DigitalHumanStage
