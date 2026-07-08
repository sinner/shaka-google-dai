import { logger } from '@/lib/logger'

/**
 * Matches GAM / DAI interaction beacons for every livestream variant, e.g.
 * - pubads.../pagead/live/interaction/...  (Google samples)
 * - pubads.../pagead/interaction/...       (FAST channels)
 * - dai.google.com/.../interaction/...
 *
 * A single `pagead/interaction` check does NOT match `/pagead/live/interaction/`
 * because of the extra `/live/` path segment.
 */
function isDaiInteractionUrl(url: string): boolean {
  return /\/interaction(\/|\?|$)/i.test(url)
}

export function observeDaiInteractionPings(
  onPing?: (url: string) => void,
): () => void {
  if (typeof PerformanceObserver === 'undefined') {
    logger.warn('PerformanceObserver unavailable; interaction pings will not be tracked')
    return () => {}
  }

  const seen = new Set<string>()

  const recordInteraction = (url: string) => {
    if (!isDaiInteractionUrl(url) || seen.has(url)) {
      return
    }

    seen.add(url)
    logger.event('DAI interaction ping', { url })
    onPing?.(url)
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      recordInteraction(entry.name)
    }
  })

  observer.observe({ type: 'resource', buffered: true })

  for (const entry of performance.getEntriesByType('resource')) {
    recordInteraction(entry.name)
  }

  logger.debug('Interaction ping observer started')

  return () => observer.disconnect()
}
