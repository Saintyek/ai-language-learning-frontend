import React, { useState, useEffect, useCallback } from 'react'
import { SideSheet, List, Typography, Empty, Spin, Toast, Tag } from '@douyinfe/semi-ui'
import { IconHistory, IconDelete } from '@douyinfe/semi-icons'
import { useNavigate } from 'react-router-dom'
import { getChatSessions, deleteChatSession, type ChatSession } from '@/api/chat'
import { languageOptions } from '@/consts/languages'
import { sceneOptions } from '@/consts/scenes'

interface ChatHistorySideSheetProps {
  visible: boolean
  onClose: () => void
}

const ChatHistorySideSheet: React.FC<ChatHistorySideSheetProps> = ({ visible, onClose }) => {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20

  const fetchSessions = useCallback(async () => {
    if (!visible) return
    setLoading(true)
    try {
      const response = await getChatSessions(page, limit)
      setSessions(response.data)
      setTotal(response.meta.total)
    } catch (error) {
      Toast.error('获取聊天记录失败')
      console.error('Failed to fetch chat sessions:', error)
    } finally {
      setLoading(false)
    }
  }, [visible, page])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleDelete = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await deleteChatSession(sessionId)
      Toast.success('删除成功')
      fetchSessions()
    } catch (error) {
      Toast.error('删除失败')
      console.error('Failed to delete session:', error)
    }
  }

  const handleSessionClick = (session: ChatSession) => {
    // 根据会话的语言跳转到对应的聊天页面，并传递 sessionId
    const langCode = session.language || 'us'
    navigate(`/${langCode}/chat?sessionId=${session.id}`)
    onClose()
  }

  const getLanguageLabel = (langCode: string | null) => {
    if (!langCode) return '未知语言'
    const lang = languageOptions.find(l => l.code === langCode)
    return lang?.label || langCode
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * 格式化场景标签显示
   * scenario 格式: "一级场景value/二级场景value"
   * 返回二级场景的 label 用于显示
   */
  const getSceneTag = (scenario: string | null) => {
    if (!scenario) return null

    const parts = scenario.split('/')
    if (parts.length !== 2) return null

    const [firstLevelValue, secondLevelValue] = parts

    // 查找一级场景
    const firstLevelOption = sceneOptions.find(opt => opt.value === firstLevelValue)
    if (!firstLevelOption?.children) return null

    // 查找二级场景
    const secondLevelOption = firstLevelOption.children.find(
      child => child.value === secondLevelValue
    )

    return secondLevelOption ? secondLevelOption.label : null
  }

  return (
    <SideSheet
      title={
        <div className="flex items-center gap-2">
          <IconHistory size="large" />
          <Typography.Title heading={5} style={{ margin: 0 }}>
            聊天记录
          </Typography.Title>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={400}
      closeOnEsc
    >
      <Spin spinning={loading}>
        {sessions.length > 0 ? (
          <List
            dataSource={sessions}
            renderItem={(item: ChatSession) => (
              <List.Item
                className="hover:bg-gray-50 cursor-pointer transition-colors rounded-lg px-2 -mx-2"
                onClick={() => handleSessionClick(item)}
                main={
                  <div className="flex flex-col gap-1">
                    <Typography.Text strong className="truncate w-40">
                      {item.title}
                    </Typography.Text>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Typography.Text type="tertiary" size="small">
                        {getLanguageLabel(item.language)}
                      </Typography.Text>
                      {getSceneTag(item.scenario) && (
                        <Tag size="small" color="blue" shape="circle" type="light">
                          {getSceneTag(item.scenario)}
                        </Tag>
                      )}
                    </div>
                  </div>
                }
                extra={
                  <div className="flex items-center gap-2">
                    <Typography.Text type="tertiary" size="small">
                      {formatDate(item.updatedAt)}
                    </Typography.Text>
                    <button
                      className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                      onClick={e => handleDelete(item.id, e)}
                      title="删除"
                    >
                      <IconDelete size="small" style={{ color: '#999' }} />
                    </button>
                  </div>
                }
              />
            )}
          />
        ) : (
          <Empty description="暂无聊天记录" />
        )}
        {total > limit && (
          <div className="text-center mt-4 text-gray-500 text-sm">共 {total} 条记录</div>
        )}
      </Spin>
    </SideSheet>
  )
}

export default ChatHistorySideSheet
