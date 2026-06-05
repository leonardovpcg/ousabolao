import { createClient } from '@/lib/supabase/server'
import { PlayerShellLayout } from './PlayerShellLayout'

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: isAdminResult } = await supabase.rpc('is_admin')
  const isAdmin = !!isAdminResult

  return (
    <PlayerShellLayout isAdmin={isAdmin}>
      {children}
    </PlayerShellLayout>
  )
}
