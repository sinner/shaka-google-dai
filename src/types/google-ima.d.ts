declare namespace google.ima.dai.api {
  class LiveStreamRequest {
    assetKey: string
    apiKey?: string
    adTagParameters?: Record<string, string>
  }

  class StreamManager {
    reset(): void
    requestStream(streamRequest: LiveStreamRequest): void
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
