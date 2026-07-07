import { createSignal, onCleanup } from 'solid-js'
import shaka from 'shaka-player'
import {
  registerAdEventListeners,
  resetDaiStream,
  watchImaStreamManager,
} from '@/hooks/useAdEventHandlers'
import { logger } from '@/lib/logger'
import { createLiveStreamRequest, isImaDaiSdkAvailable } from '@/lib/video/daiStream'
import { applyDrmConfig, initShakaPlayer } from '@/lib/video/shakaPlayer'
import { daiEventsStore } from '@/stores/daiEventsStore'
import type { StreamLoadConfig } from '@/types/dai'

type PlayerElements = {
  video: HTMLVideoElement
  adContainer: HTMLDivElement
  clientSideAdContainer: HTMLDivElement
}

export function useShakaDaiPlayer() {
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
  let onVideoPause: (() => void) | null = null
  let loadToken = 0

  const bindElements = (
    video: HTMLVideoElement,
    adContainer: HTMLDivElement,
    clientSideAdContainer: HTMLDivElement,
  ) => {
    elements = { video, adContainer, clientSideAdContainer }
    elements.video.muted = muted()
    attachAdBreakPauseGuard(elements.video)
    logger.debug('Video elements bound')
    initPlayer()
  }

  const attachAdBreakPauseGuard = (video: HTMLVideoElement) => {
    onVideoPause?.()
    onVideoPause = () => video.removeEventListener('pause', handleVideoPause)
    video.addEventListener('pause', handleVideoPause)
  }

  const handleVideoPause = () => {
    if (!isAdBreakActive() || !elements?.video) {
      return
    }

    logger.debug('Resume playback during ad break after accidental pause')
    void elements.video.play().catch((playError) => {
      logger.warn('Failed to resume ad playback', { playError })
    })
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

  const initPlayer = () => {
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

    adManager.setContainers(
      elements.clientSideAdContainer,
      elements.adContainer,
    )
    unregisterAdEvents = registerAdEventListeners(adManager, {
      onAdBreakChange: (active) => {
        setIsAdBreakActive(active)
        if (active && elements?.video.paused) {
          void elements.video.play().catch(() => {})
        }
      },
    })
    unregisterStreamManagerWatch = watchImaStreamManager(adManager, (manager) => {
      streamManager = manager
    })
    logger.info('Shaka player initialized')
  }

  const resetPlayer = async () => {
    loadToken += 1
    setLoading(false)
    setError(null)
    setActiveAssetKey(null)
    setIsAdBreakActive(false)
    logger.info('Player reset requested')

    if (!player || !adManager) {
      elements?.video.pause()
      elements?.video.removeAttribute('src')
      elements?.video.load()
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

    initPlayer()

    if (!player || !adManager) {
      const message = 'Shaka player failed to initialize.'
      logger.error(message)
      setError(message)
      return
    }

    const token = ++loadToken
    setLoading(true)
    setError(null)
    logger.info('Loading DAI stream', { assetKey, label })

    try {
      await player.unload()
      resetDaiStream(adManager, streamManager)

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
        setLoading(false)
      }
    }
  }

  onCleanup(() => {
    loadToken += 1
    unregisterAdEvents?.()
    unregisterAdEvents = null
    unregisterStreamManagerWatch?.()
    unregisterStreamManagerWatch = null
    onVideoPause?.()
    onVideoPause = null
    resetDaiStream(adManager, streamManager)
    streamManager = null
    adManager = null

    if (player) {
      void player.destroy()
      player = null
    }

    elements = null
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
