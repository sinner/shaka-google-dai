import { apiRequest } from './api'

export type Channel = {
  id: string
  name: string
  type: 'live' | 'vod'
  adEnabled: boolean
}

export type AssetKeyPayload = {
  assetKey: string
}

export const channelService = {
  list: () => apiRequest<Channel[]>('/api/channels'),
}

export const assetKeyService = {
  save: (payload: AssetKeyPayload) =>
    apiRequest<void>('/api/asset-keys', {
      method: 'POST',
      body: payload,
    }),
}
