import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/ui/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // ── 1. Session ────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── 2. Admin check via SECURITY DEFINER RPC (bypasses RLS) ───
  let isAdmin = false
  let rpcError = ''

  try {
    const { data, error } = await supabase.rpc('is_admin')
    if (error) {
      rpcError = `${error.message} (code: ${error.code})`
    } else {
      isAdmin = !!data
    }
  } catch (e) {
    rpcError = String(e)
  }

  // ── 3. Surface RPC errors instead of silently hanging ────────
  if (rpcError) {
    return (
      <html lang="pt-BR">
        <body style={{ fontFamily: 'monospace', padding: 32, background: '#F6F5F1', color: '#16151A', margin: 0 }}>
          <h2>Admin — erro no is_admin() RPC</h2>
          <p><b>user.id:</b> {user.id}</p>
          <p><b>user.email:</b> {user.email}</p>
          <p><b>rpc error:</b> <span style={{ color: 'crimson' }}>{rpcError}</span></p>
        </body>
      </html>
    )
  }

  if (!isAdmin) redirect('/inicio')

  // ── 4. Fetch pool settings ────────────────────────────────────
  let currentPhase: string | null = null
  try {
    const { data: settings } = await supabase
      .from('pool_settings')
      .select('current_phase')
      .maybeSingle()
    currentPhase = settings?.current_phase ?? null
  } catch {
    // non-critical — admin shell still renders without it
  }

  // ── 5. Render ─────────────────────────────────────────────────
  return (
    <AdminShell currentPhase={currentPhase}>
      {children}
    </AdminShell>
  )
}
