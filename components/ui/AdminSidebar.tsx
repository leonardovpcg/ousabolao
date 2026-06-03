'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords, Trophy, Calendar, Users, Scale, CreditCard,
  LayoutGrid, BookOpen, ChevronLeft, Menu, X, LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Navigation ────────────────────────────────────────────────

const ADMIN_NAV = [
  { href: '/admin/jogos',         label: 'Jogos',           icon: Swords     },
  { href: '/admin/resultados',    label: 'Resultados',      icon: Trophy     },
  { href: '/admin/fases',         label: 'Fases',           icon: Calendar   },
  { href: '/admin/participantes', label: 'Participantes',   icon: Users      },
  { href: '/admin/desempate',     label: 'Desempate',       icon: Scale      },
  { href: '/admin/pagamento',     label: 'Pagamento',       icon: CreditCard },
  { href: '/admin/palpites',      label: 'Palpites Gerais', icon: LayoutGrid },
  { href: '/admin/regras',        label: 'Regras',          icon: BookOpen   },
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

// ── Shared NavItem ────────────────────────────────────────────

function NavItem({
  href, label, Icon, active, onClick,
}: {
  href: string
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: React.ComponentType<any>
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
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

// ── Component ─────────────────────────────────────────────────

export function AdminSidebar({ currentPhase }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const handleLogout = useCallback(async () => {
    closeDrawer()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }, [closeDrawer, router])

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  // Close on Escape
  useEffect(() => {
    if (!drawerOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [drawerOpen, closeDrawer])

  return (
    <>
      {/* ── Mobile fixed header ───────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-40 h-14 bg-card/95 backdrop-blur-sm border-b border-hairline flex items-center px-4 lg:hidden">
        {/* Hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={drawerOpen}
          className="p-2 -ml-1.5 rounded-[10px] text-ink-soft hover:bg-hairline hover:text-ink transition-colors flex-shrink-0 relative z-10"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>

        {/* Logo — truly centered regardless of button width */}
        <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center pointer-events-none">
          <span className="font-display text-base font-semibold text-ink leading-none">
            Ousa<span className="text-brand">Bolão</span>
          </span>
        </div>
      </header>

      {/* ── Mobile drawer + backdrop ──────────────────────── */}
      <div className="lg:hidden">
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-[2px]"
                onClick={closeDrawer}
              />

              {/* Drawer sheet */}
              <motion.aside
                key="drawer"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                className="fixed inset-y-0 left-0 z-[60] w-72 flex flex-col bg-card border-r border-hairline"
                style={{ boxShadow: '4px 0 32px rgba(22,21,26,.14)' }}
                aria-label="Menu do painel admin"
              >
                {/* Brand header */}
                <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-hairline flex-shrink-0">
                  <div>
                    <p className="font-display text-base font-semibold text-ink leading-tight">
                      Ousa<span className="text-brand">Bolão</span>
                      <span className="text-ink-faint font-sans text-xs font-normal ml-2">Admin</span>
                    </p>
                    {currentPhase && (
                      <p className="text-ink-faint text-xs mt-1">
                        Fase: <span className="text-ink-soft">{PHASE_LABELS[currentPhase] ?? currentPhase}</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={closeDrawer}
                    aria-label="Fechar menu"
                    className="p-1.5 rounded-[8px] text-ink-faint hover:bg-hairline hover:text-ink transition-colors flex-shrink-0"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Nav */}
                <nav
                  className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5"
                  aria-label="Seções do painel"
                >
                  {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
                    <NavItem
                      key={href}
                      href={href}
                      label={label}
                      Icon={Icon}
                      active={pathname === href || pathname.startsWith(href + '/')}
                      onClick={closeDrawer}
                    />
                  ))}
                </nav>

                {/* Bottom actions */}
                <div
                  className="px-3 border-t border-hairline pt-3 space-y-0.5 flex-shrink-0"
                  style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
                >
                  <Link
                    href="/inicio"
                    onClick={closeDrawer}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink-soft hover:text-ink hover:bg-hairline/60 rounded-[10px] transition-colors"
                  >
                    <ChevronLeft size={15} strokeWidth={1.5} />
                    Voltar ao app
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink-faint hover:text-loss hover:bg-loss/6 rounded-[10px] transition-colors"
                  >
                    <LogOut size={15} strokeWidth={1.5} />
                    Sair
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside
        className="fixed left-0 top-0 bottom-0 hidden lg:flex w-64 flex-col border-r border-hairline bg-card z-40"
        aria-label="Painel admin"
      >
        {/* Brand + context */}
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
    </>
  )
}
