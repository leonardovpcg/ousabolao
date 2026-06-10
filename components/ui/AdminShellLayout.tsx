'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  House, LogOut,
  Swords, Trophy, Calendar, Users, Scale, CreditCard, LayoutGrid, BookOpen,
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import logo from '@/app/logo.png'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from './AdminSidebar'

const MOBILE_NAV = [
  { href: '/admin/jogos',         label: 'Jogos',           icon: Swords      },
  { href: '/admin/resultados',    label: 'Resultados',      icon: Trophy      },
  { href: '/admin/fases',         label: 'Fases',           icon: Calendar    },
  { href: '/admin/participantes', label: 'Participantes',   icon: Users       },
  { href: '/admin/desempate',     label: 'Desempate',       icon: Scale       },
  { href: '/admin/pagamento',     label: 'Pagamento',       icon: CreditCard  },
  { href: '/admin/palpites',      label: 'Relatórios',      icon: LayoutGrid  },
  { href: '/admin/regras',        label: 'Regras',          icon: BookOpen    },
] as const

type Props = {
  children: React.ReactNode
  currentPhase: string | null
}

export function AdminShellLayout({ children, currentPhase }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isVisaoGeral = pathname === '/admin/visao-geral' || pathname === '/admin'

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('admin-sidebar-collapsed') === 'true')
    } catch {}
  }, [])

  function toggle() {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('admin-sidebar-collapsed', String(next)) } catch {}
      return next
    })
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar currentPhase={currentPhase} collapsed={collapsed} onToggle={toggle} />

      <div
        className={collapsed
          ? 'flex min-w-0 flex-1 flex-col lg:pl-16'
          : 'flex min-w-0 flex-1 flex-col lg:pl-64'}
        style={{ transition: 'padding-left 300ms ease-in-out' }}
      >
        <main className="flex-1 min-w-0">
          <div className="relative w-full px-4 py-6 lg:px-8 lg:py-8">

            {/* ── Mobile inline header ──────────────────────────── */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Image
                    src={logo}
                    alt=""
                    width={36}
                    height={36}
                    priority
                    className="flex-shrink-0 rounded-[10px]"
                    style={{ boxShadow: '0 0 0 1px rgba(200,136,30,.22)' }}
                  />
                  <div className="flex flex-col">
                    <p className="font-display text-[1.125rem] font-bold text-ink tracking-tight leading-none">
                      Ousa<span className="text-brand">Bolão</span>
                    </p>
                    <p className="text-[10px] font-medium text-ink-faint leading-none mt-[3px] tracking-wide uppercase">
                      Modo Admin
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  <Link
                    href="/inicio"
                    aria-label="Voltar ao app"
                    className="p-2 rounded-[10px] text-ink-soft hover:text-ink hover:bg-hairline transition-colors"
                  >
                    <House size={18} strokeWidth={1.5} />
                  </Link>
                  <button
                    onClick={handleLogout}
                    aria-label="Sair"
                    className="p-2 rounded-[10px] text-ink-faint hover:text-loss hover:bg-loss/6 transition-colors"
                  >
                    <LogOut size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-brand/35 via-hairline to-transparent" />

              {/* Navegação entre seções — todas exceto Visão Geral */}
              {!isVisaoGeral && (
                <div className="pt-3">
                  <div className="flex items-center justify-between gap-1">
                    {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href || pathname.startsWith(href + '/')
                      return (
                        <Link
                          key={href}
                          href={href}
                          title={label}
                          aria-label={label}
                          className={[
                            'flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-colors',
                            active
                              ? 'bg-brand/8 text-brand'
                              : 'text-ink-faint hover:bg-card-sunken hover:text-ink-soft',
                          ].join(' ')}
                        >
                          <Icon size={16} strokeWidth={1.5} />
                          {active && (
                            <span className="w-1 h-1 rounded-full bg-brand" />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                  <div className="h-px bg-hairline mt-3" />
                </div>
              )}
            </div>

            {/* Desktop: ações fixas no canto superior direito, permanentes entre seções */}
            <div className="hidden lg:flex items-center gap-0.5 absolute top-8 right-8 z-10">
              <Link
                href="/inicio"
                title="Voltar ao app"
                className="p-1.5 rounded-[9px] text-ink-faint hover:text-ink-soft hover:bg-hairline/80 transition-colors"
              >
                <House size={16} strokeWidth={1.5} />
              </Link>
              <button
                onClick={handleLogout}
                title="Sair"
                className="p-1.5 rounded-[9px] text-ink-faint hover:text-loss hover:bg-loss/8 transition-colors"
              >
                <LogOut size={16} strokeWidth={1.5} />
              </button>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
