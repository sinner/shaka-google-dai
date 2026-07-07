import shaka from 'shaka-player'
import { logger } from '@/lib/logger'
import { observeDaiInteractionPings } from '@/lib/video/interactionPings'
import { TRACKED_AD_EVENTS } from '@/lib/video/adEvents'
import { daiEventsStore } from '@/stores/daiEventsStore'

type AdManager = shaka.extern.IAdManager
type RegisterAdEventListenersOptions = {
  onAdBreakChange?: (active: boolean) => void
}
type ShakaAdEvent = Event & {
  originalEvent?: { type?: string; getAdId?: () => string }
  sdkAdObject?: { getDuration?: () => number; getAdId?: () => string }
  imaStreamManager?: google.ima.dai.api.StreamManager
}

export function registerAdEventListeners(
  adManager: AdManager,
  options: RegisterAdEventListenersOptions = {},
): () => void {
  const stopInteractionObserver = observeDaiInteractionPings()

  const listeners = TRACKED_AD_EVENTS.map((eventType) => {
    const handler = (event: Event) => {
      const detail = formatAdEventDetail(event as ShakaAdEvent, eventType)
      logger.event('Shaka ad event', { type: eventType, detail })
      daiEventsStore.logAdEvent(eventType, detail)
    }

    adManager.addEventListener(eventType, handler)
    return { eventType, handler }
  })

  const onAdBreakStarted = () => {
    logger.info('Ad break started')
    options.onAdBreakChange?.(true)
  }

  const onAdBreakEnded = () => {
    logger.info('Ad break ended')
    options.onAdBreakChange?.(false)
  }

  adManager.addEventListener(shaka.ads.Utils.AD_BREAK_STARTED, onAdBreakStarted)
  adManager.addEventListener(shaka.ads.Utils.AD_BREAK_ENDED, onAdBreakEnded)

  logger.info('Shaka ad event listeners registered', {
    count: listeners.length,
  })

  return () => {
    stopInteractionObserver()
    for (const { eventType, handler } of listeners) {
      adManager.removeEventListener(eventType, handler)
    }
    adManager.removeEventListener(shaka.ads.Utils.AD_BREAK_STARTED, onAdBreakStarted)
    adManager.removeEventListener(shaka.ads.Utils.AD_BREAK_ENDED, onAdBreakEnded)
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

export function watchImaStreamManager(
  adManager: AdManager,
  onManager: (manager: google.ima.dai.api.StreamManager) => void,
): () => void {
  const handler = (event: Event) => {
    const streamManager =
      (event as ShakaAdEvent).imaStreamManager ??
      readEventField<google.ima.dai.api.StreamManager>(event, 'imaStreamManager')

    if (streamManager) {
      logger.debug('IMA stream manager loaded')
      onManager(streamManager)
    }
  }

  adManager.addEventListener(shaka.ads.Utils.IMA_STREAM_MANAGER_LOADED, handler)

  return () => {
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
