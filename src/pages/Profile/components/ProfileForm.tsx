import React, { useState, useEffect } from 'react'
import { Button, Toast } from '@douyinfe/semi-ui'
import LevelSelector from './LevelSelector'
import TagSelector from './TagSelector'
import {
  getProfile,
  upsertProfile,
  type LanguageLevel,
  type Motivation,
  type Goal,
  type DailyTime,
  type LanguageProfile,
} from '@/api/profile'

interface ProfileFormProps {
  language: string
  languageLabel: string
  onSuccess: () => void
}

const ProfileForm: React.FC<ProfileFormProps> = ({ language, languageLabel, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [level, setLevel] = useState<LanguageLevel>('beginner')
  const [motivations, setMotivations] = useState<Motivation[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [dailyTime, setDailyTime] = useState<DailyTime[]>(['30min'])

  // Load existing profile if available
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        const response = await getProfile(language)
        if (response.data) {
          const profile: LanguageProfile = response.data
          setLevel(profile.level)
          setMotivations(profile.motivations)
          setGoals(profile.goals)
          setDailyTime([profile.dailyTime])
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [language])

  const handleSubmit = async () => {
    // Validation
    if (motivations.length === 0) {
      Toast.error('请选择至少一个学习动机')
      return
    }
    if (goals.length === 0) {
      Toast.error('请选择至少一个学习目标')
      return
    }
    if (dailyTime.length === 0) {
      Toast.error('请选择每日学习时间')
      return
    }

    setSaving(true)
    try {
      await upsertProfile(language, {
        level,
        motivations,
        goals,
        dailyTime: dailyTime[0] as DailyTime,
      })
      Toast.success('保存成功')
      onSuccess()
    } catch (error) {
      Toast.error(error instanceof Error ? error.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Language Level */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">你的{languageLabel}水平</h3>
        <LevelSelector value={level} onChange={setLevel} />
      </div>

      {/* Learning Motivation */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          学习动机 <span className="text-red-500">*</span>
        </h3>
        <TagSelector
          type="motivation"
          value={motivations}
          onChange={value => setMotivations(value as Motivation[])}
        />
      </div>

      {/* Learning Goals */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          学习目标 <span className="text-red-500">*</span>
        </h3>
        <TagSelector type="goal" value={goals} onChange={value => setGoals(value as Goal[])} />
      </div>

      {/* Daily Study Time */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          每日学习时间 <span className="text-red-500">*</span>
        </h3>
        <TagSelector
          type="dailyTime"
          value={dailyTime}
          onChange={value => setDailyTime(value as DailyTime[])}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="primary"
          theme="solid"
          size="large"
          block
          loading={saving}
          onClick={handleSubmit}
          style={{ height: '48px', fontSize: '16px' }}
        >
          保存并开始学习
        </Button>
      </div>
    </div>
  )
}

export default ProfileForm
