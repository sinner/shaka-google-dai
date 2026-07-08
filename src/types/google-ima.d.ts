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

  class StreamEvent {
    static Type: {
      AD_BREAK_STARTED: string
      AD_BREAK_ENDED: string
    }

    getAd(): StreamAd | null
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
