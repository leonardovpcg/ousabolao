'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type AuthState = { error: string } | null

const loginSchema = z.object({
  email: z.string().min(1, 'Informe o email').email('Email inválido'),
  password: z.string().min(1, 'Informe a senha'),
})

const cadastroSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(60),
    email: z.string().min(1, 'Informe o email').email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    const code = error.code ?? ''
    const msg = error.message?.toLowerCase() ?? ''
    if (code === 'email_not_confirmed' || msg.includes('not confirmed')) {
      return { error: 'Email ainda não confirmado. Verifique sua caixa de entrada (ou spam).' }
    }
    return { error: 'Email ou senha incorretos.' }
  }

  redirect('/inicio')
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = cadastroSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'Este email já está cadastrado.' }
    }
    return { error: 'Não foi possível criar a conta. Tente novamente.' }
  }

  redirect('/login?cadastro=ok')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
