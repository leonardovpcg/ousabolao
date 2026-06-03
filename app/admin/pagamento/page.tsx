import { createClient } from '@/lib/supabase/server'
import { PagamentoClient } from './_components/PagamentoClient'

export type PoolSettings = {
  id: string
  quota_value: number
  payment_instructions: string | null
}

export default async function AdminPagamentoPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pool_settings')
    .select('id, quota_value, payment_instructions')
    .maybeSingle()

  if (error) {
    return (
      <div className="rounded-card border border-hairline bg-card card-shadow-sm p-6">
        <p className="text-ink font-semibold">Erro ao carregar configurações</p>
        <p className="text-ink-soft text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-card border border-hairline bg-card card-shadow-sm p-6">
        <p className="text-ink font-semibold">Configurações não encontradas</p>
        <p className="text-ink-soft text-sm mt-1">
          A tabela pool_settings está vazia. Execute a migration 01 para criar o registro inicial.
        </p>
      </div>
    )
  }

  return <PagamentoClient settings={data as PoolSettings} />
}
