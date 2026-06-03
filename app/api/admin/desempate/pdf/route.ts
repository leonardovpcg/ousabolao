import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { DesempatePdf } from '@/lib/pdf/desempate-pdf'
import React from 'react'
import type { ExportData, ExportRow } from '@/app/admin/desempate/actions'

export async function GET() {
  const supabase = await createClient()

  // Admin check
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    return new Response('Acesso negado.', { status: 403 })
  }

  // Fetch data
  const [qResult, rResult, pResult] = await Promise.all([
    supabase
      .from('tiebreaker_questions')
      .select('id, display_order, question')
      .order('display_order'),
    supabase
      .from('tiebreaker_responses')
      .select('user_id, question_id, answer'),
    supabase
      .from('profiles')
      .select('id, name'),
  ])

  if (qResult.error || rResult.error || pResult.error) {
    return new Response('Erro ao buscar dados.', { status: 500 })
  }

  const questions = qResult.data ?? []
  const responses = rResult.data ?? []
  const players = pResult.data ?? []

  const responseMap = new Map<string, Map<string, string>>()
  for (const r of responses) {
    if (!responseMap.has(r.user_id)) responseMap.set(r.user_id, new Map())
    responseMap.get(r.user_id)!.set(r.question_id, r.answer)
  }

  const rows: ExportRow[] = players
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR'))
    .map(player => ({
      player_name: player.name ?? 'Sem nome',
      answers: questions.map(q => responseMap.get(player.id)?.get(q.id) ?? null),
    }))

  const data: ExportData = {
    questions: questions.map(q => q.question),
    rows,
    generated_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(DesempatePdf, { data }) as any)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="desempate-ousabolao.pdf"',
      'Cache-Control': 'no-store',
    },
  })
}
