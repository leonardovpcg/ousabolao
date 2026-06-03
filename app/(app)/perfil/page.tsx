import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PerfilClient } from './_components/PerfilClient'

export type Profile = {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  payment_status: string
}

export default async function PerfilPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, adminResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, email, avatar_url, payment_status')
      .eq('id', user.id)
      .single(),
    supabase.rpc('is_admin'),
  ])

  if (profileResult.error) {
    return (
      <div className="rounded-card bg-card border border-hairline card-shadow-sm p-6">
        <p className="text-ink font-semibold">Erro ao carregar perfil</p>
        <p className="text-ink-soft text-sm mt-1">{profileResult.error.message}</p>
      </div>
    )
  }

  return (
    <PerfilClient
      profile={profileResult.data as Profile}
      isAdmin={!!adminResult.data}
    />
  )
}
