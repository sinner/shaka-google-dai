import { splitProps, type JSX } from 'solid-js'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  class?: string
  children: JSX.Element
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-400 text-white hover:bg-primary-300 focus-visible:ring-primary-400/60 shadow-lg shadow-primary-400/20',
  secondary:
    'border border-border bg-surface text-white hover:bg-surface-hover focus-visible:ring-white/30',
  ghost: 'text-white hover:bg-surface focus-visible:ring-white/20',
  danger:
    'bg-red-600/90 text-white hover:bg-red-500 focus-visible:ring-red-400/60',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    'variant',
    'size',
    'class',
    'children',
    'type',
  ])

  return (
    <button
      type={local.type ?? 'button'}
      class={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[local.variant ?? 'primary'],
        sizeStyles[local.size ?? 'md'],
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </button>
  )
}
