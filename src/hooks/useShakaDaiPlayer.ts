import { createSignal, onCleanup } from 'solid-js'
import shaka from 'shaka-player'
import {
  registerAdEventListeners,
  resetDaiStream,
  watchImaStreamManager,
} from '@/hooks/useAdEventHandlers'
import { logger } from '@/lib/logger'
import { createLiveStreamRequest, isImaDaiSdkAvailable } from '@/lib/video/daiStream'
import {
  applyDrmConfig,
  configureDaiAdContainers,
  initShakaPlayer,
  primeDrmCookies,
} from '@/lib/video/shakaPlayer'
import { daiEventsStore } from '@/stores/daiEventsStore'
import type { StreamLoadConfig } from '@/types/dai'

type PlayerElements = {
  video: HTMLVideoElement
  adContainer: HTMLDivElement
  clientSideAdContainer: HTMLDivElement
}

type DefaultStreamLoad = {
  config: StreamLoadConfig
  label?: string
}

type UseShakaDaiPlayerOptions = {
  defaultLoad?: DefaultStreamLoad
}

export function useShakaDaiPlayer(options: UseShakaDaiPlayerOptions = {}) {
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [activeAssetKey, setActiveAssetKey] = createSignal<string | null>(null)
  const [muted, setMuted] = createSignal(true)
  const [isAdBreakActive, setIsAdBreakActive] = createSignal(false)

  let elements: PlayerElements | null = null
  let player: shaka.Player | null = null
  let adManager: shaka.extern.IAdManager | null = null
  let streamManager: google.ima.dai.api.StreamManager | null = null
  let unregisterAdEvents: (() => void) | null = null
  let unregisterStreamManagerWatch: (() => void) | null = null
  let detachPlaybackGuards: (() => void) | null = null
  let allowPause = false
  let isVideoVisible = true
  let loadToken = 0
  let hasAutoLoadedDefault = false
  let boundVideo: HTMLVideoElement | null = null
  let initPlayerPromise: Promise<void> | null = null

  const bindElements = (
    video: HTMLVideoElement,
    adContainer: HTMLDivElement,
    clientSideAdContainer: HTMLDivElement,
  ) => {
    if (boundVideo === video && player) {
      return
    }

    boundVideo = video
    elements = { video, adContainer, clientSideAdContainer }
    elements.video.muted = muted()
    attachPlaybackGuards(elements.video)
    logger.debug('Video elements bound')
    void ensurePlayerReady().then(() => loadDefaultStreamIfNeeded())
  }

  const ensurePlayerReady = async () => {
    if (player) {
      return
    }

    if (initPlayerPromise) {
      await initPlayerPromise
      return
    }

    initPlayerPromise = initPlayer()
    await initPlayerPromise
  }

  const resumePlayback = (reason: string) => {
    if (!elements?.video || allowPause) {
      return
    }

    logger.debug('Resume playback', { reason })
    void elements.video.play().catch((playError) => {
      logger.warn('Failed to resume playback', { reason, playError })
    })
  }

  const shouldForcePlayback = () =>
    Boolean(activeAssetKey()) && (isAdBreakActive() || !isVideoVisible)

  const attachPlaybackGuards = (video: HTMLVideoElement) => {
    detachPlaybackGuards?.()

    const handleVideoPause = () => {
      if (!shouldForcePlayback()) {
        return
      }

      resumePlayback(
        isAdBreakActive()
          ? 'ad-break-pause'
          : 'offscreen-pause',
      )
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldForcePlayback()) {
        if (elements?.video.paused) {
          resumePlayback('document-visible')
        }
      }
    }

    video.addEventListener('pause', handleVideoPause)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    let intersectionObserver: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (!entry) {
            return
          }

          isVideoVisible = entry.isIntersecting && entry.intersectionRatio > 0

          if (!isVideoVisible && shouldForcePlayback() && video.paused) {
            resumePlayback('scrolled-out-of-view')
          }
        },
        { threshold: [0, 0.01] },
      )
      intersectionObserver.observe(video)
    }

    detachPlaybackGuards = () => {
      video.removeEventListener('pause', handleVideoPause)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      intersectionObserver?.disconnect()
      intersectionObserver = null
    }
  }

  const toggleMute = () => {
    if (!elements?.video) {
      return
    }

    const nextMuted = !elements.video.muted
    elements.video.muted = nextMuted
    setMuted(nextMuted)
    logger.debug('Player mute toggled', { muted: nextMuted })
  }

  const initPlayer = async () => {
    if (!elements || player) {
      return
    }

    if (!isImaDaiSdkAvailable()) {
      const message = 'Google IMA DAI SDK is not loaded.'
      logger.error(message)
      setError(message)
      return
    }

    player = initShakaPlayer(elements.video)
    adManager = player.getAdManager()

    if (!adManager) {
      const message = 'Shaka AdManager is unavailable.'
      logger.error(message)
      setError(message)
      return
    }

    configureDaiAdContainers(adManager, elements)
    unregisterAdEvents = registerAdEventListeners(adManager)
    unregisterStreamManagerWatch = watchImaStreamManager(adManager, {
      onManager: (manager) => {
        streamManager = manager
      },
      onAdBreakChange: (active) => {
        setIsAdBreakActive(active)
        if (active && elements?.video.paused) {
          void elements.video.play().catch(() => {})
        }
      },
    })
    logger.info('Shaka player initialized')
  }

  const resetPlayer = async () => {
    loadToken += 1
    allowPause = true
    setLoading(false)
    setError(null)
    setActiveAssetKey(null)
    setIsAdBreakActive(false)
    logger.info('Player reset requested')

    if (!player || !adManager) {
      elements?.video.pause()
      elements?.video.removeAttribute('src')
      elements?.video.load()
      allowPause = false
      return
    }

    try {
      await player.unload()
      resetDaiStream(adManager, streamManager)
    } catch (resetError) {
      logger.warn('Player unload failed during reset', { resetError })
      resetDaiStream(adManager, streamManager)
    }

    elements?.video.pause()
    allowPause = false
    logger.info('Player reset complete')
  }

  const loadStream = async (config: StreamLoadConfig, label?: string) => {
    const assetKey = config.assetKey.trim()

    if (!assetKey) {
      const message = 'Asset key is required.'
      logger.warn(message)
      setError(message)
      return
    }

    if (!elements) {
      const message = 'Video player is not ready.'
      logger.warn(message)
      setError(message)
      return
    }

    await ensurePlayerReady()

    if (!player || !adManager) {
      const message = 'Shaka player failed to initialize.'
      logger.error(message)
      setError(message)
      return
    }

    const token = ++loadToken
    allowPause = true
    setLoading(true)
    setError(null)
    logger.info('Loading DAI stream', { assetKey, label })

    try {
      if (activeAssetKey()) {
        await player.unload()
        resetDaiStream(adManager, streamManager)
      }

      configureDaiAdContainers(adManager, elements)

      // Samsung/Hisense flow: VIDEOURL sets playback_token cookies that LICENSE needs.
      await primeDrmCookies(config.cookieResolverUrl)
      applyDrmConfig(player, config.drmLicenseUrl)
      daiEventsStore.logAssetKeyChange(assetKey, label)

      const streamRequest = createLiveStreamRequest({
        assetKey,
        imaApiKey: config.imaApiKey?.trim() || undefined,
      })

      const uri = await adManager.requestServerSideStream(streamRequest)

      if (token !== loadToken) {
        return
      }

      await player.load(uri)
      setActiveAssetKey(assetKey)
      logger.info('DAI stream loaded', { assetKey, uri })
    } catch (loadError) {
      if (token !== loadToken) {
        return
      }

      const message = formatLoadError(loadError)
      logger.error('Failed to load DAI stream', { assetKey, loadError, message })
      setError(message)
      daiEventsStore.logAdEvent(shaka.ads.Utils.AD_ERROR, message)
    } finally {
      if (token === loadToken) {
        allowPause = false
        setLoading(false)
      }
    }
  }

  const loadDefaultStreamIfNeeded = () => {
    const defaultLoad = options.defaultLoad
    if (!defaultLoad || hasAutoLoadedDefault || !player || !adManager) {
      return
    }

    hasAutoLoadedDefault = true
    logger.info('Auto-loading default stream', { label: defaultLoad.label })
    void loadStream(defaultLoad.config, defaultLoad.label)
  }

  onCleanup(() => {
    loadToken += 1
    allowPause = true
    unregisterAdEvents?.()
    unregisterAdEvents = null
    unregisterStreamManagerWatch?.()
    unregisterStreamManagerWatch = null
    detachPlaybackGuards?.()
    detachPlaybackGuards = null
    resetDaiStream(adManager, streamManager)
    streamManager = null
    adManager = null

    if (player) {
      void player.destroy()
      player = null
    }

    elements = null
    initPlayerPromise = null
    boundVideo = null
    logger.debug('Shaka player hook cleaned up')
  })

  return {
    bindElements,
    loadStream,
    resetPlayer,
    toggleMute,
    loading,
    error,
    activeAssetKey,
    muted,
    isAdBreakActive,
  }
}

function formatLoadError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }

  return 'Failed to load the DAI stream.'
}
