'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Swords, Trophy, Calendar, Users, Scale, CreditCard,
  LayoutGrid, BookOpen, ChevronLeft, LayoutDashboard,
} from 'lucide-react'

// ── Navigation ────────────────────────────────────────────────

const ADMIN_NAV = [
  { href: '/admin/visao-geral',   label: 'Visão Geral',     icon: LayoutDashboard },
  { href: '/admin/jogos',         label: 'Jogos',           icon: Swords          },
  { href: '/admin/resultados',    label: 'Resultados',      icon: Trophy          },
  { href: '/admin/fases',         label: 'Fases',           icon: Calendar        },
  { href: '/admin/participantes', label: 'Participantes',   icon: Users           },
  { href: '/admin/desempate',     label: 'Desempate',       icon: Scale           },
  { href: '/admin/pagamento',     label: 'Pagamento',       icon: CreditCard      },
  { href: '/admin/palpites',      label: 'Palpites Gerais', icon: LayoutGrid      },
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

type Props = { currentPhase: string | null }

// ── NavItem ───────────────────────────────────────────────────

function NavItem({
  href, label, Icon, active,
}: {
  href: string
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: React.ComponentType<any>
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={[
        'group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-all duration-150',
        active
          ? 'bg-brand/8 text-ink font-medium'
          : 'text-ink-soft hover:bg-hairline/60 hover:text-ink',
      ].join(' ')}
    >
      <span className={[
        'absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full transition-opacity',
        active ? 'opacity-100 bg-brand' : 'opacity-0',
      ].join(' ')} />
      <Icon
        size={16}
        strokeWidth={1.5}
        className={active ? 'text-brand' : 'text-ink-faint group-hover:text-ink-soft'}
        aria-hidden="true"
      />
      {label}
    </Link>
  )
}

// ── Component — desktop sidebar only ─────────────────────────

export function AdminSidebar({ currentPhase }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 hidden lg:flex w-64 flex-col border-r border-hairline bg-card z-40"
      aria-label="Painel admin"
    >
      {/* Brand + phase context */}
      <div className="px-5 pt-6 pb-4 border-b border-hairline flex-shrink-0">
        <p className="font-display text-base font-semibold text-ink leading-tight">
          Ousa<span className="text-brand">Bolão</span>
          <span className="text-ink-faint font-sans text-xs font-normal ml-2">Admin</span>
        </p>
        {currentPhase && (
          <p className="text-ink-faint text-xs mt-1.5">
            Fase atual:{' '}
            <span className="text-ink-soft">{PHASE_LABELS[currentPhase] ?? currentPhase}</span>
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" aria-label="Seções do painel">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={pathname === href || pathname.startsWith(href + '/')}
          />
        ))}
      </nav>

      {/* Back to app */}
      <div className="px-3 pb-5 border-t border-hairline pt-3 flex-shrink-0">
        <Link
          href="/inicio"
          className="flex items-center gap-2 px-3 py-2 text-sm text-ink-soft hover:text-ink hover:bg-hairline/60 rounded-[10px] transition-colors"
        >
          <ChevronLeft size={15} strokeWidth={1.5} />
          Voltar ao app
        </Link>
      </div>
    </aside>
  )
}
