import type { StreamLoadConfig } from '@/types/dai'

export function createLiveStreamRequest(
  config: Pick<StreamLoadConfig, 'assetKey' | 'imaApiKey'>,
): google.ima.dai.api.LiveStreamRequest {
  const request = new google.ima.dai.api.LiveStreamRequest()
  request.assetKey = config.assetKey

  if (config.imaApiKey) {
    request.apiKey = config.imaApiKey
  }

  return request
}

export function isImaDaiSdkAvailable(): boolean {
  return Boolean(globalThis.google?.ima?.dai?.api?.LiveStreamRequest)
}
