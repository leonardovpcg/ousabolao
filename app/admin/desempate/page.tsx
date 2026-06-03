import { createClient } from '@/lib/supabase/server'
import { DesempateClient } from './_components/DesempateClient'

export type TiebreakerQuestion = {
  id: string
  display_order: number
  question: string
  official_answer: string | null
  is_active: boolean
}

export default async function AdminDesempatePage() {
  const supabase = await createClient()

  const [questionsResult, phaseResult] = await Promise.all([
    supabase
      .from('tiebreaker_questions')
      .select('id, display_order, question, official_answer, is_active')
      .order('display_order'),
    supabase
      .from('tournament_phases')
      .select('betting_locks_at')
      .eq('phase', 'group_stage')
      .maybeSingle(),
  ])

  if (questionsResult.error) {
    return (
      <div className="rounded-card border border-hairline bg-card card-shadow-sm p-6">
        <p className="text-ink font-semibold">Erro ao carregar perguntas</p>
        <p className="text-ink-soft text-sm mt-1">{questionsResult.error.message}</p>
      </div>
    )
  }

  return (
    <DesempateClient
      questions={(questionsResult.data ?? []) as TiebreakerQuestion[]}
      deadline={phaseResult.data?.betting_locks_at ?? null}
    />
  )
}
