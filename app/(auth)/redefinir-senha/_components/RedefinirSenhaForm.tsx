'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2, XCircle } from 'lucide-react'
import { updatePassword, type AuthState } from '@/lib/auth/actions'

const inputClass = [
  'w-full rounded-input border border-hairline bg-card-sunken',
  'px-4 py-3 text-sm text-ink placeholder:text-ink-faint',
  'outline-none transition-all duration-150',
  'focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card',
].join(' ')

export function RedefinirSenhaForm({ hasSession }: { hasSession: boolean }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(updatePassword, null)

  if (!hasSession) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(178,58,46,.08)' }}
        >
          <XCircle size={22} className="text-loss" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">Link inválido</h1>
          <p className="text-ink-soft text-sm mt-2 leading-relaxed">
            Este link de redefinição expirou ou já foi usado. Solicite um novo.
          </p>
        </div>
        <Link
          href="/esqueceu-senha"
          className={[
            'mt-1 flex w-full items-center justify-center',
            'rounded-btn bg-ink py-3.5 text-sm font-semibold text-card',
            'transition-all duration-150 hover:bg-ink/90 active:scale-[0.98]',
          ].join(' ')}
        >
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ink tracking-tight">Nova senha</h1>
        <p className="text-ink-soft text-sm mt-0.5">
          Escolha uma senha forte com pelo menos 6 caracteres.
        </p>
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
        <label
          htmlFor="password"
          className="text-xs font-semibold uppercase tracking-widest text-ink-faint"
        >
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-xs font-semibold uppercase tracking-widest text-ink-faint"
        >
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
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
        {pending ? 'Salvando…' : 'Salvar nova senha'}
      </button>

      <p className="text-center text-sm text-ink-soft">
        Lembrou a senha?{' '}
        <Link
          href="/login"
          className="font-medium text-brand hover:text-brand-deep transition-colors"
        >
          Entrar
        </Link>
      </p>
    </form>
  )
}
