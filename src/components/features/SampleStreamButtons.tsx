import { For } from 'solid-js'
import { Button } from '@/components/ui'
import type { LiveDaiSample } from '@/types/dai'

type SampleStreamButtonsProps = {
  samples: LiveDaiSample[]
  onSelect: (sample: LiveDaiSample) => void
}

export function SampleStreamButtons(props: SampleStreamButtonsProps) {
  return (
    <div class="flex flex-wrap gap-2">
      <For each={props.samples}>
        {(sample) => (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => props.onSelect(sample)}
          >
            {sample.label}
          </Button>
        )}
      </For>
    </div>
  )
}
