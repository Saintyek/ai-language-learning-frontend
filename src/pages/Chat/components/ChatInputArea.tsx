import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AIChatInput, Checkbox } from '@douyinfe/semi-ui'
import type { Content } from '@douyinfe/semi-foundation/lib/es/aiChatInput/interface'
import { SceneSelector } from './SceneSelector'
import { VoiceRecorder } from '../../../components/VoiceRecorder'
import type { UseSceneSelectionReturn } from '../hooks/useSceneSelection'
import type { UseChatReturn } from '../hooks/useChat'
import type { UseVoiceChatReturn } from '@/hooks/useVoiceChat'

const VOICE_CONTROLS_PORTAL_ID = 'digital-human-voice-controls'

interface ChatInputAreaProps extends Pick<
  UseChatReturn,
  'generating' | 'stopGenerating' | 'extractPlainText' | 'languageLabel'
> {
  /** 当前语言代码：语言切换时用于重挂载录音组件，确保本地麦克风采集被清理 */
  langCode?: string
  sceneSelection: UseSceneSelectionReturn
  sceneDropdownVisible: boolean
  setSceneDropdownVisible: (visible: boolean) => void
  onMessageSend: (text: string) => void
  voiceChat?: UseVoiceChatReturn
  pronunciationAnalysisEnabled: boolean
  onPronunciationAnalysisChange: (enabled: boolean) => void
}

/**
 * 聊天输入区域组件
 */
export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  generating,
  stopGenerating,
  extractPlainText,
  languageLabel,
  langCode,
  sceneSelection,
  sceneDropdownVisible,
  setSceneDropdownVisible,
  onMessageSend,
  voiceChat,
  pronunciationAnalysisEnabled,
  onPronunciationAnalysisChange,
}) => {
  const [voiceControlsContainer, setVoiceControlsContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setVoiceControlsContainer(document.getElementById(VOICE_CONTROLS_PORTAL_ID))
  }, [])

  const isPronunciationCheckboxDisabled = Boolean(
    voiceChat?.isConnecting || voiceChat?.isRecordingInput
  )

  const handleMessageSend = ({ inputContents }: { inputContents: Content[] }) => {
    const text = extractPlainText(inputContents)
    onMessageSend(text)
  }

  const renderActionArea = useCallback(({ menuItem }: { menuItem: React.ReactNode[] }) => {
    const sendButton = menuItem.at(-1)

    return <div>{sendButton}</div>
  }, [])

  const voiceControls = (
    <div className="flex flex-col items-center gap-3">
      <VoiceRecorder
        key={langCode ?? 'unknown'}
        variant="pill"
        disabled={generating}
        sendAudio={voiceChat?.sendAudio}
        isConnected={voiceChat?.isConnected}
        isConnecting={voiceChat?.isConnecting}
        sessionPronunciationAnalysisEnabled={voiceChat?.sessionPronunciationAnalysisEnabled}
        onStartSession={voiceChat?.startVoiceSession}
        onStopRecording={voiceChat?.stopRecording}
        onEndSession={voiceChat?.endVoiceSession}
        onResetTranscript={voiceChat?.resetTranscript}
        asrInterimText={voiceChat?.asrInterimText}
        asrFinalText={voiceChat?.asrFinalText}
        pronunciationAnalysisEnabled={pronunciationAnalysisEnabled}
        onPronunciationAnalysisChange={onPronunciationAnalysisChange}
      />

      {/* 勾选框复用现有开关状态，仅改变入口展示位置 */}
      <Checkbox
        checked={pronunciationAnalysisEnabled}
        disabled={isPronunciationCheckboxDisabled}
        onChange={event => {
          // 正在采集音频时不切换配置；停录后允许改动，并在下一轮录音时生效。
          if (isPronunciationCheckboxDisabled) return
          onPronunciationAnalysisChange(Boolean(event.target.checked))
        }}
      >
        发音分析
      </Checkbox>
    </div>
  )

  return (
    <div className="chat-shell__composer-wrap shrink-0 px-3 pb-3 pt-2">
      {voiceControlsContainer && createPortal(voiceControls, voiceControlsContainer)}
      <AIChatInput
        // 以 languageLabel 作为 key：语言切换时强制重挂载组件
        // 原因：Semi AIChatInput 内部 Tiptap placeholder extension 仅在挂载时读取一次 placeholder
        // 不会响应 prop 变化，因此必须通过 key 触发重建才能让占位符随语言更新
        key={languageLabel}
        keepSkillAfterSend={false}
        placeholder={`用${languageLabel}开始对话...`}
        sendHotKey="enter"
        generating={generating}
        showUploadButton={false}
        renderActionArea={renderActionArea}
        renderConfigureArea={() => (
          <SceneSelector
            {...sceneSelection}
            sceneDropdownVisible={sceneDropdownVisible}
            setSceneDropdownVisible={setSceneDropdownVisible}
          />
        )}
        onMessageSend={handleMessageSend}
        onStopGenerate={stopGenerating}
      />
    </div>
  )
}

export default ChatInputArea
