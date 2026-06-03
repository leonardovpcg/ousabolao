'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { DEADLINE_UTC_ISO } from '@/lib/tiebreaker'

export type ActionState = { error: string } | { ok: true } | null

const DEADLINE_UTC = new Date(DEADLINE_UTC_ISO)

export async function saveResponse(
  questionId: string,
  answer: string,
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // Server-side deadline guard
  if (new Date() >= DEADLINE_UTC) return { error: 'deadline_passed' }

  const idParsed = z.string().uuid('ID inválido.').safeParse(questionId)
  if (!idParsed.success) return { error: 'ID de pergunta inválido.' }

  const answerParsed = z
    .string()
    .min(1, 'Resposta não pode estar vazia.')
    .max(500, 'Resposta muito longa (máx. 500 caracteres).')
    .trim()
    .safeParse(answer)
  if (!answerParsed.success) return { error: answerParsed.error.issues[0]?.message ?? 'Resposta inválida.' }

  const { error } = await supabase
    .from('tiebreaker_responses')
    .upsert(
      { user_id: user.id, question_id: idParsed.data, answer: answerParsed.data },
      { onConflict: 'user_id,question_id' },
    )

  if (error) {
    // Treat bank-level trigger deadline error as deadline_passed
    const msg = error.message.toLowerCase()
    if (msg.includes('deadline') || msg.includes('prazo') || msg.includes('encerr')) {
      return { error: 'deadline_passed' }
    }
    return { error: `Erro ao salvar: ${error.message}` }
  }

  revalidatePath('/desempate')
  return { ok: true }
}
