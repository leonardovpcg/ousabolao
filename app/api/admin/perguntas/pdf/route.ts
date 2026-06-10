import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { PerguntasPdf } from '@/lib/pdf/perguntas-pdf'
import React from 'react'
import type { PerguntasPdfData, PerguntasPdfQuestion, PerguntasPdfPlayer } from '@/lib/pdf/perguntas-pdf'

export async function GET() {
  const supabase = await createClient()

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return new Response('Acesso negado.', { status: 403 })

  const [questionRes, responseRes, profileRes] = await Promise.all([
    supabase
      .from('tiebreaker_questions')
      .select('id, display_order, question, official_answer, is_active')
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('tiebreaker_responses')
      .select('user_id, question_id, answer, is_correct'),
    supabase
      .from('profiles')
      .select('id, name')
      .order('name'),
  ])

  if (questionRes.error || responseRes.error || profileRes.error) {
    return new Response('Erro ao buscar dados.', { status: 500 })
  }

  const questions = questionRes.data ?? []
  const responses = responseRes.data ?? []
  const profiles  = profileRes.data ?? []

  // Build response map: userId → questionId → response
  const respMap = new Map<string, Map<string, { answer: string; is_correct: boolean | null }>>()
  for (const r of responses) {
    if (!r.user_id || !r.question_id) continue
    if (!respMap.has(r.user_id)) respMap.set(r.user_id, new Map())
    respMap.get(r.user_id)!.set(r.question_id, {
      answer:     r.answer ?? '',
      is_correct: r.is_correct ?? null,
    })
  }

  const pdfQuestions: PerguntasPdfQuestion[] = questions.map(q => ({
    question:       q.question,
    official_answer: q.official_answer ?? null,
  }))

  const pdfPlayers: PerguntasPdfPlayer[] = profiles.map(p => ({
    player_name: p.name ?? 'Sem nome',
    answers: questions.map(q => {
      const r = respMap.get(p.id)?.get(q.id)
      return r
        ? { text: r.answer || null, is_correct: r.is_correct }
        : { text: null, is_correct: null }
    }),
  }))

  const data: PerguntasPdfData = {
    questions:    pdfQuestions,
    players:      pdfPlayers,
    generated_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(PerguntasPdf, { data }) as any)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': 'attachment; filename="perguntas-desempate.pdf"',
      'Cache-Control':       'no-store',
    },
  })
}
