import Image from 'next/image'
import logo from '@/app/logo.png'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // is_admin() uses SECURITY DEFINER — bypasses RLS on user_roles
  const { data: isAdminResult } = await supabase.rpc('is_admin')
  const isAdmin = !!isAdminResult

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar isAdmin={isAdmin} />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">

        {/* ── Mobile top bar — hidden on desktop (sidebar takes that role) ── */}
        <header
          className="fixed top-0 left-0 right-0 z-40 lg:hidden h-16 flex items-center px-4 gap-3"
          style={{
            background: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid #E4E2DA',
            boxShadow: '0 1px 4px rgba(20,18,25,.05)',
          }}
        >
          {/* Logo mark */}
          <Image
            src={logo}
            alt=""
            width={36}
            height={36}
            priority
            className="flex-shrink-0 rounded-[10px]"
            style={{ boxShadow: '0 0 0 1px rgba(200,136,30,.20)' }}
          />

          {/* Wordmark + slogan */}
          <div className="flex flex-col">
            <p className="font-display text-[1.125rem] font-bold text-ink tracking-tight leading-none">
              Ousa<span className="text-brand">Bolão</span>
            </p>
            <p className="text-[10px] font-medium text-ink-faint leading-none mt-[3px] tracking-wide">
              O Bolão dos Parças
            </p>
          </div>
        </header>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className="flex-1 nav-pad lg:pb-12">
          {/*
            pt-[88px] on mobile = 64px header + 24px breathing room
            lg:py-8   on desktop = sidebar handles branding, standard spacing
          */}
          <div className="mx-auto w-full max-w-[840px] px-4 pt-[88px] pb-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
