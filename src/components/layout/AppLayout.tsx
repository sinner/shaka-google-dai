import type { JSX } from 'solid-js'
import { Nav } from './Nav'

type AppLayoutProps = {
  children?: JSX.Element
}

export function AppLayout(props: AppLayoutProps) {
  return (
    <div class="flex min-h-dvh flex-col">
      <Nav />
      <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {props.children}
      </main>
    </div>
  )
}
