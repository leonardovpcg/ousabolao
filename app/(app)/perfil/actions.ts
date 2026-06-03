'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type ActionState = { error: string } | { ok: true } | null

// ── Update name ───────────────────────────────────────────────

export async function updateName(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const parsed = z
    .string()
    .min(1, 'Nome obrigatório.')
    .max(60, 'Nome muito longo.')
    .trim()
    .safeParse(formData.get('name'))

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const { error } = await supabase
    .from('profiles')
    .update({ name: parsed.data })
    .eq('id', user.id)

  if (error) return { error: `Erro ao salvar: ${error.message}` }
  revalidatePath('/perfil')
  return { ok: true }
}

// ── Update avatar URL (called after client-side upload) ───────

export async function updateAvatarUrl(url: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const parsed = z.string().url('URL inválida.').max(2000).safeParse(url)
  if (!parsed.success) return { error: 'URL de avatar inválida.' }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: parsed.data })
    .eq('id', user.id)

  if (error) return { error: `Erro ao salvar: ${error.message}` }
  revalidatePath('/perfil')
  return { ok: true }
}
