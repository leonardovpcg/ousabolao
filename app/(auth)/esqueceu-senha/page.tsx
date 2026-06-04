'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react'
import { requestPasswordReset, type ResetPasswordState } from '@/lib/auth/actions'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const inputClass = [
  'w-full rounded-input border border-hairline bg-card-sunken',
  'px-4 py-3 text-sm text-ink placeholder:text-ink-faint',
  'outline-none transition-all duration-150',
  'focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card',
].join(' ')

function EsqueceuSenhaForm() {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(
    requestPasswordReset,
    null,
  )
  const searchParams = useSearchParams()
  const linkInvalido = searchParams.get('erro') === 'link-invalido'

  if (state && 'success' in state) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(30,122,77,.10)' }}
        >
          <CheckCircle2 size={22} className="text-win" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">Email enviado</h1>
          <p className="text-ink-soft text-sm mt-2 leading-relaxed">
            Se este email estiver cadastrado, você receberá um link para redefinir a senha.
            Verifique também a caixa de spam.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-1 text-sm font-medium text-brand hover:text-brand-deep transition-colors"
        >
          Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint hover:text-ink-soft transition-colors mb-4"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Voltar ao login
        </Link>
        <h1 className="text-xl font-semibold text-ink tracking-tight">Esqueceu a senha?</h1>
        <p className="text-ink-soft text-sm mt-0.5 leading-snug">
          Informe seu email e enviaremos um link para redefinir.
        </p>
      </div>

      {linkInvalido && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-input border px-4 py-3 text-sm"
          style={{ background: 'rgba(178,58,46,.05)', borderColor: 'rgba(178,58,46,.20)' }}
        >
          <AlertCircle size={15} className="text-loss flex-shrink-0 mt-px" strokeWidth={1.75} />
          <span className="text-loss">
            O link de redefinição expirou ou já foi usado. Solicite um novo abaixo.
          </span>
        </div>
      )}

      {state && 'error' in state && (
        <div
          role="alert"
          className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss"
        >
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-xs font-semibold uppercase tracking-widest text-ink-faint"
        >
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
        {pending ? 'Enviando…' : 'Enviar link'}
      </button>
    </form>
  )
}

export default function EsqueceuSenhaPage() {
  return (
    <Suspense>
      <EsqueceuSenhaForm />
    </Suspense>
  )
}
