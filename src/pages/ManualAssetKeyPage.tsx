import { createSignal } from 'solid-js'
import { Save } from 'lucide-solid'
import { Button, Input, Title } from '@/components/ui'

export default function ManualAssetKeyPage() {
  const [assetKey, setAssetKey] = createSignal('')

  return (
    <section class="space-y-6">
      <header class="space-y-2">
        <Title as="h1">Manual Asset Key</Title>
        <p class="max-w-2xl text-sm text-text-muted">
          Enter or manage asset keys for Google DAI integration.
        </p>
      </header>

      <div class="max-w-xl space-y-4 rounded-xl border border-border bg-surface p-6">
        <Input
          label="Asset Key"
          placeholder="Enter your asset key"
          hint="Paste the key provided by your ad operations team."
          value={assetKey()}
          onInput={(event) => setAssetKey(event.currentTarget.value)}
        />
        <div class="flex justify-end">
          <Button type="button">
            <Save size={16} />
            Save Key
          </Button>
        </div>
      </div>
    </section>
  )
}
