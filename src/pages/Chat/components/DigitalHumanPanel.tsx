import React from 'react'
import DigitalHumanStage from '@/components/DigitalHumanStage'
import type { DigitalHumanInfo } from '@/api/digitalHuman'

interface DigitalHumanPanelProps {
  digitalHuman: DigitalHumanInfo
  generating: boolean
  languageLabel: string
}

/**
 * 数字人面板组件
 * 显示数字人状态和相关统计信息
 */
export const DigitalHumanPanel: React.FC<DigitalHumanPanelProps> = ({
  digitalHuman,
  generating,
  languageLabel,
}) => {
  return (
    <div className="hidden lg:flex w-2/5 xl:w-1/3 bg-linear-to-b from-indigo-100/50 to-purple-100/50 flex-col items-center justify-center p-8 border-r border-slate-200/30">
      <div className="relative">
        <div className="absolute inset-0 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute inset-4 bg-linear-to-r from-sky-400 to-indigo-500 rounded-full blur-2xl opacity-40" />

        <DigitalHumanStage
          status={digitalHuman.status}
          imageUrl={digitalHuman.frontendPicUrl}
          isThinking={generating}
          languageLabel={languageLabel}
        />
      </div>

      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">AI 语言导师</h2>
        <p className="text-slate-600 max-w-xs">
          我将帮助你练习{languageLabel}， 通过自然对话提升你的语言能力
        </p>
      </div>

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
  )
}

export default DigitalHumanPanel
