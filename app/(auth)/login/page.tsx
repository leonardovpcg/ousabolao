'use client'

import { useActionState } from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { signIn, type AuthState } from '@/lib/auth/actions'

const inputClass = [
  'w-full rounded-input border border-hairline bg-card-sunken',
  'px-4 py-3 text-sm text-ink placeholder:text-ink-faint',
  'outline-none transition-all duration-150',
  'focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card',
].join(' ')

function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signIn, null)
  const searchParams = useSearchParams()
  const justSignedUp = searchParams.get('cadastro') === 'ok'

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ink tracking-tight">Entrar</h1>
        <p className="text-ink-soft text-sm mt-0.5">Bem-vindo de volta.</p>
      </div>

      {justSignedUp && (
        <div className="rounded-input border border-brand/30 bg-brand/6 px-4 py-3 text-sm text-brand-deep">
          Conta criada! Faça login para continuar.
        </div>
      )}

      {state?.error && (
        <div
          role="alert"
          className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss"
        >
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
          Email
        </label>
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
        <label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
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
        {pending ? 'Entrando…' : 'Entrar'}
      </button>

      <p className="text-center text-sm text-ink-soft">
        Não tem conta?{' '}
        <Link
          href="/cadastro"
          className="font-medium text-brand hover:text-brand-deep transition-colors"
        >
          Criar conta
        </Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
