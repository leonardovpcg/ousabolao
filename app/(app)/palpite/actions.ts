'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type BetState = { error: string } | { ok: true } | null

const BetSchema = z.object({
  matchId: z.string().uuid('ID de partida inválido.'),
  homePrediction: z.number().int().min(0, 'Mínimo 0.').max(99, 'Máximo 99.'),
  awayPrediction: z.number().int().min(0, 'Mínimo 0.').max(99, 'Máximo 99.'),
})

export async function upsertBet(
  matchId: string,
  homePrediction: number,
  awayPrediction: number,
): Promise<BetState> {
  const parsed = BetSchema.safeParse({ matchId, homePrediction, awayPrediction })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Sessão expirada. Faça login novamente.' }

  const { matchId: mid, homePrediction: hp, awayPrediction: ap } = parsed.data

  const { data: existing } = await supabase
    .from('bets')
    .select('id')
    .eq('user_id', user.id)
    .eq('match_id', mid)
    .maybeSingle()

  let dbError: { message: string } | null = null

  if (existing?.id) {
    const { error } = await supabase
      .from('bets')
      .update({ home_prediction: hp, away_prediction: ap })
      .eq('id', existing.id)
    dbError = error
  } else {
    const { error } = await supabase
      .from('bets')
      .insert({ user_id: user.id, match_id: mid, home_prediction: hp, away_prediction: ap })
    dbError = error
  }

  if (dbError) {
    const msg = dbError.message.toLowerCase()
    if (msg.includes('payment') || msg.includes('paid')) {
      return { error: 'Seu pagamento ainda não foi confirmado. Fale com o admin para liberar seu acesso.' }
    }
    if (
      msg.includes('deadline') ||
      msg.includes('lock') ||
      msg.includes('not open') ||
      msg.includes('betting_open')
    ) {
      return { error: 'O prazo para palpitar neste jogo já encerrou.' }
    }
    return { error: 'Erro ao salvar palpite. Tente novamente.' }
  }

  revalidatePath('/palpite')
  return { ok: true }
}
