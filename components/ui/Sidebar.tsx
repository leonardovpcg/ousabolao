'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Target, Trophy, Scale, User, ShieldCheck } from 'lucide-react'
import { useNavigation } from './NavigationProgress'

const NAV_ITEMS = [
  { href: '/inicio',    label: 'Início',    icon: Home   },
  { href: '/palpite',   label: 'Palpite',   icon: Target },
  { href: '/ranking',   label: 'Ranking',   icon: Trophy },
  { href: '/desempate', label: 'Desempate', icon: Scale  },
  { href: '/perfil',    label: 'Perfil',    icon: User   },
] as const

type Props = { isAdmin?: boolean }

export function Sidebar({ isAdmin = false }: Props) {
  const pathname = usePathname()
  const { startNavigation } = useNavigation()
  const [pressedHref, setPressedHref] = useState<string | null>(null)

  // Clear optimistic state once pathname actually changes
  useEffect(() => {
    setPressedHref(null)
  }, [pathname])

  const adminActive = pathname.startsWith('/admin')

  function handleNav(href: string, isCurrent: boolean) {
    if (!isCurrent) {
      setPressedHref(href)
      startNavigation()
    }
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 hidden lg:flex w-60 flex-col border-r border-hairline bg-card z-40">
      {/* Brand */}
      <div className="px-6 pt-8 pb-6 border-b border-hairline">
        <Link href="/inicio" onClick={() => handleNav('/inicio', pathname === '/inicio')}>
          <p className="font-display text-xl font-semibold text-ink tracking-tight leading-none">
            Ousa<span className="text-brand">Bolão</span>
          </p>
          <p className="text-ink-faint text-xs mt-1 font-sans">Copa do Mundo 2026</p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Navegação principal">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isCurrent = pathname === href || pathname.startsWith(href + '/')
          const active    = isCurrent || pressedHref === href

          return (
            <Link
              key={href}
              href={href}
              onClick={() => handleNav(href, isCurrent)}
              className={[
                'group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm',
                'transition-all duration-150',
                active
                  ? 'bg-brand/8 text-ink font-medium'
                  : 'text-ink-soft hover:bg-hairline/60 hover:text-ink',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full transition-opacity',
                  active ? 'opacity-100 bg-brand' : 'opacity-0',
                ].join(' ')}
              />
              <Icon
                size={18}
                strokeWidth={1.5}
                className={active ? 'text-brand' : 'text-ink-faint group-hover:text-ink-soft'}
                aria-hidden="true"
              />
              <span>{label}</span>
            </Link>
          )
        })}

        {/* Admin */}
        {isAdmin && (
          <>
            <div className="pt-2 pb-1">
              <div className="h-px bg-hairline" />
            </div>
            <Link
              href="/admin/jogos"
              onClick={() => handleNav('/admin/jogos', adminActive)}
              className={[
                'group relative flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm',
                'transition-all duration-150',
                adminActive
                  ? 'bg-brand text-card font-semibold shadow-[0_2px_8px_rgba(200,136,30,0.30)]'
                  : 'bg-brand/10 text-brand-deep font-medium hover:bg-brand/18 hover:text-brand-deep',
              ].join(' ')}
            >
              <ShieldCheck
                size={15}
                strokeWidth={adminActive ? 2 : 1.75}
                className={adminActive ? 'text-card' : 'text-brand'}
                aria-hidden="true"
              />
              <span>Painel Admin</span>
            </Link>
          </>
        )}
      </nav>

      <div className="pb-5" />
    </aside>
  )
}
