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

const ruleSchema = z.object({
  title: z.string().min(1, 'Título obrigatório.').max(200, 'Título muito longo.').trim(),
  content: z.string().min(1, 'Conteúdo obrigatório.').max(10_000, 'Conteúdo muito longo.').trim(),
})

function revalidate() {
  revalidatePath('/admin/regras')
  revalidatePath('/regras')
}

// ── Create ────────────────────────────────────────────────────

export async function createRule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = ruleSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { data: last } = await supabase
    .from('rules')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('rules').insert({
    title: parsed.data.title,
    content: parsed.data.content,
    display_order: (last?.display_order ?? 0) + 1,
  })

  if (error) return { error: `Erro ao criar: ${error.message}` }
  revalidate()
  return { ok: true }
}

// ── Update ────────────────────────────────────────────────────

export async function updateRule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const idParsed = uuidSchema.safeParse(formData.get('id'))
  if (!idParsed.success) return { error: 'ID inválido.' }

  const parsed = ruleSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase
    .from('rules')
    .update({ title: parsed.data.title, content: parsed.data.content })
    .eq('id', idParsed.data)

  if (error) return { error: `Erro ao atualizar: ${error.message}` }
  revalidate()
  return { ok: true }
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteRule(id: string): Promise<ActionState> {
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: 'ID inválido.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase.from('rules').delete().eq('id', idParsed.data)

  if (error) return { error: `Erro ao excluir: ${error.message}` }
  revalidate()
  return { ok: true }
}

// ── Move (swap display_order with neighbor) ───────────────────

export async function moveRule(
  id: string,
  direction: 'up' | 'down',
): Promise<ActionState> {
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: 'ID inválido.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { data: all } = await supabase
    .from('rules')
    .select('id, display_order')
    .order('display_order')

  if (!all) return { error: 'Erro ao ler artigos.' }

  const idx = all.findIndex(r => r.id === idParsed.data)
  if (idx === -1) return { error: 'Artigo não encontrado.' }

  const targetIdx = direction === 'up' ? idx - 1 : idx + 1
  if (targetIdx < 0 || targetIdx >= all.length) return { ok: true }

  const a = all[idx]
  const b = all[targetIdx]

  const [e1, e2] = await Promise.all([
    supabase.from('rules').update({ display_order: b.display_order }).eq('id', a.id),
    supabase.from('rules').update({ display_order: a.display_order }).eq('id', b.id),
  ])

  if (e1.error) return { error: `Erro ao mover: ${e1.error.message}` }
  if (e2.error) return { error: `Erro ao mover: ${e2.error.message}` }

  revalidate()
  return { ok: true }
}
