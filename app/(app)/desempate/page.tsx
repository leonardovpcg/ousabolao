import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DesempateClient } from './_components/DesempateClient'
import { DEADLINE_UTC_ISO } from '@/lib/tiebreaker'

// ── Types ─────────────────────────────────────────────────────

export type TiebreakerQuestion = {
  id: string
  display_order: number
  question: string
  official_answer: string | null
  is_active: boolean
}

export type MyResponse = {
  question_id: string
  answer: string
}

export type AllResponse = {
  question_id: string
  answer: string
  user_id: string
  player_name: string | null
}

// ── Page ──────────────────────────────────────────────────────

export default async function DesempatePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isPastDeadline = new Date() >= new Date(DEADLINE_UTC_ISO)

  // Active questions — always needed
  const { data: questions, error: qErr } = await supabase
    .from('tiebreaker_questions')
    .select('id, display_order, question, official_answer, is_active')
    .eq('is_active', true)
    .order('display_order')

  if (qErr) {
    return (
      <div className="rounded-card bg-card border border-hairline card-shadow-sm p-6">
        <p className="text-ink font-semibold">Erro ao carregar perguntas</p>
        <p className="text-ink-soft text-sm mt-1">{qErr.message}</p>
      </div>
    )
  }

  // ── After deadline: fetch everyone's responses ────────────
  if (isPastDeadline) {
    const [{ data: responses }, { data: profiles }] = await Promise.all([
      supabase
        .from('tiebreaker_responses')
        .select('question_id, answer, user_id')
        .order('created_at'),
      supabase
        .from('profiles')
        .select('id, name'),
    ])

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]))

    const allResponses: AllResponse[] = (responses ?? []).map(r => ({
      question_id: r.question_id,
      answer:      r.answer,
      user_id:     r.user_id,
      player_name: profileMap.get(r.user_id) ?? null,
    }))

    return (
      <DesempateClient
        questions={(questions ?? []) as TiebreakerQuestion[]}
        myResponses={[]}
        allResponses={allResponses}
        initialExpired={true}
        userId={user.id}
      />
    )
  }

  // ── Before deadline: fetch only user's own responses ──────
  const { data: myResponsesRaw } = await supabase
    .from('tiebreaker_responses')
    .select('question_id, answer')
    .eq('user_id', user.id)

  return (
    <DesempateClient
      questions={(questions ?? []) as TiebreakerQuestion[]}
      myResponses={(myResponsesRaw ?? []) as MyResponse[]}
      allResponses={[]}
      initialExpired={false}
      userId={user.id}
    />
  )
}
