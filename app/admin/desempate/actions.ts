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

const uuidSchema = z.string().uuid('ID inválido.')

// ── Create ────────────────────────────────────────────────────

export async function createQuestion(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const text = (formData.get('question') as string | null)?.trim() ?? ''
  if (text.length < 3) return { error: 'A pergunta precisa ter ao menos 3 caracteres.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { data: last } = await supabase
    .from('tiebreaker_questions')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('tiebreaker_questions').insert({
    question: text,
    display_order: (last?.display_order ?? 0) + 1,
    is_active: true,
  })

  if (error) return { error: `Erro ao criar: ${error.message}` }
  revalidatePath('/admin/desempate')
  return { ok: true }
}

// ── Update question text ──────────────────────────────────────

export async function updateQuestion(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string
  const text = (formData.get('question') as string | null)?.trim() ?? ''

  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: 'ID inválido.' }
  if (text.length < 3) return { error: 'A pergunta precisa ter ao menos 3 caracteres.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase
    .from('tiebreaker_questions')
    .update({ question: text })
    .eq('id', idParsed.data)

  if (error) return { error: `Erro ao atualizar: ${error.message}` }
  revalidatePath('/admin/desempate')
  return { ok: true }
}

// ── Save official answer ──────────────────────────────────────

export async function saveOfficialAnswer(
  id: string,
  answer: string
): Promise<ActionState> {
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: 'ID inválido.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase
    .from('tiebreaker_questions')
    .update({ official_answer: answer.trim() || null })
    .eq('id', idParsed.data)

  if (error) return { error: `Erro ao salvar resposta: ${error.message}` }
  revalidatePath('/admin/desempate')
  return { ok: true }
}

// ── Toggle is_active ──────────────────────────────────────────

export async function toggleActive(id: string): Promise<ActionState> {
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: 'ID inválido.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { data: q } = await supabase
    .from('tiebreaker_questions')
    .select('is_active')
    .eq('id', idParsed.data)
    .single()

  if (!q) return { error: 'Pergunta não encontrada.' }

  const { error } = await supabase
    .from('tiebreaker_questions')
    .update({ is_active: !q.is_active })
    .eq('id', idParsed.data)

  if (error) return { error: `Erro: ${error.message}` }
  revalidatePath('/admin/desempate')
  return { ok: true }
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteQuestion(id: string): Promise<ActionState> {
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: 'ID inválido.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase
    .from('tiebreaker_questions')
    .delete()
    .eq('id', idParsed.data)

  if (error) return { error: `Erro ao excluir: ${error.message}` }
  revalidatePath('/admin/desempate')
  return { ok: true }
}

// ── Reorder (swap with neighbor) ──────────────────────────────

export async function moveQuestion(
  id: string,
  direction: 'up' | 'down'
): Promise<ActionState> {
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: 'ID inválido.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { data: all } = await supabase
    .from('tiebreaker_questions')
    .select('id, display_order')
    .order('display_order')

  if (!all) return { error: 'Erro ao ler perguntas.' }

  const idx = all.findIndex(q => q.id === idParsed.data)
  if (idx === -1) return { error: 'Pergunta não encontrada.' }

  const targetIdx = direction === 'up' ? idx - 1 : idx + 1
  if (targetIdx < 0 || targetIdx >= all.length) return { ok: true }

  const a = all[idx]
  const b = all[targetIdx]

  const [e1, e2] = await Promise.all([
    supabase.from('tiebreaker_questions').update({ display_order: b.display_order }).eq('id', a.id),
    supabase.from('tiebreaker_questions').update({ display_order: a.display_order }).eq('id', b.id),
  ])

  if (e1.error) return { error: `Erro ao mover: ${e1.error.message}` }
  if (e2.error) return { error: `Erro ao mover: ${e2.error.message}` }

  revalidatePath('/admin/desempate')
  return { ok: true }
}
