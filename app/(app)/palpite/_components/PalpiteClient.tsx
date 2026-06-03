'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cgDateKey, formatDayLabel, formatDayOfWeek } from '@/lib/utils/datetime'
import { MatchCard } from './MatchCard'
import type { MatchData } from './types'

type Props = {
  matches: MatchData[]
  currentUserId: string
  isPaid: boolean
  isAdmin: boolean
  defaultDay: string
}

// ── Date navigation ───────────────────────────────────────────────

function DateNav({
  days,
  selected,
  onChange,
}: {
  days: string[]
  selected: string
  onChange: (day: string) => void
}) {
  const idx = days.indexOf(selected)

  return (
    <div className="flex items-center gap-2 -mx-4 px-4 lg:mx-0 lg:px-0">
      <button
        onClick={() => idx > 0 && onChange(days[idx - 1])}
        disabled={idx <= 0}
        className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-ink-soft hover:text-ink hover:bg-card-sunken disabled:opacity-25 transition-colors"
        aria-label="Dia anterior"
      >
        <ChevronLeft size={18} strokeWidth={2} />
      </button>

      {/* Scrollable pill strip */}
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 py-1">
          {days.map((day) => {
            const isSelected = day === selected
            return (
              <button
                key={day}
                onClick={() => onChange(day)}
                className={[
                  'flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-150',
                  isSelected
                    ? 'bg-ink text-card'
                    : 'bg-card border border-hairline text-ink-soft hover:border-ink-faint',
                ].join(' ')}
                aria-current={isSelected ? 'date' : undefined}
              >
                <span className="text-[10px] font-medium uppercase tracking-wide opacity-70 leading-none mb-0.5">
                  {formatDayOfWeek(day)}
                </span>
                <span className="font-display text-sm font-bold leading-none nums">
                  {formatDayLabel(day)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => idx < days.length - 1 && onChange(days[idx + 1])}
        disabled={idx >= days.length - 1}
        className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-ink-soft hover:text-ink hover:bg-card-sunken disabled:opacity-25 transition-colors"
        aria-label="Próximo dia"
      >
        <ChevronRight size={18} strokeWidth={2} />
      </button>
    </div>
  )
}

// ── Phase label for the selected day ─────────────────────────────

function DayContext({ matches }: { matches: MatchData[] }) {
  if (matches.length === 0) return null
  const phases = [...new Set(matches.map((m) => m.phase_label))]
  return (
    <p className="text-ink-soft text-sm mt-3">
      {phases.join(' · ')}
    </p>
  )
}

// ── Main client component ─────────────────────────────────────────

export function PalpiteClient({
  matches,
  currentUserId: _currentUserId,
  isPaid,
  isAdmin,
  defaultDay,
}: Props) {
  const [selectedDay, setSelectedDay] = useState(defaultDay)

  // Group matches by CG date key
  const dayGroups = useMemo(() => {
    const map = new Map<string, MatchData[]>()
    for (const m of matches) {
      const key = cgDateKey(m.match_date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return map
  }, [matches])

  const allDays = useMemo(() => Array.from(dayGroups.keys()).sort(), [dayGroups])
  const dayMatches = dayGroups.get(selectedDay) ?? []
  const canBet = isPaid || isAdmin

  if (matches.length === 0) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-5 text-center px-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(200,136,30,.10), rgba(200,136,30,.04))' }}
        >
          <Calendar size={26} className="text-brand/60" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-display text-xl font-semibold text-ink">Nenhum jogo cadastrado</p>
          <p className="text-sm text-ink-soft mt-2">O admin ainda não adicionou partidas.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-5">
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
          Palpites
        </h1>
        <DayContext matches={dayMatches} />
      </div>

      {/* Payment wall banner */}
      {!canBet && (
        <div
          className="flex items-start gap-3 mb-5 p-3.5 rounded-card border"
          style={{ background: 'rgba(178,58,46,.05)', borderColor: 'rgba(178,58,46,.20)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-loss mt-1.5 flex-shrink-0" />
          <p className="text-sm text-ink-soft leading-snug">
            <span className="font-semibold text-ink">Pagamento pendente.</span>{' '}
            Você pode ver os jogos, mas o envio de palpites fica bloqueado até a confirmação.
          </p>
        </div>
      )}

      {/* Date navigation */}
      <DateNav days={allDays} selected={selectedDay} onChange={setSelectedDay} />

      {/* Match list for selected day */}
      <div className="mt-5">
        {dayMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-ink-faint text-sm">Nenhum jogo neste dia.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {dayMatches.map((match) => (
              <MatchCard key={match.id} match={match} canBet={canBet} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
