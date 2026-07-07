import { A, useLocation } from '@solidjs/router'
import { KeyRound, Tv } from 'lucide-solid'
import { For } from 'solid-js'
import { cn } from '@/lib/cn'

const navItems = [
  { href: '/manual-asset-key', label: 'Manual Asset Key', icon: KeyRound },
  { href: '/channels', label: 'Channels', icon: Tv },
] as const

export function Nav() {
  const location = useLocation()

  return (
    <nav class="border-b border-border bg-black/20 backdrop-blur-sm">
      <div class="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-6">
        <span class="text-sm font-semibold tracking-wide text-white">
          Google DAI
        </span>
        <ul class="flex flex-wrap items-center gap-2">
          <For each={navItems}>
            {(item) => {
              const isActive = () => location.pathname === item.href
              const Icon = item.icon

              return (
                <li>
                  <A
                    href={item.href}
                    class={cn(
                      'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive()
                        ? 'bg-primary-400/20 text-white ring-1 ring-primary-400/40'
                        : 'text-text-muted hover:bg-surface hover:text-white',
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </A>
                </li>
              )
            }}
          </For>
        </ul>
      </div>
    </nav>
  )
}
