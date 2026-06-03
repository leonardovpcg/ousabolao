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

const schema = z.object({
  id: z.string().uuid('ID de configuração inválido.'),
  quota_value: z.coerce
    .number()
    .positive('O valor deve ser positivo.')
    .max(10_000, 'Valor muito alto.'),
  payment_instructions: z.string().max(2000, 'Instruções muito longas.').optional(),
})

export async function updatePaymentSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = schema.safeParse({
    id: formData.get('id'),
    quota_value: formData.get('quota_value'),
    payment_instructions: formData.get('payment_instructions') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await requireAdmin().catch(() => null)
  if (!supabase) return { error: 'Acesso negado.' }

  const { error } = await supabase
    .from('pool_settings')
    .update({
      quota_value: parsed.data.quota_value,
      payment_instructions: parsed.data.payment_instructions?.trim() || null,
    })
    .eq('id', parsed.data.id)

  if (error) return { error: `Erro ao salvar: ${error.message}` }
  revalidatePath('/admin/pagamento')
  revalidatePath('/pagamento')
  return { ok: true }
}
