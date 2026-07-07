import { createSignal } from 'solid-js'
import { logger } from '@/lib/logger'
import type { DashboardEvent, DashboardEventCategory } from '@/types/dai'

const MAX_EVENTS = 200

const [events, setEvents] = createSignal<DashboardEvent[]>([])

function createId(): string {
  return crypto.randomUUID()
}

function addEvent(
  category: DashboardEventCategory,
  event: string,
  detail?: string,
) {
  const entry: DashboardEvent = {
    id: createId(),
    timestamp: Date.now(),
    category,
    event,
    detail,
  }

  setEvents((current) => [entry, ...current].slice(0, MAX_EVENTS))
}

export const daiEventsStore = {
  events,
  logAdEvent: (type: string, detail?: string) => addEvent('ad', type, detail),
  logAssetKeyChange: (assetKey: string, label?: string) =>
    addEvent(
      'asset-key',
      'asset-key-changed',
      label ? `${label} · ${assetKey}` : assetKey,
    ),
  logInteractionPing: (url: string) =>
    addEvent('network', 'dai-interaction-ping', url),
  clearEvents: () => {
    logger.info('Dashboard events cleared')
    setEvents([])
  },
}
