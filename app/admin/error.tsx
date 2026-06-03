'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin error]', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="rounded-card bg-card border border-hairline card-shadow max-w-md w-full p-8 text-center">
        <AlertTriangle size={32} strokeWidth={1.5} className="text-brand mx-auto mb-4" />
        <h1 className="font-display text-xl font-semibold text-ink mb-2">
          Erro no painel admin
        </h1>
        <p className="text-ink-soft text-sm mb-1">{error.message}</p>
        {error.digest && (
          <p className="text-ink-faint text-xs mb-4">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 rounded-btn bg-ink px-5 py-2.5 text-sm font-semibold text-card hover:bg-ink/90 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
