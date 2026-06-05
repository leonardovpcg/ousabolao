import Image from 'next/image'
import logo from '@/app/logo.png'
import { AdminSidebar } from './AdminSidebar'
import { AdminMobileActions } from './AdminMobileActions'

type Props = {
  children: React.ReactNode
  currentPhase: string | null
}

export function AdminShell({ children, currentPhase }: Props) {
  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar currentPhase={currentPhase} />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <main className="flex-1 min-w-0">
          <div className="w-full min-w-0 max-w-[960px] mx-auto px-4 py-6 lg:px-8 lg:py-8">

            {/* ── Mobile inline header — scrolls with content ──────── */}
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

                <AdminMobileActions />
              </div>

              <div className="h-px bg-gradient-to-r from-brand/35 via-hairline to-transparent" />
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
