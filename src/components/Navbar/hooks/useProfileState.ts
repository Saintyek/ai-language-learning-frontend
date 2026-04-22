import { useState, useEffect } from 'react'
import { getProfile } from '@/api/profile'
import type { LanguageOption } from '../types'

export interface ProfileState {
  hasProfile: boolean | null
  checkProfile: (langCode: string) => Promise<boolean>
}

/**
 * 档案状态管理 hook
 * 调用者: index.tsx
 * 用途: 管理用户档案状态
 */
export function useProfileState(
  isProfilePage: boolean,
  currentLanguage: LanguageOption | undefined
): ProfileState {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  useEffect(() => {
    if (isProfilePage && currentLanguage) {
      const checkProfile = async () => {
        try {
          const response = await getProfile(currentLanguage.code)
          setHasProfile(response.data !== null)
        } catch {
          setHasProfile(false)
        }
      }
      checkProfile()
    } else {
      setHasProfile(null)
    }
  }, [isProfilePage, currentLanguage])

  const checkProfile = async (langCode: string): Promise<boolean> => {
    try {
      const response = await getProfile(langCode)
      return response.data !== null
    } catch {
      return false
    }
  }

  return { hasProfile, checkProfile }
}
