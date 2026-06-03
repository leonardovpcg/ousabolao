'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { PHASES } from './constants'
import { datetimeLocalToUTC } from '@/lib/utils/datetime'

export type ActionState = { error: string } | { ok: true } | null

// ── Admin guard — rpc uses SECURITY DEFINER, bypasses user_roles RLS ─
async function requireAdmin() {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) throw new Error('Acesso negado.')
  return supabase
}

// ── National Teams ────────────────────────────────────────────

const teamSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(100),
  country: z.string().min(2, 'País obrigatório').max(100),
  emblem_url: z.string().url('URL inválida').or(z.literal('')).optional(),
})

export async function createTeam(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = teamSchema.safeParse({
    name: formData.get('name'),
    country: formData.get('country'),
    emblem_url: formData.get('emblem_url') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase.from('national_teams').insert({
    name: parsed.data.name,
    country: parsed.data.country,
    emblem_url: parsed.data.emblem_url || null,
  })

  if (error) return { error: `Erro ao criar seleção: ${error.message}` }
  revalidatePath('/admin/jogos')
  return { ok: true }
}

export async function updateTeam(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'ID inválido.' }

  const parsed = teamSchema.safeParse({
    name: formData.get('name'),
    country: formData.get('country'),
    emblem_url: formData.get('emblem_url') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase
    .from('national_teams')
    .update({
      name: parsed.data.name,
      country: parsed.data.country,
      emblem_url: parsed.data.emblem_url || null,
    })
    .eq('id', id)

  if (error) return { error: `Erro ao atualizar: ${error.message}` }
  revalidatePath('/admin/jogos')
  return { ok: true }
}

export async function deleteTeam(id: string): Promise<ActionState> {
  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase.from('national_teams').delete().eq('id', id)
  if (error) return { error: `Erro ao excluir: ${error.message}` }
  revalidatePath('/admin/jogos')
  return { ok: true }
}

// ── Matches ────────────────────────────────────────────────────

const matchSchema = z
  .object({
    home_team_national_id: z.string().uuid('Selecione o time mandante'),
    away_team_national_id: z.string().uuid('Selecione o time visitante'),
    match_date: z.string().min(1, 'Data e hora obrigatórias'),
    phase: z.enum(PHASES, { message: 'Fase inválida' }),
    match_group: z.string().max(10).optional(),
    round: z.string().max(50).optional(),
  })
  .refine((d) => d.home_team_national_id !== d.away_team_national_id, {
    message: 'Os times devem ser diferentes.',
    path: ['away_team_national_id'],
  })


export async function createMatch(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = matchSchema.safeParse({
    home_team_national_id: formData.get('home_team_national_id'),
    away_team_national_id: formData.get('away_team_national_id'),
    match_date: formData.get('match_date'),
    phase: formData.get('phase'),
    match_group: formData.get('match_group') || undefined,
    round: formData.get('round') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase.from('matches').insert({
    home_team_national_id: parsed.data.home_team_national_id,
    away_team_national_id: parsed.data.away_team_national_id,
    match_date: datetimeLocalToUTC(parsed.data.match_date),
    phase: parsed.data.phase,
    match_group: parsed.data.match_group ?? null,
    round: parsed.data.round ?? null,
    category: 'national',
    status: 'scheduled',
  })

  if (error) return { error: `Erro ao criar partida: ${error.message}` }
  revalidatePath('/admin/jogos')
  return { ok: true }
}

export async function updateMatch(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'ID inválido.' }

  const parsed = matchSchema.safeParse({
    home_team_national_id: formData.get('home_team_national_id'),
    away_team_national_id: formData.get('away_team_national_id'),
    match_date: formData.get('match_date'),
    phase: formData.get('phase'),
    match_group: formData.get('match_group') || undefined,
    round: formData.get('round') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase
    .from('matches')
    .update({
      home_team_national_id: parsed.data.home_team_national_id,
      away_team_national_id: parsed.data.away_team_national_id,
      match_date: datetimeLocalToUTC(parsed.data.match_date),
      phase: parsed.data.phase,
      match_group: parsed.data.match_group ?? null,
      round: parsed.data.round ?? null,
    })
    .eq('id', id)

  if (error) return { error: `Erro ao atualizar: ${error.message}` }
  revalidatePath('/admin/jogos')
  return { ok: true }
}

export async function deleteMatch(id: string): Promise<ActionState> {
  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase.from('matches').delete().eq('id', id)
  if (error) return { error: `Erro ao excluir: ${error.message}` }
  revalidatePath('/admin/jogos')
  return { ok: true }
}

// ── Result ─────────────────────────────────────────────────────

const resultSchema = z.object({
  matchId: z.string().uuid(),
  home_score: z.coerce.number().int().min(0, 'Placar inválido'),
  away_score: z.coerce.number().int().min(0, 'Placar inválido'),
})

export async function launchResult(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resultSchema.safeParse({
    matchId: formData.get('matchId'),
    home_score: formData.get('home_score'),
    away_score: formData.get('away_score'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase
    .from('matches')
    .update({
      home_score: parsed.data.home_score,
      away_score: parsed.data.away_score,
      status: 'finished',
    })
    .eq('id', parsed.data.matchId)

  if (error) return { error: `Erro ao lançar resultado: ${error.message}` }
  revalidatePath('/admin/jogos')
  return { ok: true }
}
