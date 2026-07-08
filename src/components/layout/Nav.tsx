import { A } from '@solidjs/router'
import { KeyRound, Tv } from 'lucide-solid'
import { For } from 'solid-js'
import { cn } from '@/lib/cn'

const navItems = [
  { href: '/manual-asset-key', label: 'Manual Asset Key', icon: KeyRound },
  { href: '/channels', label: 'Channels', icon: Tv },
] as const

export function Nav() {
  return (
    <nav class="border-b border-border bg-black/20 backdrop-blur-sm">
      <div class="mx-auto flex w-full max-w-[96rem] items-center gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <span class="text-sm font-semibold tracking-wide text-white">
          Google DAI
        </span>
        <ul class="flex flex-wrap items-center gap-2">
          <For each={navItems}>
            {(item) => {
              const Icon = item.icon
              const linkClass =
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors'

              return (
                <li>
                  <A
                    href={item.href}
                    end
                    class={linkClass}
                    activeClass={cn(
                      linkClass,
                      'bg-primary-400/20 text-white ring-1 ring-primary-400/40',
                    )}
                    inactiveClass={cn(
                      linkClass,
                      'text-text-muted hover:bg-surface hover:text-white',
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
