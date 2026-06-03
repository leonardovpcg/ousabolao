'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type ActionState = { error: string } | { ok: true } | null

async function requireAdmin() {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) throw new Error('Acesso negado.')
  return supabase
}

// ── Editar antecedência (lock_minutes_before) ─────────────────

export async function updateLockMinutes(
  phaseId: string,
  minutes: number
): Promise<ActionState> {
  const parsed = z
    .object({
      phaseId: z.string().uuid('ID inválido.'),
      minutes: z.number().int().min(1, 'Mínimo 1 min.').max(1440, 'Máximo 24h.'),
    })
    .safeParse({ phaseId, minutes })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  // new columns aren't in generated types yet — safe after migration 06
  const { error } = await supabase
    .from('tournament_phases')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ lock_minutes_before: parsed.data.minutes } as any)
    .eq('id', parsed.data.phaseId)

  if (error) return { error: `Erro ao salvar: ${error.message}` }
  revalidatePath('/admin/fases')
  return { ok: true }
}

// ── Alternar bet_mode (só group_stage) ───────────────────────

export async function toggleBetMode(phaseId: string): Promise<ActionState> {
  const parsed = z.string().uuid('ID inválido.').safeParse(phaseId)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'ID inválido.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { data: phase } = await supabase
    .from('tournament_phases')
    .select('phase, status')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq('id', parsed.data as any)
    .single()

  if (!phase) return { error: 'Fase não encontrada.' }
  if (phase.phase !== 'group_stage') return { error: 'Modo por rodada é exclusivo da fase de grupos.' }
  if (['locked', 'concluded'].includes(phase.status)) {
    return { error: 'Não é possível alterar o modo de uma fase encerrada.' }
  }

  // Read current bet_mode and toggle
  const { data: full } = await supabase
    .from('tournament_phases')
    .select('*')
    .eq('id', parsed.data)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentMode = (full as any)?.bet_mode ?? 'whole_phase'
  const newMode = currentMode === 'whole_phase' ? 'per_round' : 'whole_phase'

  const { error } = await supabase
    .from('tournament_phases')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ bet_mode: newMode } as any)
    .eq('id', parsed.data)

  if (error) return { error: `Erro ao alternar modo: ${error.message}` }
  revalidatePath('/admin/fases')
  return { ok: true }
}

// ── Definir fase atual do torneio ─────────────────────────────

export async function setCurrentPhase(
  poolSettingsId: string,
  phase: string
): Promise<ActionState> {
  const parsed = z
    .object({
      poolSettingsId: z.string().uuid('ID de configuração inválido.'),
      phase: z.string().min(1).max(50),
    })
    .safeParse({ poolSettingsId, phase })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase
    .from('pool_settings')
    .update({ current_phase: parsed.data.phase })
    .eq('id', parsed.data.poolSettingsId)

  if (error) return { error: `Erro ao definir fase atual: ${error.message}` }
  revalidatePath('/admin/fases')
  revalidatePath('/admin')
  return { ok: true }
}

// ── Abrir palpites: fase inteira (upcoming → open) ────────────

export async function openPhase(phaseId: string): Promise<ActionState> {
  const parsed = z.string().uuid('ID inválido.').safeParse(phaseId)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'ID inválido.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase
    .from('tournament_phases')
    .update({ status: 'open' })
    .eq('id', parsed.data)
    .eq('status', 'upcoming')

  if (error) return { error: `Erro ao abrir palpites: ${error.message}` }
  revalidatePath('/admin/fases')
  return { ok: true }
}

// ── Abrir palpites: rodada individual (per_round mode) ────────

export async function openRound(round: string): Promise<ActionState> {
  const parsed = z.enum(['1', '2', '3']).safeParse(round)
  if (!parsed.success) return { error: 'Rodada inválida.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  // phase_rounds not in generated types yet — safe after migration 06
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { error } = await db
    .from('phase_rounds')
    .update({ status: 'open' })
    .eq('phase', 'group_stage')
    .eq('round', parsed.data)
    .eq('status', 'upcoming')

  if (error) return { error: `Erro ao abrir rodada: ${error.message}` }
  revalidatePath('/admin/fases')
  return { ok: true }
}
