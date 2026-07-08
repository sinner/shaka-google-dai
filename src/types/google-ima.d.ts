declare namespace google.ima.dai.api {
  class LiveStreamRequest {
    assetKey: string
    apiKey?: string
    adTagParameters?: Record<string, string>
  }

  interface StreamAd {
    getAdId?: () => string
    getDuration?: () => number
  }

  interface AdProgressData {
    adBreakDuration: number
    adPeriodDuration: number
    adPosition: number
    currentTime: number
    duration: number
    totalAds: number
  }

  interface StreamData {
    adProgressData?: AdProgressData | null
  }

  class StreamEvent {
    static Type: {
      AD_BREAK_STARTED: string
      AD_BREAK_ENDED: string
      AD_PROGRESS: string
    }

    getAd(): StreamAd | null
    getStreamData(): StreamData
  }

  class StreamManager {
    reset(): void
    requestStream(streamRequest: LiveStreamRequest): void
    addEventListener(type: string, handler: (event: StreamEvent) => void): void
    removeEventListener(type: string, handler: (event: StreamEvent) => void): void
  }
}

declare namespace google.ima {
  const dai: {
    api: typeof google.ima.dai.api
  }
}

declare const google: {
  ima: typeof google.ima
}
