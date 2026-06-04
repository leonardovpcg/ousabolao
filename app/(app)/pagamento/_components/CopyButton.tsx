'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // silently fail — clipboard might not be available in all contexts
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
        'border transition-all duration-150 active:scale-[.97]',
        copied
          ? 'bg-win/10 text-win border-win/20'
          : 'bg-card-sunken text-ink-soft border-hairline hover:border-ink-faint hover:text-ink',
      ].join(' ')}
    >
      {copied ? (
        <>
          <Check size={12} strokeWidth={2.5} />
          Copiado!
        </>
      ) : (
        <>
          <Copy size={12} strokeWidth={1.75} />
          Copiar chave
        </>
      )}
    </button>
  )
}
