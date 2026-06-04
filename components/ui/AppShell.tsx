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
        <main className="flex-1 nav-pad lg:pb-12">
          <div className="mx-auto w-full max-w-[840px] px-4 py-6 lg:px-8 lg:py-8">

            {/* ── Mobile brand block — inline, scrolls with content ─────── */}
            {/* Hidden on desktop where sidebar already shows the branding  */}
            <div className="lg:hidden mb-6">
              {/* Logo + wordmark row */}
              <div className="flex items-center gap-2.5 mb-4">
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
                  <p className="text-[10px] font-medium text-ink-faint leading-none mt-[3px] tracking-wide">
                    O Bolão dos Parças
                  </p>
                </div>
              </div>

              {/* Gradient separator — visual transition into section content */}
              <div className="h-px bg-gradient-to-r from-brand/35 via-hairline to-transparent" />
            </div>

            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
