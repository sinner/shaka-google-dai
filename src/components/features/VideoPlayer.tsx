import { createEffect, mergeProps, Show, splitProps, type Accessor } from 'solid-js'
import { Volume2, VolumeX } from 'lucide-solid'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatAdBreakCountdown } from '@/lib/video/adBreakCountdown'

export type VideoPlayerProps = {
  class?: string
  loading?: boolean
  muted?: boolean
  isAdBreakActive?: Accessor<boolean>
  adBreakRemainingSeconds?: Accessor<number | null>
  onToggleMute?: () => void
  onReady?: (elements: {
    video: HTMLVideoElement
    adContainer: HTMLDivElement
    clientSideAdContainer: HTMLDivElement
  }) => void
}

export function VideoPlayer(rawProps: VideoPlayerProps) {
  const props = mergeProps(
    { loading: false, muted: true, isAdBreakActive: () => false, adBreakRemainingSeconds: () => null },
    rawProps,
  )
  const [local] = splitProps(props, [
    'class',
    'loading',
    'muted',
    'isAdBreakActive',
    'adBreakRemainingSeconds',
    'onToggleMute',
    'onReady',
  ])

  let videoElement: HTMLVideoElement | undefined
  let adContainerElement: HTMLDivElement | undefined
  let clientSideAdContainerElement: HTMLDivElement | undefined
  let hasNotifiedReady = false

  const notifyReady = () => {
    if (
      hasNotifiedReady ||
      !videoElement ||
      !adContainerElement ||
      !clientSideAdContainerElement ||
      !local.onReady
    ) {
      return
    }

    hasNotifiedReady = true
    local.onReady({
      video: videoElement,
      adContainer: adContainerElement,
      clientSideAdContainer: clientSideAdContainerElement,
    })
  }

  const setVideoRef = (element: HTMLVideoElement | undefined) => {
    videoElement = element
    if (videoElement) {
      videoElement.muted = local.muted ?? true
    }
    notifyReady()
  }

  const setAdContainerRef = (element: HTMLDivElement | undefined) => {
    adContainerElement = element
    notifyReady()
  }

  const setClientSideAdContainerRef = (element: HTMLDivElement | undefined) => {
    clientSideAdContainerElement = element
    notifyReady()
  }

  createEffect(() => {
    if (videoElement) {
      videoElement.muted = local.muted ?? true
    }
  })

  createEffect(() => {
    if (!videoElement) {
      return
    }

    if (local.isAdBreakActive()) {
      videoElement.style.pointerEvents = 'none'
      return
    }

    videoElement.style.pointerEvents = 'auto'
  })

  const handleToggleMute = (event: MouseEvent) => {
    event.stopPropagation()
    local.onToggleMute?.()
  }

  return (
    <div
      class={cn(
        'w-full overflow-hidden rounded-2xl border border-border',
        'bg-black shadow-2xl shadow-primary-400/10',
        local.class,
      )}
    >
      <div class="relative aspect-video w-full bg-black">
        <video
          ref={setVideoRef}
          class="absolute inset-0 z-0 size-full object-contain"
          controls={!local.isAdBreakActive()}
          playsinline
          autoplay
          muted
        />
        <div
          ref={setAdContainerRef}
          class={cn(
            'dai-ad-container absolute inset-0 z-10',
            local.isAdBreakActive()
              ? 'pointer-events-auto'
              : 'pointer-events-none',
          )}
        />
        <div ref={setClientSideAdContainerRef} class="hidden" aria-hidden="true" />

        <div class="pointer-events-none absolute inset-0 z-40">
          <div class="pointer-events-auto absolute top-3 right-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label={local.muted ? 'Unmute player' : 'Mute player'}
              onClick={handleToggleMute}
            >
              {local.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {local.muted ? 'Unmute' : 'Mute'}
            </Button>
          </div>

          <Show when={local.isAdBreakActive()}>
            <div class="absolute top-3 left-3 space-y-1">
              <div class="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-100 ring-1 ring-amber-400/40">
                Ad break — playback cannot be paused
              </div>
              <Show
                when={local.adBreakRemainingSeconds?.()}
                keyed
              >
                {(remaining) => (
                  <div class="rounded-lg bg-black/70 px-3 py-1.5 font-mono text-sm font-semibold text-white ring-1 ring-white/20">
                    Break ends in {formatAdBreakCountdown(remaining)}
                  </div>
                )}
              </Show>
            </div>
          </Show>
        </div>

        {local.loading && (
          <div class="absolute inset-0 z-20 flex items-center justify-center bg-black/50 text-sm text-white">
            Loading stream…
          </div>
        )}
      </div>
    </div>
  )
}
