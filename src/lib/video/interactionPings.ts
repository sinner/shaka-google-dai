import { logger } from '@/lib/logger'
import { daiEventsStore } from '@/stores/daiEventsStore'

function isDaiInteractionUrl(url: string): boolean {
  return (
    url.includes('pagead/live/interaction') ||
    (url.includes('dai.google.com') && url.includes('/interaction'))
  )
}

export function observeDaiInteractionPings(): () => void {
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
    daiEventsStore.logInteractionPing(url)
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
