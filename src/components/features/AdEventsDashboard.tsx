import { createEffect, createMemo, For, onCleanup, Show } from 'solid-js'
import { Trash2 } from 'lucide-solid'
import { Button, Title } from '@/components/ui'
import { cn } from '@/lib/cn'
import { daiEventsStore } from '@/stores/daiEventsStore'
import type { DashboardEvent, DashboardEventCategory } from '@/types/dai'

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

export function AdEventsDashboard() {
  let scrollContainerRef: HTMLDivElement | undefined
  const events = createMemo(() => daiEventsStore.events())
  const eventCount = createMemo(() => events().length)
  const interactionCount = createMemo(
    () => events().filter((entry) => entry.category === 'network').length,
  )

  createEffect(() => {
    events()
    scrollContainerRef?.scrollTo({ top: 0, behavior: 'smooth' })
  })

  onCleanup(() => {
    scrollContainerRef = undefined
  })

  return (
    <section class="space-y-4 rounded-xl border border-border bg-surface p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-1">
          <Title as="h3">Events Dashboard</Title>
          <p class="text-xs text-text-muted">
            Live feed from Shaka ad handlers · {eventCount()} events ·{' '}
            {interactionCount()} interaction pings
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => daiEventsStore.clearEvents()}>
          <Trash2 size={14} />
          Clear events
        </Button>
      </div>

      <div class="overflow-hidden rounded-lg border border-border bg-black/20">
        <div class="max-h-96 overflow-auto" ref={(element) => (scrollContainerRef = element)}>
          <table class="w-full min-w-[40rem] border-collapse text-left text-xs">
            <thead class="sticky top-0 z-10 bg-neutral-variant-800/95 backdrop-blur-sm">
              <tr class="border-b border-border text-text-muted">
                <th class="px-3 py-2.5 font-medium">Time</th>
                <th class="px-3 py-2.5 font-medium">Category</th>
                <th class="px-3 py-2.5 font-medium">Event</th>
                <th class="px-3 py-2.5 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              <Show
                when={eventCount() > 0}
                fallback={
                  <tr>
                    <td class="px-3 py-8 text-center text-text-muted" colspan={4}>
                      No events yet. Load a live DAI stream to see ad events in
                      real time.
                    </td>
                  </tr>
                }
              >
                <For each={events()}>
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
  return (
    <tr class="border-b border-border/50 transition-colors hover:bg-surface/80">
      <td class="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-text-muted">
        {formatTime(props.entry.timestamp)}
      </td>
      <td class="px-3 py-2">
        <span
          class={cn(
            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            categoryStyles[props.entry.category],
          )}
        >
          {categoryLabels[props.entry.category]}
        </span>
      </td>
      <td class="px-3 py-2 font-medium text-white">
        {formatEventName(props.entry.event)}
      </td>
      <td class="max-w-md break-all px-3 py-2 text-text-muted">
        {props.entry.detail ?? '—'}
      </td>
    </tr>
  )
}
