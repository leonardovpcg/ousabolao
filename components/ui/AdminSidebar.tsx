'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Swords, Trophy, Calendar, Users, Scale, CreditCard,
  LayoutGrid, BookOpen, ChevronLeft, ChevronRight, LayoutDashboard,
} from 'lucide-react'
import logo from '@/app/logo.png'

// ── Navigation ────────────────────────────────────────────────

const ADMIN_NAV = [
  { href: '/admin/visao-geral',   label: 'Visão Geral',     icon: LayoutDashboard },
  { href: '/admin/jogos',         label: 'Jogos',           icon: Swords          },
  { href: '/admin/resultados',    label: 'Resultados',      icon: Trophy          },
  { href: '/admin/fases',         label: 'Fases',           icon: Calendar        },
  { href: '/admin/participantes', label: 'Participantes',   icon: Users           },
  { href: '/admin/desempate',     label: 'Desempate',       icon: Scale           },
  { href: '/admin/pagamento',     label: 'Pagamento',       icon: CreditCard      },
  { href: '/admin/palpites',      label: 'Relatórios',      icon: LayoutGrid      },
  { href: '/admin/regras',        label: 'Regras',          icon: BookOpen        },
] as const

const PHASE_LABELS: Record<string, string> = {
  group_stage:    'Fase de Grupos',
  round_of_32:    'Rodada de 32',
  round_of_16:    'Oitavas de Final',
  quarter_finals: 'Quartas de Final',
  semi_finals:    'Semifinais',
  third_place:    '3º Lugar',
  final:          'Final',
}

type Props = {
  currentPhase: string | null
  collapsed: boolean
  onToggle: () => void
}

// ── NavItem ───────────────────────────────────────────────────

function NavItem({
  href, label, Icon, active, collapsed,
}: {
  href: string
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: React.ComponentType<any>
  active: boolean
  collapsed: boolean
}) {
  return (
    <Link
      href={href}
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
        <span className={[
          'absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full transition-opacity',
          active ? 'opacity-100 bg-brand' : 'opacity-0',
        ].join(' ')} />
      )}
      <Icon
        size={16}
        strokeWidth={1.5}
        className={[
          'flex-shrink-0',
          active ? 'text-brand' : 'text-ink-faint group-hover:text-ink-soft',
        ].join(' ')}
        aria-hidden="true"
      />
      {!collapsed && label}
    </Link>
  )
}

// ── Component ─────────────────────────────────────────────────

export function AdminSidebar({ currentPhase, collapsed, onToggle }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 hidden lg:flex flex-col z-40 overflow-hidden border-r"
      style={{
        width: collapsed ? '64px' : '256px',
        transition: 'width 300ms ease-in-out',
        background: 'var(--color-card)',
        borderColor: 'var(--color-hairline)',
      }}
    >
      {/* ── Brand ──────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-[15px] pt-5 pb-4 flex-shrink-0 border-b"
        style={{
          borderColor: 'rgba(200,136,30,.18)',
          background: 'linear-gradient(180deg, rgba(200,136,30,.04) 0%, transparent 100%)',
        }}
      >
        <Link href="/admin/visao-geral" className="flex-shrink-0" aria-label="Visão Geral">
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
          <p className="text-[10px] text-ink-faint mt-[3px] font-sans uppercase tracking-wide whitespace-nowrap">
            Admin
          </p>
          {currentPhase && (
            <p className="text-[10px] text-ink-soft mt-0.5 whitespace-nowrap">
              {PHASE_LABELS[currentPhase] ?? currentPhase}
            </p>
          )}
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5"
        aria-label="Seções do painel"
      >
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={pathname === href || pathname.startsWith(href + '/')}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* ── Toggle (único no rodapé) ─────────────────────────── */}
      <div
        className="flex-shrink-0 border-t px-2 pt-2 pb-4"
        style={{ borderColor: 'rgba(200,136,30,.18)' }}
      >
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
      </div>
    </aside>
  )
}
