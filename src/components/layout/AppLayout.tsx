import type { JSX } from 'solid-js'
import { Nav } from './Nav'
import { PathNormalizer } from './PathNormalizer'

type AppLayoutProps = {
  children?: JSX.Element
}

export function AppLayout(props: AppLayoutProps) {
  return (
    <div class="flex min-h-dvh flex-col">
      <PathNormalizer />
      <Nav />
      <main class="mx-auto w-full max-w-[96rem] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {props.children}
      </main>
    </div>
  )
}
