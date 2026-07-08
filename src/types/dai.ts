export type StreamFormat = 'HLS' | 'DASH'

export type LiveDaiSample = {
  id: string
  label: string
  assetKey: string
  streamFormat: StreamFormat
  requiresApiKey: boolean
  drmLicenseUrl?: string
  cookieResolverUrl?: string
}

export type LiveDaiSamplesFile = {
  networkCode: string
  defaultImaApiKey: string
  defaultSampleId?: string
  samples: LiveDaiSample[]
}

export type DashboardEventCategory = 'ad' | 'asset-key' | 'network'

export type DashboardEvent = {
  id: string
  timestamp: number
  category: DashboardEventCategory
  event: string
  detail?: string
}

export type StreamLoadConfig = {
  assetKey: string
  drmLicenseUrl?: string
  cookieResolverUrl?: string
  imaApiKey?: string
}
