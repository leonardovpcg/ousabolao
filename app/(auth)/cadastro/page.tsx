'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { signUp, type AuthState } from '@/lib/auth/actions'

const inputClass = [
  'w-full rounded-input border border-hairline bg-card-sunken',
  'px-4 py-3 text-sm text-ink placeholder:text-ink-faint',
  'outline-none transition-all duration-150',
  'focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card',
].join(' ')

const labelClass = 'text-xs font-semibold uppercase tracking-widest text-ink-faint'

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, null)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ink tracking-tight">Criar conta</h1>
        <p className="text-ink-soft text-sm mt-0.5">Entre pro bolão dos parças.</p>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss"
        >
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className={labelClass}>Seu nome</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Como vai aparecer no ranking"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClass}>Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="seu@email.com"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={labelClass}>Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Mínimo 6 caracteres"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className={labelClass}>Confirmar senha</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repita a senha"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={[
          'mt-1 flex w-full items-center justify-center gap-2',
          'rounded-btn bg-ink py-3.5 text-sm font-semibold text-card',
          'transition-all duration-150',
          'active:scale-[0.98] active:bg-ink/90',
          'hover:bg-ink/90',
          'disabled:cursor-not-allowed disabled:opacity-50',
        ].join(' ')}
      >
        {pending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
        {pending ? 'Criando conta…' : 'Criar conta'}
      </button>

      <p className="text-center text-sm text-ink-soft">
        Já tem conta?{' '}
        <Link
          href="/login"
          className="font-medium text-brand hover:text-brand-deep transition-colors"
        >
          Fazer login
        </Link>
      </p>
    </form>
  )
}
