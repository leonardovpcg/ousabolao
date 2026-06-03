'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Swords, Users, Calendar, Scale, CreditCard, BookOpen,
  ChevronLeft, LayoutDashboard,
} from 'lucide-react'

const ADMIN_NAV = [
  { href: '/admin/jogos', label: 'Jogos', icon: Swords },
  { href: '/admin/participantes', label: 'Participantes', icon: Users },
  { href: '/admin/fases', label: 'Fases', icon: Calendar },
  { href: '/admin/desempate', label: 'Desempate', icon: Scale },
  { href: '/admin/pagamento', label: 'Pagamento', icon: CreditCard },
  { href: '/admin/regras', label: 'Regras', icon: BookOpen },
] as const

type Props = { currentPhase: string | null }

const PHASE_LABELS: Record<string, string> = {
  group_stage: 'Fase de Grupos',
  round_of_32: 'Rodada de 32',
  round_of_16: 'Oitavas de Final',
  quarter_finals: 'Quartas de Final',
  semi_finals: 'Semifinais',
  third_place: '3º Lugar',
  final: 'Final',
}

export function AdminSidebar({ currentPhase }: Props) {
  const pathname = usePathname()

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────── */}
      <aside className="fixed left-0 top-0 bottom-0 hidden lg:flex w-64 flex-col border-r border-hairline bg-card z-40">
        {/* Brand + context */}
        <div className="px-5 pt-6 pb-4 border-b border-hairline">
          <p className="font-display text-base font-semibold text-ink leading-tight">
            Ousa<span className="text-brand">Bolão</span>
            <span className="text-ink-faint font-sans text-xs font-normal ml-2">Admin</span>
          </p>
          {currentPhase && (
            <p className="text-ink-faint text-xs mt-1.5">
              Fase atual: <span className="text-ink-soft">{PHASE_LABELS[currentPhase] ?? currentPhase}</span>
            </p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5" aria-label="Painel admin">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
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
          })}
        </nav>

        {/* Back to app */}
        <div className="px-3 pb-5 border-t border-hairline pt-3">
          <Link
            href="/inicio"
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink-soft hover:text-ink hover:bg-hairline/60 rounded-[10px] transition-colors"
          >
            <ChevronLeft size={15} strokeWidth={1.5} />
            Voltar ao app
          </Link>
        </div>
      </aside>

      {/* ── Mobile top tabs ───────────────────────────── */}
      <div className="sticky top-0 z-30 bg-card border-b border-hairline lg:hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-hairline/60">
          <Link href="/inicio" className="text-ink-faint hover:text-ink transition-colors">
            <ChevronLeft size={16} strokeWidth={1.5} />
          </Link>
          <span className="text-xs font-medium text-ink-soft">Painel Admin</span>
        </div>
        <nav className="flex overflow-x-auto scrollbar-hide px-2 py-1.5 gap-1" aria-label="Painel admin">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium transition-all',
                  active
                    ? 'bg-ink text-card'
                    : 'text-ink-soft hover:bg-hairline hover:text-ink',
                ].join(' ')}
              >
                <Icon size={13} strokeWidth={1.5} aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
