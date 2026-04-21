import React, { useCallback } from 'react'
import { IconMicrophoneStroked } from '@douyinfe/semi-icons'
import { AIChatInput, Toast, Button } from '@douyinfe/semi-ui'
import type { Content } from '@douyinfe/semi-foundation/lib/es/aiChatInput/interface'
import { SceneSelector } from './SceneSelector'
import type { UseSceneSelectionReturn } from '../hooks/useSceneSelection'
import type { UseChatReturn } from '../hooks/useChat'

interface ChatInputAreaProps extends Pick<
  UseChatReturn,
  'generating' | 'stopGenerating' | 'extractPlainText' | 'languageLabel'
> {
  sceneSelection: UseSceneSelectionReturn
  sceneDropdownVisible: boolean
  setSceneDropdownVisible: (visible: boolean) => void
  onMessageSend: (text: string) => void
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
}) => {
  const handleMessageSend = ({ inputContents }: { inputContents: Content[] }) => {
    const text = extractPlainText(inputContents)
    onMessageSend(text)
  }

  const handleVoiceButtonClick = useCallback(() => {
    Toast.info({
      content: '语音功能开发中',
      duration: 2,
    })
  }, [])

  const renderActionArea = useCallback(
    ({ menuItem }: { menuItem: React.ReactNode[] }) => {
      const sendButton = menuItem.at(-1)

      return (
        <div>
          <Button
            type="tertiary"
            theme="borderless"
            onClick={handleVoiceButtonClick}
            icon={<IconMicrophoneStroked />}
            style={{
              borderRadius: '50%',
              marginRight: 4,
            }}
          />

          {sendButton}
        </div>
      )
    },
    [handleVoiceButtonClick]
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
