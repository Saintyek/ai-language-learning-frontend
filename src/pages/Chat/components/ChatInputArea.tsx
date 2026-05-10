import React, { useCallback } from 'react'
import { AIChatInput } from '@douyinfe/semi-ui'
import type { Content } from '@douyinfe/semi-foundation/lib/es/aiChatInput/interface'
import { SceneSelector } from './SceneSelector'
import { VoiceRecorder } from '../../../components/VoiceRecorder'
import type { UseSceneSelectionReturn } from '../hooks/useSceneSelection'
import type { UseChatReturn } from '../hooks/useChat'
import type { UseVoiceChatReturn } from '@/hooks/useVoiceChat'

interface ChatInputAreaProps extends Pick<
  UseChatReturn,
  'generating' | 'stopGenerating' | 'extractPlainText' | 'languageLabel'
> {
  sceneSelection: UseSceneSelectionReturn
  sceneDropdownVisible: boolean
  setSceneDropdownVisible: (visible: boolean) => void
  onMessageSend: (text: string) => void
  voiceChat?: UseVoiceChatReturn
}

/**
 * 聊天输入区域组件
 */
export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  generating,
  stopGenerating,
  extractPlainText,
  languageLabel,
  sceneSelection,
  sceneDropdownVisible,
  setSceneDropdownVisible,
  onMessageSend,
  voiceChat,
}) => {
  const handleMessageSend = ({ inputContents }: { inputContents: Content[] }) => {
    const text = extractPlainText(inputContents)
    onMessageSend(text)
  }

  const renderActionArea = useCallback(
    ({ menuItem }: { menuItem: React.ReactNode[] }) => {
      const sendButton = menuItem.at(-1)

      return (
        <div>
          <VoiceRecorder
            disabled={generating}
            sendAudio={voiceChat?.sendAudio}
            isConnected={voiceChat?.isConnected}
            isConnecting={voiceChat?.isConnecting}
            onStartSession={voiceChat?.startVoiceSession}
            onStopRecording={voiceChat?.stopRecording}
            onEndSession={voiceChat?.endVoiceSession}
            onResetTranscript={voiceChat?.resetTranscript}
            asrInterimText={voiceChat?.asrInterimText}
            asrFinalText={voiceChat?.asrFinalText}
          />
          {sendButton}
        </div>
      )
    },
    [onMessageSend, generating, voiceChat]
  )

  return (
    <div className="chat-shell__composer-wrap shrink-0 px-3 pb-3 pt-2">
      <AIChatInput
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
