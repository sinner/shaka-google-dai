import { splitProps, type JSX } from 'solid-js'
import { cn } from '@/lib/cn'

export type CheckboxProps = {
  label?: string
  hint?: string
  class?: string
  id?: string
  name?: string
  checked?: boolean
  disabled?: boolean
  value?: string
  onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>
}

export function Checkbox(props: CheckboxProps) {
  const [local, rest] = splitProps(props, ['label', 'hint', 'class', 'id'])

  const inputId = () => local.id ?? local.label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div class={cn('flex flex-col gap-1', local.class)}>
      <label
        for={inputId()}
        class="group inline-flex cursor-pointer items-start gap-3 text-sm text-white"
      >
        <span class="relative mt-0.5 flex size-4 shrink-0 items-center justify-center">
          <input
            id={inputId()}
            type="checkbox"
            class={cn(
              'peer size-4 appearance-none rounded border border-border bg-surface',
              'transition-colors checked:border-primary-400 checked:bg-primary-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            {...rest}
          />
          <svg
            class="pointer-events-none absolute size-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        {local.label && <span class="leading-5">{local.label}</span>}
      </label>
      {local.hint && <p class="pl-7 text-xs text-text-muted">{local.hint}</p>}
    </div>
  )
}
