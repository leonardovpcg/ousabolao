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
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
