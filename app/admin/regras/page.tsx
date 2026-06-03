import { createClient } from '@/lib/supabase/server'
import { RegrasClient } from './_components/RegrasClient'

export type Rule = {
  id: string
  display_order: number
  title: string
  content: string
  created_at: string
  updated_at: string
}

export default async function AdminRegrasPage() {
  const supabase = await createClient()

  const { data: rules, error } = await supabase
    .from('rules')
    .select('id, display_order, title, content, created_at, updated_at')
    .order('display_order', { ascending: true })

  if (error) {
    return (
      <div className="rounded-card bg-card border border-hairline card-shadow-sm px-5 py-4">
        <p className="text-sm text-loss">Erro ao carregar regulamento: {error.message}</p>
      </div>
    )
  }

  return <RegrasClient rules={rules ?? []} />
}
