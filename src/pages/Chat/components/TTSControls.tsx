import React from 'react'
import { Button, Tooltip } from '@douyinfe/semi-ui'
import { IconPlay, IconPause, IconStop } from '@douyinfe/semi-icons'

interface TTSControlsProps {
  status: 'idle' | 'playing' | 'paused' | 'stopped'
  onPlay: () => void
  onPause: () => void
  onStop: () => void
}

const TTSControls: React.FC<TTSControlsProps> = ({ status, onPlay, onPause, onStop }) => {
  if (status === 'idle') {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-t border-slate-100">
      <span className="text-xs text-slate-500 mr-2">语音控制</span>

      {status === 'playing' ? (
        <Tooltip content="暂停播放">
          <Button size="small" icon={<IconPause />} onClick={onPause} theme="light" />
        </Tooltip>
      ) : (
        <Tooltip content={status === 'paused' ? '继续播放' : '播放'}>
          <Button size="small" icon={<IconPlay />} onClick={onPlay} theme="light" />
        </Tooltip>
      )}

      <Tooltip content="停止播放">
        <Button size="small" icon={<IconStop />} onClick={onStop} theme="light" />
      </Tooltip>

      <span className="text-xs text-slate-400 ml-2">
        {status === 'playing' ? '播放中' : status === 'paused' ? '已暂停' : '已停止'}
      </span>
    </div>
  )
}

export default TTSControls
