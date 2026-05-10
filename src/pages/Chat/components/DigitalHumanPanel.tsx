import React from 'react'
import type { DigitalHumanState, DigitalHumanVideoSet } from '@/consts/digitalHuman'

interface DigitalHumanPanelProps {
  /** 当前语言对应的两段循环视频资源 */
  videoSet: DigitalHumanVideoSet
  /** 当前数字人应展示的状态：talking 或 idle */
  state: DigitalHumanState
  /** 当前学习语言的展示文案，用于面板说明 */
  languageLabel: string
}

/**
 * 数字人面板：双视频叠加 + 透明度切换实现"假装说话"
 *
 * 核心思路：
 * - 同时挂载 idle 与 talking 两段循环视频，均处于 muted + autoplay + loop 状态
 * - 当前状态对应的视频 opacity=1，另一段 opacity=0，并用 transition 平滑过渡
 * - 视频静音播放，不与 TTS / 实时语音的音频链路冲突
 * - playsInline 防止 iOS Safari 自动全屏
 */
export const DigitalHumanPanel: React.FC<DigitalHumanPanelProps> = ({
  videoSet,
  state,
  languageLabel,
}) => {
  // 是否处于说话态：用于切换两个 <video> 的层叠透明度
  const isTalking = state === 'talking'

  return (
    <div className="hidden lg:flex w-2/5 xl:w-1/3 bg-linear-to-b from-indigo-100/50 to-purple-100/50 flex-col items-center justify-center p-8 border-r border-slate-200/30">
      {/* 数字人形象舞台：圆形容器 + 渐变光晕背景 */}
      {/* 注：使用 aspect-square 保证圆形不被拉成椭圆；rounded-full 实现正圆裁剪 */}
      {/* 外层包裹一层蓝色渐变描边：用 padding 形成"边框"，内层视频圆形居中 */}
      <div className="relative w-72 aspect-square rounded-full bg-linear-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30">
        {/* 渐变描边外侧再叠一层柔和光晕，强化主色调蓝 */}
        <div className="absolute -inset-4 bg-linear-to-r from-sky-400 via-blue-500 to-indigo-500 rounded-full blur-3xl opacity-40 animate-pulse pointer-events-none" />

        {/* 内层圆形视频容器：相对定位承载两段叠加视频 */}
        <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
          {/* 空闲循环视频：默认可见，talking 时淡出 */}
          <video
            key={`idle-${videoSet.idle}`}
            src={videoSet.idle}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isTalking ? 'opacity-0' : 'opacity-100'
            }`}
            autoPlay
            loop
            muted
            playsInline
          />

          {/* 说话循环视频：talking 时淡入覆盖 */}
          <video
            key={`talking-${videoSet.talking}`}
            src={videoSet.talking}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isTalking ? 'opacity-100' : 'opacity-0'
            }`}
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </div>

      {/* 文案区域 */}
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">AI 语言导师</h2>
        <p className="text-slate-600 max-w-xs">
          我将帮助你练习{languageLabel}， 通过自然对话提升你的语言能力
        </p>
      </div>

      {/*
        语音控件挂载点（保留 ID）
        ChatInputArea 通过 portal 把 VoiceRecorder 渲染到此处，必须保留
      */}
      <div
        id="digital-human-voice-controls"
        className="mt-8 w-full max-w-xs rounded-2xl bg-white/65 p-4 text-center shadow-sm backdrop-blur-sm"
      />
    </div>
  )
}

export default DigitalHumanPanel
