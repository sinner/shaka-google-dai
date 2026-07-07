import { createSignal, For } from 'solid-js'
import { Plus, Search } from 'lucide-solid'
import {
  Button,
  Checkbox,
  Input,
  Radio,
  TextArea,
  Title,
} from '@/components/ui'

const channelTypes = [
  { value: 'live', label: 'Live stream' },
  { value: 'vod', label: 'Video on demand' },
] as const

export default function ChannelsPage() {
  const [search, setSearch] = createSignal('')
  const [channelType, setChannelType] = createSignal('live')
  const [enableAds, setEnableAds] = createSignal(true)
  const [notes, setNotes] = createSignal('')

  return (
    <section class="space-y-6">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div class="space-y-2">
          <Title as="h1">Channels</Title>
          <p class="max-w-2xl text-sm text-text-muted">
            Browse and configure channels for dynamic ad insertion.
          </p>
        </div>
        <Button variant="secondary">
          <Plus size={16} />
          Add Channel
        </Button>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div class="space-y-4 rounded-xl border border-border bg-surface p-6">
          <Title as="h3">Filters</Title>
          <Input
            label="Search channels"
            placeholder="Search by name or ID"
            value={search()}
            onInput={(event) => setSearch(event.currentTarget.value)}
          />
          <Checkbox
            label="Show only ad-enabled channels"
            checked={enableAds()}
            onChange={(event) => setEnableAds(event.currentTarget.checked)}
          />
        </div>

        <div class="space-y-5 rounded-xl border border-border bg-surface p-6">
          <Title as="h3">Channel Settings</Title>

          <fieldset class="space-y-3">
            <legend class="mb-1 text-sm font-medium text-white">
              Channel type
            </legend>
            <For each={channelTypes}>
              {(option) => (
                <Radio
                  name="channel-type"
                  label={option.label}
                  value={option.value}
                  checked={channelType() === option.value}
                  onChange={() => setChannelType(option.value)}
                />
              )}
            </For>
          </fieldset>

          <TextArea
            label="Notes"
            placeholder="Optional configuration notes"
            hint="Internal notes for this channel setup."
            value={notes()}
            onInput={(event) => setNotes(event.currentTarget.value)}
          />

          <div class="flex flex-wrap gap-3">
            <Button>
              <Search size={16} />
              Apply
            </Button>
            <Button variant="ghost">Reset</Button>
          </div>
        </div>
      </div>
    </section>
  )
}
