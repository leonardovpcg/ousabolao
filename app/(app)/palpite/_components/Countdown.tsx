'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock, Lock } from 'lucide-react'

type Props = {
  deadlineUtc: string
  onExpire?: () => void
  className?: string
}

function msToDisplay(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
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
      <span className={`inline-flex items-center gap-1 text-ink-faint text-xs ${className}`}>
        <Lock size={11} strokeWidth={1.5} />
        Palpites encerrados
      </span>
    )
  }

  const isUrgent = remaining < 30 * 60 * 1000 // < 30 min

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${
        isUrgent ? 'text-brand font-semibold' : 'text-ink-faint'
      } ${className}`}
    >
      <Clock size={11} strokeWidth={1.5} className={isUrgent ? 'animate-pulse' : ''} />
      Expira em {msToDisplay(remaining)}
    </span>
  )
}
