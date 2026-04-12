import { useState, useEffect } from 'react'
import { getDigitalHumanStatus, type DigitalHumanInfo } from '@/api/digitalHuman'

export interface UseDigitalHumanReturn {
  digitalHuman: DigitalHumanInfo
}

/**
 * 数字人状态 Hook
 */
export default function useDigitalHuman(): UseDigitalHumanReturn {
  const [digitalHuman, setDigitalHuman] = useState<DigitalHumanInfo>({ status: 'not_created' })

  useEffect(() => {
    let isMounted = true

    getDigitalHumanStatus()
      .then(data => {
        if (isMounted) {
          setDigitalHuman(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          setDigitalHuman({ status: 'failed' })
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return { digitalHuman }
}
