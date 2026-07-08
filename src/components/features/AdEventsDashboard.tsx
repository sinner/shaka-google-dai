import { createEffect, createMemo, createSignal, For, onCleanup, Show, type Accessor } from 'solid-js'
import { Trash2 } from 'lucide-solid'
import { Button, Checkbox, Title } from '@/components/ui'
import { cn } from '@/lib/cn'
import { daiEventsStore } from '@/stores/daiEventsStore'
import type { DashboardEvent, DashboardEventCategory } from '@/types/dai'

const DETAIL_MAX_CHARS = 48

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const time = date.toLocaleTimeString(undefined, {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${time}.${ms}`
}

function formatEventName(event: string): string {
  return event.replaceAll('-', ' ').toUpperCase()
}

function truncateDetail(detail: string, maxChars = DETAIL_MAX_CHARS): string {
  if (detail.length <= maxChars) {
    return detail
  }

  return `${detail.slice(0, maxChars - 1)}…`
}

const categoryStyles: Record<DashboardEventCategory, string> = {
  ad: 'bg-primary-400/20 text-primary-300',
  'asset-key': 'bg-amber-500/20 text-amber-200',
  network: 'bg-emerald-500/20 text-emerald-200',
}

const categoryLabels: Record<DashboardEventCategory, string> = {
  ad: 'Ad',
  'asset-key': 'Asset Key',
  network: 'Network',
}

function isInteractionPing(entry: DashboardEvent): boolean {
  return entry.category === 'network' && entry.event === 'dai-interaction-ping'
}

const eventNameStyles: Record<string, string> = {
  'ad-break-started': 'text-amber-300',
  'ad-break-ended': 'text-cyan-300',
}

export function AdEventsDashboard(props: {
  class?: string
  liveStreamName?: Accessor<string | null | undefined>
}) {
  let scrollContainerRef: HTMLDivElement | undefined
  const [hideInteractionPings, setHideInteractionPings] = createSignal(false)
  const events = createMemo(() => daiEventsStore.events())
  const visibleEvents = createMemo(() => {
    if (!hideInteractionPings()) {
      return events()
    }

    return events().filter((entry) => !isInteractionPing(entry))
  })
  const eventCount = createMemo(() => visibleEvents().length)
  const interactionCount = createMemo(
    () => events().filter((entry) => isInteractionPing(entry)).length,
  )

  createEffect(() => {
    visibleEvents()
    scrollContainerRef?.scrollTo({ top: 0, behavior: 'smooth' })
  })

  onCleanup(() => {
    scrollContainerRef = undefined
  })

  return (
    <section
      class={cn(
        'flex h-full min-h-0 flex-col space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6',
        props.class,
      )}
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <Title as="h3">{props.liveStreamName?.()?.trim?.() || 'No stream loaded'}</Title>
          <p class="text-sm text-text-muted">Events Dashboard</p>
          <p class="text-xs text-text-muted">
            Live feed · {eventCount()} events · {interactionCount()} interaction
            pings
          </p>
        </div>
        <div class="flex shrink-0 flex-col items-end gap-3 sm:flex-row sm:items-center">
          <Checkbox
            label="Hide Interaction Ping"
            checked={hideInteractionPings()}
            onChange={(event) =>
              setHideInteractionPings(event.currentTarget.checked)
            }
          />
          <Button variant="ghost" size="sm" onClick={() => daiEventsStore.clearEvents()}>
            <Trash2 size={14} />
            Clear events
          </Button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-black/20">
        <div
          class="h-full max-h-[min(32rem,calc(100dvh-12rem))] overflow-auto xl:max-h-none"
          ref={(element) => (scrollContainerRef = element)}
        >
          <table class="w-full border-collapse text-left text-xs">
            <thead class="sticky top-0 z-10 bg-neutral-variant-800/95 backdrop-blur-sm">
              <tr class="border-b border-border text-text-muted">
                <th class="px-3 py-2.5 font-medium">Time</th>
                <th class="px-3 py-2.5 font-medium">Category</th>
                <th class="px-3 py-2.5 font-medium">Event</th>
                <th class="hidden px-3 py-2.5 font-medium lg:table-cell">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              <Show
                when={eventCount() > 0}
                fallback={
                  <tr>
                    <td
                      class="px-3 py-8 text-center text-text-muted lg:hidden"
                      colspan={3}
                    >
                      No events yet. Load a live DAI stream to see ad events in
                      real time.
                    </td>
                    <td
                      class="hidden px-3 py-8 text-center text-text-muted lg:table-cell"
                      colspan={4}
                    >
                      No events yet. Load a live DAI stream to see ad events in
                      real time.
                    </td>
                  </tr>
                }
              >
                <For each={visibleEvents()}>
                  {(entry) => <EventRow entry={entry} />}
                </For>
              </Show>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function EventRow(props: { entry: DashboardEvent }) {
  const detail = () => props.entry.detail?.trim() || ''
  const truncated = () => {
    const value = detail()
    return value ? truncateDetail(value) : '—'
  }
  const title = () => {
    const value = detail()
    return value.length > DETAIL_MAX_CHARS ? value : undefined
  }

  return (
    <tr class="border-b border-border/50 transition-colors hover:bg-surface/80">
      <td class="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-text-muted">
        {formatTime(props.entry.timestamp)}
      </td>
      <td class="whitespace-nowrap px-3 py-2">
        <span
          class={cn(
            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            categoryStyles[props.entry.category],
          )}
        >
          {categoryLabels[props.entry.category]}
        </span>
      </td>
      <td
        class={cn(
          'whitespace-nowrap px-3 py-2 font-medium',
          eventNameStyles[props.entry.event] ?? 'text-white',
        )}
      >
        {formatEventName(props.entry.event)}
      </td>
      <td
        class="hidden max-w-xs truncate whitespace-nowrap px-3 py-2 text-text-muted lg:table-cell"
        title={title()}
      >
        {truncated()}
      </td>
    </tr>
  )
}
