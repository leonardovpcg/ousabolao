'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Target, Trophy, Scale, User, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import logo from '@/app/logo.png'
import { useNavigation } from './NavigationProgress'

const NAV_ITEMS = [
  { href: '/inicio',    label: 'Início',    icon: Home   },
  { href: '/palpite',   label: 'Palpite',   icon: Target },
  { href: '/ranking',   label: 'Ranking',   icon: Trophy },
  { href: '/desempate', label: 'Desempate', icon: Scale  },
  { href: '/perfil',    label: 'Perfil',    icon: User   },
] as const

type Props = {
  isAdmin?: boolean
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isAdmin = false, collapsed, onToggle }: Props) {
  const pathname = usePathname()
  const { startNavigation } = useNavigation()
  const [pressedHref, setPressedHref] = useState<string | null>(null)

  useEffect(() => { setPressedHref(null) }, [pathname])

  const adminActive = pathname.startsWith('/admin')

  function handleNav(href: string, isCurrent: boolean) {
    if (!isCurrent) {
      setPressedHref(href)
      startNavigation()
    }
  }

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 hidden lg:flex flex-col z-40 overflow-hidden border-r"
      style={{
        width: collapsed ? '64px' : '240px',
        transition: 'width 300ms ease-in-out',
        background: 'var(--color-card)',
        borderColor: 'var(--color-hairline)',
      }}
    >
      {/* ── Brand ────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-[15px] pt-5 pb-4 flex-shrink-0 border-b"
        style={{
          borderColor: 'rgba(200,136,30,.18)',
          background: 'linear-gradient(180deg, rgba(200,136,30,.04) 0%, transparent 100%)',
        }}
      >
        <Link
          href="/inicio"
          onClick={() => handleNav('/inicio', pathname === '/inicio')}
          className="flex-shrink-0"
          aria-label="Início"
        >
          <Image
            src={logo}
            alt="OusaBolão"
            width={34}
            height={34}
            priority
            className="rounded-[10px] block"
            style={{ boxShadow: '0 0 0 1.5px rgba(200,136,30,.5), 0 2px 8px rgba(200,136,30,.15)' }}
          />
        </Link>

        <div className="overflow-hidden min-w-0">
          <p className="font-display text-[1rem] font-bold text-ink tracking-tight leading-none whitespace-nowrap">
            Ousa<span className="text-brand">Bolão</span>
          </p>
          <p className="text-[10px] text-ink-faint mt-[3px] whitespace-nowrap">
            Copa do Mundo 2026
          </p>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5"
        aria-label="Navegação principal"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isCurrent = pathname === href || pathname.startsWith(href + '/')
          const active    = isCurrent || pressedHref === href

          return (
            <Link
              key={href}
              href={href}
              onClick={() => handleNav(href, isCurrent)}
              title={collapsed ? label : undefined}
              className={[
                'group relative flex items-center gap-3 rounded-[10px] py-2.5 text-sm',
                'transition-all duration-150 whitespace-nowrap',
                collapsed ? 'justify-center px-0' : 'px-3',
                active
                  ? 'bg-brand/8 text-ink font-medium'
                  : 'text-ink-soft hover:bg-hairline/60 hover:text-ink',
              ].join(' ')}
            >
              {!collapsed && (
                <span
                  className={[
                    'absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full transition-opacity',
                    active ? 'opacity-100 bg-brand' : 'opacity-0',
                  ].join(' ')}
                />
              )}
              <Icon
                size={18}
                strokeWidth={1.5}
                className={[
                  'flex-shrink-0',
                  active ? 'text-brand' : 'text-ink-faint group-hover:text-ink-soft',
                ].join(' ')}
                aria-hidden
              />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* ── Toggle + Admin footer ────────────────────────────── */}
      <div className="flex-shrink-0 border-t px-2 pt-2 pb-3 space-y-0.5" style={{ borderColor: 'var(--color-hairline)' }}>
        {/* Toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={[
            'flex items-center rounded-[10px] py-2 text-ink-faint',
            'hover:text-brand hover:bg-brand/6 transition-colors w-full whitespace-nowrap',
            collapsed ? 'justify-center px-0 gap-0' : 'px-3 gap-2',
          ].join(' ')}
        >
          {collapsed
            ? <ChevronRight size={15} strokeWidth={1.75} />
            : (
              <>
                <ChevronLeft size={15} strokeWidth={1.75} />
                <span className="text-xs">Recolher</span>
              </>
            )
          }
        </button>

        {/* Admin shortcut */}
        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => handleNav('/admin', adminActive)}
            title={collapsed ? 'Painel Admin' : undefined}
            className={[
              'flex items-center rounded-[10px] py-2.5 text-sm w-full whitespace-nowrap',
              'transition-all duration-150',
              collapsed ? 'justify-center px-0 gap-0' : 'px-3 gap-2.5',
              adminActive
                ? 'bg-brand text-card font-semibold shadow-[0_2px_8px_rgba(200,136,30,0.30)]'
                : 'bg-brand/10 text-brand-deep font-medium hover:bg-brand/18',
            ].join(' ')}
          >
            <ShieldCheck
              size={15}
              strokeWidth={adminActive ? 2 : 1.75}
              className={['flex-shrink-0', adminActive ? 'text-card' : 'text-brand'].join(' ')}
              aria-hidden
            />
            {!collapsed && <span>Painel Admin</span>}
          </Link>
        )}
      </div>
    </aside>
  )
}
