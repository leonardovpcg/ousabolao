'use client'

import { useMemo, useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Pencil, X } from 'lucide-react'
import { launchResult } from '../actions'
import { formatDateTime } from '@/lib/utils/datetime'

// ── Types ─────────────────────────────────────────────────────────

export type NationalTeam = {
  id: string
  name: string
  country: string | null
  emblem_url: string | null
}

export type MatchRow = {
  id: string
  match_date: string
  phase: string
  match_group: string | null
  round: string | null
  status: string
  home_score: number | null
  away_score: number | null
  home_team: NationalTeam | null
  away_team: NationalTeam | null
}

export type PhaseRow = {
  id: string
  phase: string
  label: string
  display_order: number
  status: string
}

// ── Helpers ────────────────────────────────────────────────────────

const ROUND_LABELS: Record<string, string> = {
  '1': '1ª Rodada',
  '2': '2ª Rodada',
  '3': '3ª Rodada',
}

function matchSubLabel(m: MatchRow): string {
  const parts: string[] = []
  if (m.match_group) parts.push(`Grupo ${m.match_group}`)
  if (m.phase === 'group_stage' && m.round) parts.push(ROUND_LABELS[m.round] ?? `R${m.round}`)
  return parts.join(' · ')
}

function TeamFlag({ team, size = 32 }: { team: NationalTeam | null; size?: number }) {
  if (!team) return <div className="rounded-sm bg-card-sunken border border-hairline flex-shrink-0" style={{ width: size, height: size }} />
  if (team.emblem_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={team.emblem_url} alt={team.name} className="object-contain rounded-sm flex-shrink-0" style={{ width: size, height: size }} />
    )
  }
  return (
    <div
      className="rounded-sm bg-card-sunken border border-hairline flex items-center justify-center text-[9px] font-bold text-ink-soft flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {team.name.slice(0, 3).toUpperCase()}
    </div>
  )
}

function ScoreInput({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number
  onChange: (v: number) => void
  disabled: boolean
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.min(99, value + 1))}
        disabled={disabled}
        className="w-8 h-7 flex items-center justify-center text-ink-soft hover:text-ink disabled:opacity-30 transition-colors"
        aria-label={`Aumentar ${label}`}
      >
        <ChevronUp size={15} strokeWidth={2} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          if (!isNaN(n)) onChange(Math.max(0, Math.min(99, n)))
        }}
        disabled={disabled}
        className={[
          'w-12 h-12 text-center font-display text-2xl font-bold text-ink nums bg-card-sunken',
          'border border-hairline rounded-xl focus:outline-none focus:border-brand/40',
          'appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          disabled ? 'opacity-40' : '',
        ].join(' ')}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value === 0}
        className="w-8 h-7 flex items-center justify-center text-ink-soft hover:text-ink disabled:opacity-30 transition-colors"
        aria-label={`Diminuir ${label}`}
      >
        <ChevronDown size={15} strokeWidth={2} />
      </button>
    </div>
  )
}

// ── Match result card ──────────────────────────────────────────────

function MatchResultCard({ match }: { match: MatchRow }) {
  const hasResult = match.home_score !== null && match.away_score !== null
  const [isEditing, setIsEditing] = useState(false)
  const [homeVal, setHomeVal] = useState(match.home_score ?? 0)
  const [awayVal, setAwayVal] = useState(match.away_score ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const isKnockout = match.phase !== 'group_stage'
  const sub = matchSubLabel(match)

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await launchResult(match.id, homeVal, awayVal)
      if (!result || 'error' in result) {
        setError(result?.error ?? 'Erro desconhecido.')
      } else {
        const msg = `Resultado lançado · ${result.betsUpdated} palpite${result.betsUpdated !== 1 ? 's' : ''} pontuado${result.betsUpdated !== 1 ? 's' : ''}`
        setSuccessMsg(msg)
        setIsEditing(false)
        setTimeout(() => setSuccessMsg(null), 4000)
      }
    })
  }

  function openEdit() {
    setHomeVal(match.home_score ?? 0)
    setAwayVal(match.away_score ?? 0)
    setError(null)
    setIsEditing(true)
  }

  return (
    <div className={[
      'rounded-card bg-card border card-shadow-sm overflow-hidden transition-colors duration-200',
      hasResult && !isEditing ? 'border-hairline' : 'border-hairline',
    ].join(' ')}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-hairline bg-card-sunken/50">
        <div className="flex items-center gap-2 min-w-0">
          {hasResult && !isEditing && (
            <CheckCircle2 size={12} className="text-win flex-shrink-0" strokeWidth={2} />
          )}
          <span className="text-[11px] font-semibold text-ink-faint truncate uppercase tracking-wide">
            {sub ? `${sub} · ` : ''}{formatDateTime(match.match_date)}
          </span>
        </div>
        {hasResult && !isEditing && !successMsg && (
          <button
            onClick={openEdit}
            className="flex items-center gap-1 text-[11px] font-semibold text-ink-soft hover:text-ink transition-colors ml-3 flex-shrink-0"
          >
            <Pencil size={11} strokeWidth={2} />
            Editar
          </button>
        )}
        {isEditing && (
          <button
            onClick={() => { setIsEditing(false); setError(null) }}
            className="flex items-center gap-1 text-[11px] font-semibold text-ink-faint hover:text-ink transition-colors ml-3 flex-shrink-0"
            disabled={pending}
          >
            <X size={12} strokeWidth={2} />
            Cancelar
          </button>
        )}
      </div>

      <div className="px-4 py-4">
        {/* Teams + score row */}
        <div className="flex items-center gap-3">
          {/* Home team */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <TeamFlag team={match.home_team} size={28} />
            <span className="text-sm font-semibold text-ink truncate">
              {match.home_team?.name ?? '–'}
            </span>
          </div>

          {/* Score area */}
          {isEditing ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <ScoreInput
                value={homeVal}
                onChange={setHomeVal}
                disabled={pending}
                label={`Gols ${match.home_team?.name ?? 'mandante'}`}
              />
              <span className="text-ink-faint font-light text-lg px-1">×</span>
              <ScoreInput
                value={awayVal}
                onChange={setAwayVal}
                disabled={pending}
                label={`Gols ${match.away_team?.name ?? 'visitante'}`}
              />
            </div>
          ) : hasResult ? (
            <div className="flex items-center gap-2 flex-shrink-0 px-2">
              <span className="font-display text-3xl font-bold text-ink nums">{match.home_score}</span>
              <span className="text-ink-faint font-light text-xl">×</span>
              <span className="font-display text-3xl font-bold text-ink nums">{match.away_score}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-shrink-0 px-3">
              <span className="font-display text-xl text-ink-faint">–</span>
              <span className="text-ink-faint text-sm">×</span>
              <span className="font-display text-xl text-ink-faint">–</span>
            </div>
          )}

          {/* Away team */}
          <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
            <span className="text-sm font-semibold text-ink truncate text-right">
              {match.away_team?.name ?? '–'}
            </span>
            <TeamFlag team={match.away_team} size={28} />
          </div>
        </div>

        {/* Edit form footer */}
        {isEditing && (
          <div className="mt-4 space-y-3">
            {isKnockout && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-card-sunken border border-hairline">
                <AlertTriangle size={13} className="text-ink-faint mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <p className="text-xs text-ink-soft leading-snug">
                  <span className="font-semibold text-ink">Mata-mata (Art. 5º):</span>{' '}
                  considere apenas os 90 min regulamentares. Prorrogação e pênaltis não contam para o bolão.
                </p>
              </div>
            )}

            {error && (
              <p className="text-xs text-loss font-medium">{error}</p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="w-full h-10 rounded-btn bg-ink text-card text-sm font-semibold hover:opacity-90 active:scale-[.99] disabled:opacity-40 transition-all"
            >
              {pending ? 'Pontuando…' : hasResult ? 'Salvar alteração' : 'Encerrar e pontuar'}
            </button>
          </div>
        )}

        {/* Launch button (not yet edited) */}
        {!isEditing && !hasResult && (
          <div className="mt-4">
            <button
              type="button"
              onClick={openEdit}
              className="w-full h-10 rounded-btn border border-hairline text-sm font-semibold text-ink hover:bg-card-sunken transition-colors"
            >
              Lançar resultado
            </button>
          </div>
        )}

        {/* Success feedback */}
        {successMsg && (
          <div className="mt-3 flex items-center gap-2 text-xs text-win font-semibold">
            <CheckCircle2 size={13} strokeWidth={2} />
            {successMsg}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section separator ──────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  accent,
}: {
  title: string
  count: number
  accent: 'pending' | 'done'
}) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex items-center gap-2">
        <span
          className={[
            'w-2 h-2 rounded-full flex-shrink-0',
            accent === 'pending' ? 'bg-brand animate-pulse' : 'bg-win',
          ].join(' ')}
        />
        <span className="text-sm font-bold text-ink">{title}</span>
        <span className="text-xs font-semibold text-ink-faint bg-card-sunken border border-hairline px-2 py-0.5 rounded-pill">
          {count}
        </span>
      </div>
      <div className="flex-1 h-px bg-hairline" />
    </div>
  )
}

// ── Phase / round filter ───────────────────────────────────────────

function FilterBar({
  phases,
  matches,
  selected,
  onSelect,
  selectedRound,
  onRoundSelect,
}: {
  phases: PhaseRow[]
  matches: MatchRow[]
  selected: string
  onSelect: (p: string) => void
  selectedRound: string
  onRoundSelect: (r: string) => void
}) {
  const availablePhases = useMemo(() => {
    const usedPhases = new Set(matches.map((m) => m.phase))
    return phases.filter((p) => usedPhases.has(p.phase))
  }, [phases, matches])

  const rounds = useMemo(() => {
    if (selected !== 'group_stage') return []
    const usedRounds = [...new Set(matches.filter((m) => m.phase === 'group_stage').map((m) => m.round).filter(Boolean))] as string[]
    return usedRounds.sort()
  }, [matches, selected])

  const pillBase = 'flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-pill border transition-colors duration-150'
  const pillActive = 'bg-ink text-card border-ink'
  const pillInactive = 'text-ink-soft border-hairline hover:border-ink-faint bg-card'

  return (
    <div className="space-y-2 mb-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => { onSelect('all'); onRoundSelect('all') }}
          className={`${pillBase} ${selected === 'all' ? pillActive : pillInactive}`}
        >
          Todas as fases
        </button>
        {availablePhases.map((p) => (
          <button
            key={p.phase}
            onClick={() => { onSelect(p.phase); onRoundSelect('all') }}
            className={`${pillBase} ${selected === p.phase ? pillActive : pillInactive}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {selected === 'group_stage' && rounds.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => onRoundSelect('all')}
            className={`${pillBase} ${selectedRound === 'all' ? pillActive : pillInactive}`}
          >
            Todas as rodadas
          </button>
          {rounds.map((r) => (
            <button
              key={r}
              onClick={() => onRoundSelect(r)}
              className={`${pillBase} ${selectedRound === r ? pillActive : pillInactive}`}
            >
              {ROUND_LABELS[r] ?? `Rodada ${r}`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main client component ──────────────────────────────────────────

type Props = {
  matches: MatchRow[]
  phases: PhaseRow[]
}

export function ResultadosClient({ matches, phases }: Props) {
  const [selectedPhase, setSelectedPhase] = useState('all')
  const [selectedRound, setSelectedRound] = useState('all')

  const filtered = useMemo(() => {
    let result = matches
    if (selectedPhase !== 'all') result = result.filter((m) => m.phase === selectedPhase)
    if (selectedPhase === 'group_stage' && selectedRound !== 'all') {
      result = result.filter((m) => m.round === selectedRound)
    }
    return result
  }, [matches, selectedPhase, selectedRound])

  const toLaunch = filtered.filter((m) => m.home_score === null)
  const launched = filtered.filter((m) => m.home_score !== null)

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
          Resultados
        </h1>
        <p className="text-ink-soft text-sm mt-1">Lançar e editar placares oficiais</p>
      </div>

      {/* Filter */}
      <FilterBar
        phases={phases}
        matches={matches}
        selected={selectedPhase}
        onSelect={setSelectedPhase}
        selectedRound={selectedRound}
        onRoundSelect={setSelectedRound}
      />

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-ink-faint text-sm">Nenhuma partida neste filtro.</p>
        </div>
      )}

      {/* A LANÇAR */}
      {toLaunch.length > 0 && (
        <section>
          <SectionHeader title="A Lançar" count={toLaunch.length} accent="pending" />
          <div className="flex flex-col gap-3">
            {toLaunch.map((m) => (
              <MatchResultCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* JÁ LANÇADAS */}
      {launched.length > 0 && (
        <section>
          <SectionHeader title="Encerradas" count={launched.length} accent="done" />
          <div className="flex flex-col gap-3">
            {launched.map((m) => (
              <MatchResultCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
