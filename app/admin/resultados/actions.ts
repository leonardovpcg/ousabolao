'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { calcularPontos } from '@/lib/scoring/calcularPontos'

export type ResultState = { error: string } | { ok: true; betsUpdated: number } | null

async function requireAdmin() {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) throw new Error('Acesso negado.')
  return supabase
}

const ResultSchema = z.object({
  matchId: z.string().uuid('ID de partida inválido.'),
  homeScore: z.number().int().min(0, 'Placar mínimo: 0.').max(99, 'Placar máximo: 99.'),
  awayScore: z.number().int().min(0, 'Placar mínimo: 0.').max(99, 'Placar máximo: 99.'),
})

/**
 * Lança ou edita o resultado de uma partida:
 * (a) Grava home_score / away_score / status='finished' na matches;
 * (b) Recalcula bets.points de cada palpite da partida usando calcularPontos();
 * (c) Chama recalculate_complete_ranking() para reagregar total_points / exact_scores /
 *     correct_results em ranking;
 * (d) Atualiza ranking.position ordenando por total_points DESC, exact_scores DESC,
 *     correct_results DESC.
 */
export async function launchResult(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<ResultState> {
  const parsed = ResultSchema.safeParse({ matchId, homeScore, awayScore })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { matchId: mid, homeScore: hs, awayScore: as_ } = parsed.data

  // ── (a) Atualizar partida ─────────────────────────────────────
  const { error: matchErr } = await supabase
    .from('matches')
    .update({ home_score: hs, away_score: as_, status: 'finished' })
    .eq('id', mid)

  if (matchErr) return { error: `Erro ao lançar resultado: ${matchErr.message}` }

  // ── (b) Recalcular pontos dos palpites ────────────────────────
  const { data: bets, error: betsErr } = await supabase
    .from('bets')
    .select('id, home_prediction, away_prediction')
    .eq('match_id', mid)

  if (betsErr) return { error: `Erro ao buscar palpites: ${betsErr.message}` }

  const betList = bets ?? []
  if (betList.length > 0) {
    const updates = betList.map((bet) => {
      const pts = calcularPontos(
        { casa: bet.home_prediction, fora: bet.away_prediction },
        { casa: hs, fora: as_ },
      )
      return supabase.from('bets').update({ points: pts }).eq('id', bet.id)
    })
    await Promise.all(updates)
  }

  // ── (c) Reagregar ranking via função do banco ─────────────────
  const { error: rankErr } = await supabase.rpc('recalculate_complete_ranking')
  if (rankErr) return { error: `Erro ao recalcular ranking: ${rankErr.message}` }

  // ── (d) Atualizar posições (total_points DESC → exact_scores DESC → correct_results DESC)
  const { data: rankRows, error: posErr } = await supabase
    .from('ranking')
    .select('id')
    .order('total_points', { ascending: false })
    .order('exact_scores', { ascending: false })
    .order('correct_results', { ascending: false })

  if (posErr) return { error: `Erro ao ordenar ranking: ${posErr.message}` }

  if (rankRows && rankRows.length > 0) {
    await Promise.all(
      rankRows.map((row, idx) =>
        supabase.from('ranking').update({ position: idx + 1 }).eq('id', row.id),
      ),
    )
  }

  revalidatePath('/admin/resultados')
  revalidatePath('/ranking')
  revalidatePath('/palpite')
  revalidatePath('/inicio')

  return { ok: true, betsUpdated: betList.length }
}
