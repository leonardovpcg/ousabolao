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

const uuidSchema = z.string().uuid('ID de usuário inválido.')

// ── Toggle payment_status between 'paid' ↔ 'pending' ─────────

export async function togglePayment(userId: string): Promise<ActionState> {
  const parsed = uuidSchema.safeParse(userId)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'ID inválido.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { data: profile, error: readErr } = await supabase
    .from('profiles')
    .select('payment_status')
    .eq('id', parsed.data)
    .single()

  if (readErr || !profile) return { error: 'Participante não encontrado.' }

  const newStatus = profile.payment_status === 'paid' ? 'pending' : 'paid'

  const { error } = await supabase
    .from('profiles')
    .update({ payment_status: newStatus })
    .eq('id', parsed.data)

  if (error) return { error: `Erro ao atualizar: ${error.message}` }
  revalidatePath('/admin/participantes')
  return { ok: true }
}

// ── Grant admin role ──────────────────────────────────────────

export async function grantAdmin(userId: string): Promise<ActionState> {
  const parsed = uuidSchema.safeParse(userId)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'ID inválido.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  // Idempotent: no-op if already admin
  const { data: existing } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', parsed.data)
    .eq('role', 'admin')
    .maybeSingle()

  if (existing) return { ok: true }

  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: parsed.data, role: 'admin' })

  if (error) return { error: `Erro ao conceder admin: ${error.message}` }
  revalidatePath('/admin/participantes')
  return { ok: true }
}

// ── Revoke admin role ─────────────────────────────────────────

export async function revokeAdmin(userId: string): Promise<ActionState> {
  const parsed = uuidSchema.safeParse(userId)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'ID inválido.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  // Self-demotion protection — enforced server-side (UI also blocks it)
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === parsed.data) {
    return { error: 'Você não pode remover seu próprio acesso de admin.' }
  }

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', parsed.data)
    .eq('role', 'admin')

  if (error) return { error: `Erro ao remover admin: ${error.message}` }
  revalidatePath('/admin/participantes')
  return { ok: true }
}
