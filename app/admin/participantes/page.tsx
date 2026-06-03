import { createClient } from '@/lib/supabase/server'
import { ParticipantesClient } from './_components/ParticipantesClient'

export type Participant = {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  payment_status: string
  is_admin: boolean
}

export default async function ParticipantesPage() {
  const supabase = await createClient()

  const [
    { data: { user } },
    { data: profiles, error: profilesErr },
    { data: adminRoles },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('profiles')
      .select('id, name, email, avatar_url, payment_status')
      .order('name'),
    supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin'),
  ])

  if (profilesErr) {
    return (
      <div className="rounded-card border border-hairline bg-card card-shadow-sm p-6">
        <p className="text-ink font-semibold">Erro ao carregar participantes</p>
        <p className="text-ink-soft text-sm mt-1">{profilesErr.message}</p>
      </div>
    )
  }

  const adminIds = new Set((adminRoles ?? []).map(r => r.user_id))

  const participants: Participant[] = (profiles ?? []).map(p => ({
    ...p,
    is_admin: adminIds.has(p.id),
  }))

  return (
    <ParticipantesClient
      participants={participants}
      currentUserId={user?.id ?? ''}
    />
  )
}
