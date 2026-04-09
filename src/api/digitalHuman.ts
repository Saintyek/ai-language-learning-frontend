import { get, post } from '../utils/request'

export type DigitalHumanStatus = 'not_created' | 'training' | 'ready' | 'failed'

export interface DigitalHumanInfo {
  status: DigitalHumanStatus
  frontendPicUrl?: string
  resourceId?: string
}

interface ApiResponse<T> {
  message: string
  data: T
}

interface TrainDigitalHumanParams {
  vid: string
  alphaVid?: string
  interactionOptimise?: boolean
}

export const getDigitalHumanStatus = async (): Promise<DigitalHumanInfo> => {
  const response = await get<ApiResponse<DigitalHumanInfo>>('/api/digital-human/status')

  return response.data
}

export const createDigitalHumanTask = async (
  params: TrainDigitalHumanParams,
): Promise<DigitalHumanInfo> => {
  const response = await post<ApiResponse<DigitalHumanInfo>>('/api/digital-human/train', params)
  return response.data
}
