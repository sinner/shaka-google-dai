import { logger } from '@/lib/logger'
import type { StreamLoadConfig } from '@/types/dai'

export function createLiveStreamRequest(
  config: Pick<StreamLoadConfig, 'assetKey' | 'imaApiKey' | 'adTagParameters'>,
): google.ima.dai.api.LiveStreamRequest {
  const request = new google.ima.dai.api.LiveStreamRequest()
  request.assetKey = config.assetKey

  if (config.imaApiKey) {
    request.apiKey = config.imaApiKey
  }

  if (config.adTagParameters) {
    request.adTagParameters = { ...config.adTagParameters }
    logger.info('DAI ad tag parameters set', {
      adTagParameters: request.adTagParameters,
    })
  }

  return request
}

export function isImaDaiSdkAvailable(): boolean {
  return Boolean(globalThis.google?.ima?.dai?.api?.LiveStreamRequest)
}

export function resolveAdTagParameters(
  sample: {
    useSamsungTvAdTagParameters?: boolean
    adTagParameters?: Record<string, string>
  },
  defaults?: Record<string, string>,
): Record<string, string> | undefined {
  const base = sample.useSamsungTvAdTagParameters ? defaults : undefined
  const override = sample.adTagParameters

  if (!base && !override) {
    return undefined
  }

  return { ...base, ...override }
}
