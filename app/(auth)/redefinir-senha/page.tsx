import { createClient } from '@/lib/supabase/server'
import { RedefinirSenhaForm } from './_components/RedefinirSenhaForm'

export default async function RedefinirSenhaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <RedefinirSenhaForm hasSession={!!user} />
}
