'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock, Lock } from 'lucide-react'

type Props = {
  deadlineUtc: string
  onExpire?: () => void
  className?: string
}

function msToDisplay(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`
  return `${s}s`
}

export function Countdown({ deadlineUtc, onExpire, className = '' }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const expiredRef = useRef(false)

  useEffect(() => {
    expiredRef.current = false

    function tick() {
      const diff = new Date(deadlineUtc).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining(0)
        if (!expiredRef.current) {
          expiredRef.current = true
          onExpire?.()
        }
        return
      }
      setRemaining(diff)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadlineUtc, onExpire])

  if (remaining === null) return null

  if (remaining === 0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card-sunken border border-hairline ${className}`}
      >
        <Lock size={10} strokeWidth={2} className="text-ink-faint flex-shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
          Encerrado
        </span>
      </span>
    )
  }

  const isUrgent = remaining < 60 * 60 * 1000    // < 1h → amber
  const isCritical = remaining < 15 * 60 * 1000  // < 15 min → pulse

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors duration-700',
        isUrgent ? 'bg-brand/8 border-brand/25' : 'bg-card-sunken border-hairline',
        className,
      ].join(' ')}
    >
      <Clock
        size={10}
        strokeWidth={1.75}
        className={[
          'flex-shrink-0 transition-colors duration-700',
          isCritical ? 'text-brand animate-pulse' : isUrgent ? 'text-brand' : 'text-ink-faint',
        ].join(' ')}
      />
      <span
        className={[
          'text-[10px] font-semibold uppercase tracking-wide transition-colors duration-700',
          isUrgent ? 'text-brand/70' : 'text-ink-faint',
        ].join(' ')}
      >
        Fecha em
      </span>
      <span
        className={[
          'font-display text-[13px] font-bold nums leading-none transition-colors duration-700',
          isUrgent ? 'text-brand' : 'text-ink-soft',
        ].join(' ')}
      >
        {msToDisplay(remaining)}
      </span>
    </span>
  )
}
