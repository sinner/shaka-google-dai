import { splitProps, type JSX } from 'solid-js'
import { cn } from '@/lib/cn'

export type RadioProps = {
  label?: string
  hint?: string
  class?: string
  id?: string
  name?: string
  value?: string
  checked?: boolean
  disabled?: boolean
  onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>
}

export function Radio(props: RadioProps) {
  const [local, rest] = splitProps(props, ['label', 'hint', 'class', 'id'])

  const inputId = () => local.id ?? `${local.label?.toLowerCase().replace(/\s+/g, '-')}-${rest.value}`

  return (
    <div class={cn('flex flex-col gap-1', local.class)}>
      <label
        for={inputId()}
        class="group inline-flex cursor-pointer items-start gap-3 text-sm text-white"
      >
        <span class="relative mt-0.5 flex size-4 shrink-0 items-center justify-center">
          <input
            id={inputId()}
            type="radio"
            class={cn(
              'peer size-4 appearance-none rounded-full border border-border bg-surface',
              'transition-colors checked:border-primary-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            {...rest}
          />
          <span class="pointer-events-none absolute size-2 rounded-full bg-primary-400 opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
        {local.label && <span class="leading-5">{local.label}</span>}
      </label>
      {local.hint && <p class="pl-7 text-xs text-text-muted">{local.hint}</p>}
    </div>
  )
}
