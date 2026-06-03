'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, Trophy, Scale, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/inicio', label: 'Início', icon: Home },
  { href: '/palpite', label: 'Palpite', icon: Target },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/desempate', label: 'Desempate', icon: Scale },
  { href: '/perfil', label: 'Perfil', icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-hairline bg-card lg:hidden"
      style={{ boxShadow: '0 -1px 0 0 #E4E2DA' }}
    >
      <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex flex-1 flex-col items-center justify-center pt-2 pb-2.5 min-h-[56px]',
                  'transition-colors duration-150',
                  active ? 'text-ink' : 'text-ink-faint',
                ].join(' ')}
              >
                {/* Top brand indicator */}
                <span
                  className={[
                    'h-0.5 w-5 rounded-full mb-1.5 transition-all duration-200',
                    active ? 'bg-brand opacity-100' : 'bg-transparent opacity-0',
                  ].join(' ')}
                />
                <Icon
                  size={20}
                  strokeWidth={active ? 2 : 1.5}
                  aria-hidden="true"
                />
                <span
                  className={[
                    'mt-1 text-[10px] tracking-wide',
                    active ? 'font-semibold text-ink' : 'font-medium text-ink-faint',
                  ].join(' ')}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
