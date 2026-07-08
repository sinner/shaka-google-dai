import shaka from 'shaka-player'
import { logger } from '@/lib/logger'
import { observeDaiInteractionPings } from '@/lib/video/interactionPings'
import { TRACKED_AD_EVENTS } from '@/lib/video/adEvents'
import { daiEventsStore } from '@/stores/daiEventsStore'

type AdManager = shaka.extern.IAdManager
type WatchImaStreamManagerOptions = {
  onManager: (manager: google.ima.dai.api.StreamManager) => void
  onAdBreakChange?: (active: boolean) => void
}
type ShakaAdEvent = Event & {
  originalEvent?: { type?: string; getAdId?: () => string }
  sdkAdObject?: { getDuration?: () => number; getAdId?: () => string }
  imaStreamManager?: google.ima.dai.api.StreamManager
}

export function registerAdEventListeners(adManager: AdManager): () => void {
  const stopInteractionObserver = observeDaiInteractionPings((url) => {
    daiEventsStore.logInteractionPing(url)
  })

  const listeners = TRACKED_AD_EVENTS.map((eventType) => {
    const handler = (event: Event) => {
      const detail = formatAdEventDetail(event as ShakaAdEvent, eventType)
      logger.event('Shaka ad event', { type: eventType, detail })
      daiEventsStore.logAdEvent(eventType, detail)
    }

    adManager.addEventListener(eventType, handler)
    return { eventType, handler }
  })

  logger.info('Shaka ad event listeners registered', {
    count: listeners.length,
  })

  return () => {
    stopInteractionObserver()
    for (const { eventType, handler } of listeners) {
      adManager.removeEventListener(eventType, handler)
    }
    logger.debug('Shaka ad event listeners removed')
  }
}

function readEventField<T>(event: Event, key: string): T | undefined {
  return (event as unknown as Record<string, unknown>)[key] as T | undefined
}

function formatAdEventDetail(
  event: ShakaAdEvent,
  eventType: string,
): string | undefined {
  const originalEvent =
    event.originalEvent ?? readEventField<ShakaAdEvent['originalEvent']>(event, 'originalEvent')

  const sdkAdObject =
    event.sdkAdObject ?? readEventField<ShakaAdEvent['sdkAdObject']>(event, 'sdkAdObject')

  const parts: string[] = []

  if (originalEvent?.type) {
    parts.push(`sdk=${originalEvent.type}`)
  }

  if (typeof originalEvent?.getAdId === 'function') {
    parts.push(`adId=${originalEvent.getAdId()}`)
  } else if (typeof sdkAdObject?.getAdId === 'function') {
    parts.push(`adId=${sdkAdObject.getAdId()}`)
  }

  if (typeof sdkAdObject?.getDuration === 'function') {
    parts.push(`duration=${sdkAdObject.getDuration()}s`)
  }

  if (eventType === shaka.ads.Utils.AD_INTERACTION) {
    parts.push('interaction fired')
  }

  return parts.length ? parts.join(' · ') : undefined
}

function registerImaAdBreakListeners(
  streamManager: google.ima.dai.api.StreamManager,
  onAdBreakChange?: (active: boolean) => void,
): () => void {
  const { Type } = google.ima.dai.api.StreamEvent

  const onStarted = (event: google.ima.dai.api.StreamEvent) => {
    const detail = formatImaStreamEventDetail(event)
    logger.event('IMA ad break started', { detail })
    daiEventsStore.logAdEvent(shaka.ads.Utils.AD_BREAK_STARTED, detail)
    onAdBreakChange?.(true)
  }

  const onEnded = (event: google.ima.dai.api.StreamEvent) => {
    const detail = formatImaStreamEventDetail(event)
    logger.event('IMA ad break ended', { detail })
    daiEventsStore.logAdEvent(shaka.ads.Utils.AD_BREAK_ENDED, detail)
    onAdBreakChange?.(false)
  }

  streamManager.addEventListener(Type.AD_BREAK_STARTED, onStarted)
  streamManager.addEventListener(Type.AD_BREAK_ENDED, onEnded)

  return () => {
    streamManager.removeEventListener(Type.AD_BREAK_STARTED, onStarted)
    streamManager.removeEventListener(Type.AD_BREAK_ENDED, onEnded)
  }
}

function formatImaStreamEventDetail(
  event: google.ima.dai.api.StreamEvent,
): string | undefined {
  const parts: string[] = []
  const ad = event.getAd()

  if (ad?.getAdId) {
    parts.push(`adId=${ad.getAdId()}`)
  }

  if (typeof ad?.getDuration === 'function') {
    parts.push(`duration=${ad.getDuration()}s`)
  }

  return parts.length ? parts.join(' · ') : undefined
}

export function watchImaStreamManager(
  adManager: AdManager,
  options: WatchImaStreamManagerOptions,
): () => void {
  let removeImaAdBreakListeners: (() => void) | null = null

  const handler = (event: Event) => {
    const streamManager =
      (event as ShakaAdEvent).imaStreamManager ??
      readEventField<google.ima.dai.api.StreamManager>(event, 'imaStreamManager')

    if (!streamManager) {
      return
    }

    logger.debug('IMA stream manager loaded')
    removeImaAdBreakListeners?.()
    removeImaAdBreakListeners = registerImaAdBreakListeners(
      streamManager,
      options.onAdBreakChange,
    )
    options.onManager(streamManager)
  }

  adManager.addEventListener(shaka.ads.Utils.IMA_STREAM_MANAGER_LOADED, handler)

  return () => {
    removeImaAdBreakListeners?.()
    removeImaAdBreakListeners = null
    adManager.removeEventListener(
      shaka.ads.Utils.IMA_STREAM_MANAGER_LOADED,
      handler,
    )
  }
}

export function resetDaiStream(
  adManager: AdManager | null,
  streamManager: google.ima.dai.api.StreamManager | null,
): void {
  logger.info('Resetting DAI stream')
  streamManager?.reset()
  adManager?.onAssetUnload()
}
