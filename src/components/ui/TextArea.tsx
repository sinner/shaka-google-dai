import { splitProps, type JSX } from 'solid-js'
import { cn } from '@/lib/cn'

export type TextAreaProps = {
  label?: string
  hint?: string
  error?: string
  class?: string
  id?: string
  name?: string
  placeholder?: string
  value?: string
  rows?: number
  disabled?: boolean
  required?: boolean
  onInput?: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent>
  onChange?: JSX.EventHandlerUnion<HTMLTextAreaElement, Event>
}

export function TextArea(props: TextAreaProps) {
  const [local, rest] = splitProps(props, [
    'label',
    'hint',
    'error',
    'class',
    'id',
    'rows',
  ])

  const inputId = () => local.id ?? local.label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div class="flex flex-col gap-1.5">
      {local.label && (
        <label for={inputId()} class="text-sm font-medium text-white">
          {local.label}
        </label>
      )}
      <textarea
        id={inputId()}
        rows={local.rows ?? 4}
        class={cn(
          'w-full resize-y rounded-lg border bg-surface px-3 py-2 text-sm text-white placeholder:text-text-muted',
          'transition-colors focus:outline-none focus:ring-2',
          local.error
            ? 'border-red-400/70 focus:border-red-400 focus:ring-red-400/30'
            : 'border-border focus:border-border-focus focus:ring-primary-400/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          local.class,
        )}
        {...rest}
      />
      {local.error ? (
        <p class="text-xs text-red-300">{local.error}</p>
      ) : local.hint ? (
        <p class="text-xs text-text-muted">{local.hint}</p>
      ) : null}
    </div>
  )
}
