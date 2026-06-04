'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Wifi } from 'lucide-react'

const APP_TZ = 'America/Campo_Grande'

export type DeadlineInfo = {
  deadline_utc: string
  window_label: string
  deadline_label: string
}

type Props = {
  deadlineInfo: DeadlineInfo | null
}

type Parts = { d: number; h: number; m: number; s: number }

function msToParts(ms: number): Parts {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatDeadlineParts(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const date = new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ,
    day: 'numeric',
    month: 'long',
  }).format(d)
  const time = new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(d)
    .replace(':', 'h')
  return { date, time }
}

function Block({ value, label, urgent }: { value: string; label: string; urgent: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[80px]">
      <div
        className="w-full aspect-square flex items-center justify-center rounded-xl transition-colors duration-700"
        style={{
          background: urgent ? 'rgba(200,136,30,.14)' : 'rgba(200,136,30,.07)',
          boxShadow: 'inset 0 1px 3px rgba(20,18,25,.06)',
          border: urgent ? '1px solid rgba(200,136,30,.28)' : '1px solid rgba(200,136,30,.15)',
        }}
      >
        <span
          className={[
            'font-display font-bold nums tabular-nums text-[2rem] lg:text-[2.75rem]',
            'transition-colors duration-700 leading-none',
            urgent ? 'text-brand' : 'text-ink',
          ].join(' ')}
        >
          {value}
        </span>
      </div>
      <span
        className={[
          'text-[9px] lg:text-[10px] font-bold uppercase tracking-[.12em] leading-none',
          urgent ? 'text-brand/60' : 'text-ink-faint',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  )
}

function Sep({ urgent }: { urgent: boolean }) {
  return (
    <span
      className={[
        'font-display text-xl lg:text-2xl font-light select-none flex-shrink-0',
        'self-center translate-y-[-8px] lg:translate-y-[-10px]',
        urgent ? 'text-brand/50 animate-pulse' : 'text-brand/30',
      ].join(' ')}
    >
      :
    </span>
  )
}

// ── No window ──────────────────────────────────────────────────────

function NoWindow() {
  return (
    <div className="rounded-card bg-card border border-hairline card-shadow p-6 lg:p-8 flex flex-col items-center text-center gap-3 py-10">
      <div className="w-12 h-12 rounded-full bg-card-sunken flex items-center justify-center">
        <Wifi size={20} className="text-ink-faint" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-ink">Nenhuma janela aberta</p>
        <p className="text-sm text-ink-soft mt-1 max-w-xs">
          Aguardando o admin abrir a próxima fase ou rodada de palpites.
        </p>
      </div>
    </div>
  )
}

// ── Expired ────────────────────────────────────────────────────────

function Expired({ windowLabel }: { windowLabel: string }) {
  return (
    <div className="rounded-card bg-card border border-hairline card-shadow p-6 lg:p-8 flex flex-col items-center text-center gap-3 py-8">
      <p className="text-[11px] font-bold text-ink-faint uppercase tracking-wider">
        Prazo encerrado
      </p>
      <p className="font-display text-xl font-semibold text-ink">{windowLabel}</p>
      <p className="text-sm text-ink-soft">O prazo de palpites desta janela encerrou.</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
      >
        <RefreshCw size={13} strokeWidth={2} />
        Verificar próxima janela
      </button>
    </div>
  )
}

// ── Main timer ─────────────────────────────────────────────────────

export function DeadlineTimer({ deadlineInfo }: Props) {
  const [parts, setParts] = useState<Parts | null>(null)
  const [expired, setExpired] = useState(false)
  const expiredFired = useRef(false)

  const tick = useCallback(() => {
    if (!deadlineInfo) return
    const diff = new Date(deadlineInfo.deadline_utc).getTime() - Date.now()
    if (diff <= 0) {
      setParts({ d: 0, h: 0, m: 0, s: 0 })
      if (!expiredFired.current) {
        expiredFired.current = true
        setExpired(true)
      }
    } else {
      setParts(msToParts(diff))
    }
  }, [deadlineInfo])

  useEffect(() => {
    expiredFired.current = false
    setExpired(false)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tick])

  if (!deadlineInfo) return <NoWindow />
  if (expired) return <Expired windowLabel={deadlineInfo.window_label} />

  if (parts === null) {
    return (
      <div
        className="rounded-card bg-card border border-hairline card-shadow p-6 lg:p-8 animate-pulse"
        style={{ minHeight: 180 }}
      />
    )
  }

  const urgent = parts.d === 0 && parts.h === 0 && parts.m < 30
  const { date: deadlineDate, time: deadlineTime } = formatDeadlineParts(deadlineInfo.deadline_utc)

  return (
    <div
      className="rounded-card bg-card border card-shadow p-6 lg:p-8 transition-colors duration-700"
      style={{
        borderColor: urgent ? 'rgba(200,136,30,.38)' : 'rgba(200,136,30,.22)',
      }}
    >
      {/* Header: live indicator + label */}
      <div className="flex items-center gap-2 mb-5">
        <span
          className={[
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            urgent ? 'bg-brand animate-pulse' : 'bg-win',
          ].join(' ')}
        />
        <span className="text-[11px] font-bold text-ink-faint uppercase tracking-wider">
          Palpites encerram em
        </span>
      </div>

      {/* Digit blocks */}
      <div className="flex items-center gap-2 lg:gap-3 justify-center mb-5">
        <Block value={pad(parts.d)} label="dias" urgent={urgent} />
        <Sep urgent={urgent} />
        <Block value={pad(parts.h)} label="horas" urgent={urgent} />
        <Sep urgent={urgent} />
        <Block value={pad(parts.m)} label="min" urgent={urgent} />
        <Sep urgent={urgent} />
        <Block value={pad(parts.s)} label="seg" urgent={urgent} />
      </div>

      {/* Window label + full deadline message */}
      <div
        className="border-t pt-4 text-center space-y-1"
        style={{ borderColor: urgent ? 'rgba(200,136,30,.22)' : '#E4E2DA' }}
      >
        <p className="font-display text-base lg:text-lg font-semibold text-ink">
          {deadlineInfo.window_label}
        </p>
        <p className="text-sm text-ink-soft">
          {'Palpites encerram no dia '}
          <span className={urgent ? 'font-semibold text-brand' : 'font-semibold text-ink'}>
            {deadlineDate}
          </span>
          {', às '}
          <span className={urgent ? 'font-semibold text-brand' : 'font-semibold text-ink'}>
            {deadlineTime}
          </span>
        </p>
        <p className="text-xs text-ink-faint">(Campo Grande, MS)</p>
      </div>
    </div>
  )
}
