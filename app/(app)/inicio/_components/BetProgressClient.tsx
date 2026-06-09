'use client'

import { useState, useEffect } from 'react'

export type BetWindow = {
  matchIds: string[]
  totalMatches: number
  label: string
  deadlineUtc: string
}

type Props = {
  windows: BetWindow[]
  betMatchIds: string[]
}

function findActiveIdx(windows: BetWindow[]): number {
  const now = Date.now()
  const idx = windows.findIndex(
    (w) => new Date(w.deadlineUtc).getTime() > now,
  )
  return idx === -1 ? 0 : idx
}

export function BetProgressClient({ windows, betMatchIds }: Props) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    // Correct to the right window on mount and schedule switch when it expires
    const active = findActiveIdx(windows)
    setIdx(active)

    const current = windows[active]
    if (!current) return

    const msUntil = new Date(current.deadlineUtc).getTime() - Date.now()
    if (msUntil <= 0) return

    const t = setTimeout(() => {
      setIdx((prev) => {
        const next = findActiveIdx(windows.slice(prev + 1).map((w) => w))
        return next === -1 ? prev : prev + 1 + next
      })
    }, msUntil + 200)

    return () => clearTimeout(t)
  }, [windows])

  const win = windows[idx]
  if (!win) return null

  const betSet = new Set(betMatchIds)
  const done = win.matchIds.filter((id) => betSet.has(id)).length
  const total = win.totalMatches
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const complete = done >= total
  const missing = total - done

  return (
    <div className="rounded-card bg-card border border-hairline card-shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">
          Palpites da janela
        </span>
        <span className="text-[10px] font-medium text-ink-soft">{win.label}</span>
      </div>

      {/* Counter */}
      <div className="flex items-baseline gap-1 mb-3">
        <span
          className={`font-display text-[2rem] font-bold nums leading-none ${
            complete ? 'text-win' : 'text-ink'
          }`}
        >
          {done}
        </span>
        <span className="font-display text-base font-semibold text-ink-faint nums">
          &nbsp;/ {total}
        </span>
        <span className="text-xs text-ink-soft ml-1">jogos</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-card-sunken rounded-pill overflow-hidden">
        <div
          className={`h-full rounded-pill transition-all duration-500 ${
            complete ? 'bg-win' : 'bg-brand'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Status */}
      <p className="text-xs text-ink-soft mt-2 leading-tight">
        {complete ? (
          <span className="text-win font-medium">Todos os palpites enviados ✓</span>
        ) : missing === 1 ? (
          <>
            Falta <span className="font-semibold text-ink">1 jogo</span> sem palpite
          </>
        ) : (
          <>
            Faltam <span className="font-semibold text-ink">{missing} jogos</span> sem palpite
          </>
        )}
      </p>
    </div>
  )
}
