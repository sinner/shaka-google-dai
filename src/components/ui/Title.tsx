import { splitProps, type JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { cn } from '@/lib/cn'

type TitleLevel = 'h1' | 'h2' | 'h3' | 'h4'

export type TitleProps = {
  as?: TitleLevel
  class?: string
  children: JSX.Element
}

const levelStyles: Record<TitleLevel, string> = {
  h1: 'text-3xl font-bold tracking-tight sm:text-4xl',
  h2: 'text-2xl font-semibold tracking-tight sm:text-3xl',
  h3: 'text-xl font-semibold sm:text-2xl',
  h4: 'text-lg font-medium sm:text-xl',
}

export function Title(props: TitleProps) {
  const [local, rest] = splitProps(props, ['as', 'class', 'children'])
  const level = () => local.as ?? 'h1'

  return (
    <Dynamic
      component={level()}
      class={cn('text-white', levelStyles[level()], local.class)}
      {...rest}
    >
      {local.children}
    </Dynamic>
  )
}
