'use client'

import { useCallback, useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, Lock, CheckCircle2 } from 'lucide-react'
import { upsertBet } from '../actions'
import { Countdown } from './Countdown'
import type { MatchData, OtherBet } from './types'
import { formatTime } from '@/lib/utils/datetime'

// ── Helpers ──────────────────────────────────────────────────────

const ROUND_LABELS: Record<string, string> = { '1': '1ª Rodada', '2': '2ª Rodada', '3': '3ª Rodada' }
const POINTS_COLOR: Record<number, string> = {
  15: 'text-gold font-bold',
  5: 'text-win font-semibold',
  0: 'text-ink-faint',
}

function subLabel(match: MatchData): string {
  const parts: string[] = []
  if (match.match_group) parts.push(`Grupo ${match.match_group}`)
  if (match.phase === 'group_stage' && match.round) parts.push(ROUND_LABELS[match.round] ?? `R${match.round}`)
  return parts.join(' · ')
}

// ── Team Flag ────────────────────────────────────────────────────

function TeamFlag({
  url,
  name,
  size = 44,
}: {
  url: string | null
  name: string
  size?: number
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="object-contain rounded-sm flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  const abbr = name.slice(0, 3).toUpperCase()
  return (
    <div
      className="rounded-sm bg-card-sunken border border-hairline flex items-center justify-center text-[10px] font-bold text-ink-soft flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {abbr}
    </div>
  )
}

// ── Stepper ──────────────────────────────────────────────────────

function Stepper({
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
  function clamp(n: number) {
    return Math.max(0, Math.min(99, n))
  }

  return (
    <div className="flex flex-col items-center select-none" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled}
        className="w-10 h-9 flex items-center justify-center text-ink-soft hover:text-ink disabled:opacity-25 transition-colors active:scale-90"
        aria-label={`Aumentar ${label}`}
      >
        <ChevronUp size={18} strokeWidth={2} />
      </button>

      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          if (!isNaN(n)) onChange(clamp(n))
        }}
        disabled={disabled}
        className={[
          'w-14 h-14 text-center font-display text-4xl font-bold text-ink nums',
          'bg-transparent border-0 p-0 focus:outline-none appearance-none',
          '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          disabled ? 'opacity-40' : '',
        ].join(' ')}
        aria-label={label}
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value === 0}
        className="w-10 h-9 flex items-center justify-center text-ink-soft hover:text-ink disabled:opacity-25 transition-colors active:scale-90"
        aria-label={`Diminuir ${label}`}
      >
        <ChevronDown size={18} strokeWidth={2} />
      </button>
    </div>
  )
}

// ── Others' bets list ────────────────────────────────────────────

function OtherBetsList({
  bets,
  isFinished,
}: {
  bets: OtherBet[]
  isFinished: boolean
}) {
  if (bets.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-hairline">
      <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider mb-2.5">
        {isFinished ? 'Palpites dos parças' : 'Palpites revelados'}
      </p>
      <div className="flex flex-col gap-1.5">
        {bets.map((b) => (
          <div key={b.user_id} className="flex items-center justify-between gap-2">
            <span className="text-xs text-ink-soft truncate flex-1">
              {b.user_name ?? 'Participante'}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-display text-sm font-semibold text-ink nums">
                {b.home_prediction} × {b.away_prediction}
              </span>
              {isFinished && b.points !== null && (
                <span className={`text-xs min-w-[40px] text-right ${POINTS_COLOR[b.points] ?? 'text-ink-faint'}`}>
                  {b.points} pts
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card header ──────────────────────────────────────────────────

function CardHeader({ match }: { match: MatchData }) {
  const sub = subLabel(match)
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2 min-w-0">
        {sub && (
          <span className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider truncate">
            {sub} · {match.phase_label}
          </span>
        )}
        {!sub && (
          <span className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
            {match.phase_label}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-ink-soft flex-shrink-0 ml-3">
        {formatTime(match.match_date)}
      </span>
    </div>
  )
}

// ── Main MatchCard ───────────────────────────────────────────────

type Props = {
  match: MatchData
  canBet: boolean
}

type CardMode = 'upcoming' | 'open' | 'locked' | 'finished'

function getInitialMode(match: MatchData): CardMode {
  if (match.status === 'finished' && match.home_score !== null) return 'finished'
  if (!match.phase_is_open || match.deadline_utc === null) return 'upcoming'
  if (Date.now() >= new Date(match.deadline_utc).getTime()) return 'locked'
  return 'open'
}

export function MatchCard({ match, canBet }: Props) {
  const [mode, setMode] = useState<CardMode>(() => getInitialMode(match))
  const [home, setHome] = useState(match.my_bet?.home_prediction ?? 0)
  const [away, setAway] = useState(match.my_bet?.away_prediction ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [savedPrediction, setSavedPrediction] = useState<{ h: number; a: number } | null>(
    match.my_bet ? { h: match.my_bet.home_prediction, a: match.my_bet.away_prediction } : null,
  )
  const [justSaved, setJustSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleExpire = useCallback(() => setMode('locked'), [])

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await upsertBet(match.id, home, away)
      if (!result || 'error' in result) {
        setError(result?.error ?? 'Erro ao salvar. Tente novamente.')
      } else {
        setSavedPrediction({ h: home, a: away })
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 2500)
      }
    })
  }

  const homeTeam = match.home_team
  const awayTeam = match.away_team

  // ── FINISHED state ──────────────────────────────────────────────
  if (mode === 'finished') {
    const myPoints = match.my_bet?.points ?? null
    const myPts = myPoints !== null ? myPoints : null

    return (
      <div
        className="rounded-card bg-card border border-hairline card-shadow-sm p-4 lg:p-5"
        role="article"
      >
        <CardHeader match={match} />

        {/* Official result */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <TeamFlag url={homeTeam?.emblem_url ?? null} name={homeTeam?.name ?? '?'} size={44} />
            <span className="text-xs font-semibold text-ink text-center leading-tight">
              {homeTeam?.name ?? '–'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-2">
            <span className="font-display text-4xl font-bold text-ink nums">
              {match.home_score}
            </span>
            <span className="text-ink-faint text-lg font-light">×</span>
            <span className="font-display text-4xl font-bold text-ink nums">
              {match.away_score}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center gap-2">
            <TeamFlag url={awayTeam?.emblem_url ?? null} name={awayTeam?.name ?? '?'} size={44} />
            <span className="text-xs font-semibold text-ink text-center leading-tight">
              {awayTeam?.name ?? '–'}
            </span>
          </div>
        </div>

        {/* My bet + points */}
        {match.my_bet && (
          <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-card-sunken border border-hairline">
            <span className="text-xs text-ink-soft font-medium">Seu palpite</span>
            <div className="flex items-center gap-3">
              <span className="font-display text-sm font-bold text-ink nums">
                {match.my_bet.home_prediction} × {match.my_bet.away_prediction}
              </span>
              {myPts !== null && (
                <span className={`text-sm ${POINTS_COLOR[myPts] ?? 'text-ink-faint'}`}>
                  {myPts === 15 ? '15 pts' : myPts === 5 ? '5 pts' : '0 pts'}
                </span>
              )}
            </div>
          </div>
        )}

        <OtherBetsList bets={match.other_bets} isFinished />
      </div>
    )
  }

  // ── UPCOMING state ──────────────────────────────────────────────
  if (mode === 'upcoming') {
    return (
      <div className="rounded-card bg-card border border-hairline card-shadow-sm p-4 lg:p-5 opacity-70">
        <CardHeader match={match} />
        <div className="flex items-center gap-3">
          <div className="flex-1 flex flex-col items-center gap-2">
            <TeamFlag url={homeTeam?.emblem_url ?? null} name={homeTeam?.name ?? '?'} size={40} />
            <span className="text-xs font-semibold text-ink text-center leading-tight">
              {homeTeam?.name ?? '–'}
            </span>
          </div>
          <span className="text-ink-faint text-sm font-medium px-2">×</span>
          <div className="flex-1 flex flex-col items-center gap-2">
            <TeamFlag url={awayTeam?.emblem_url ?? null} name={awayTeam?.name ?? '?'} size={40} />
            <span className="text-xs font-semibold text-ink text-center leading-tight">
              {awayTeam?.name ?? '–'}
            </span>
          </div>
        </div>
        <p className="text-center text-xs text-ink-faint mt-4">Palpites ainda não abertos</p>
      </div>
    )
  }

  // ── LOCKED state ────────────────────────────────────────────────
  if (mode === 'locked') {
    return (
      <div className="rounded-card bg-card border border-hairline card-shadow-sm p-4 lg:p-5">
        <CardHeader match={match} />

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <TeamFlag url={homeTeam?.emblem_url ?? null} name={homeTeam?.name ?? '?'} size={40} />
            <span className="text-xs font-semibold text-ink text-center leading-tight">
              {homeTeam?.name ?? '–'}
            </span>
          </div>
          <span className="text-ink-faint text-sm font-medium px-2">×</span>
          <div className="flex-1 flex flex-col items-center gap-2">
            <TeamFlag url={awayTeam?.emblem_url ?? null} name={awayTeam?.name ?? '?'} size={40} />
            <span className="text-xs font-semibold text-ink text-center leading-tight">
              {awayTeam?.name ?? '–'}
            </span>
          </div>
        </div>

        {/* My bet or no bet */}
        {savedPrediction || match.my_bet ? (
          <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-card-sunken border border-hairline mb-1">
            <span className="text-xs text-ink-soft font-medium">Seu palpite</span>
            <div className="flex items-center gap-2">
              <Lock size={11} className="text-ink-faint" />
              <span className="font-display text-sm font-bold text-ink nums">
                {savedPrediction?.h ?? match.my_bet?.home_prediction} ×{' '}
                {savedPrediction?.a ?? match.my_bet?.away_prediction}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-ink-faint py-1">Você não enviou palpite</p>
        )}

        <OtherBetsList bets={match.other_bets} isFinished={false} />
      </div>
    )
  }

  // ── OPEN state ──────────────────────────────────────────────────
  const isDisabled = !canBet || pending

  return (
    <div className="rounded-card bg-card border border-hairline card-shadow-sm p-4 lg:p-5">
      <CardHeader match={match} />

      {/* Steppers row — dimmed + non-interactive when payment pending */}
      <div className={!canBet ? 'opacity-50 pointer-events-none select-none' : ''}>
        <div className="flex items-center gap-2">
          {/* Home team */}
          <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <TeamFlag url={homeTeam?.emblem_url ?? null} name={homeTeam?.name ?? '?'} size={40} />
            <span className="text-[11px] font-semibold text-ink text-center leading-tight truncate w-full px-1">
              {homeTeam?.name ?? '–'}
            </span>
          </div>

          {/* Steppers */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Stepper
              value={home}
              onChange={setHome}
              disabled={isDisabled}
              label={`Gols ${homeTeam?.name ?? 'Mandante'}`}
            />
            <span className="text-ink-faint text-sm font-light px-0.5">×</span>
            <Stepper
              value={away}
              onChange={setAway}
              disabled={isDisabled}
              label={`Gols ${awayTeam?.name ?? 'Visitante'}`}
            />
          </div>

          {/* Away team */}
          <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <TeamFlag url={awayTeam?.emblem_url ?? null} name={awayTeam?.name ?? '?'} size={40} />
            <span className="text-[11px] font-semibold text-ink text-center leading-tight truncate w-full px-1">
              {awayTeam?.name ?? '–'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer row: countdown (always) + submit button OR lock badge */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {/* Left — countdown badge (visible to all, info sobre prazo) */}
        <div className="min-w-0">
          {match.deadline_utc && (
            <Countdown deadlineUtc={match.deadline_utc} onExpire={handleExpire} />
          )}
        </div>

        {/* Right — submit (paid) or lock badge (pending) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canBet ? (
            <>
              {justSaved && (
                <span className="flex items-center gap-1 text-win text-xs font-semibold">
                  <CheckCircle2 size={13} />
                  Salvo!
                </span>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={pending}
                className={[
                  'h-9 px-5 rounded-btn text-sm font-semibold transition-all duration-150',
                  'bg-ink text-card',
                  'hover:opacity-90 active:scale-[.98]',
                  'disabled:opacity-40',
                  pending ? 'cursor-wait' : '',
                ].join(' ')}
              >
                {pending ? 'Salvando…' : savedPrediction || match.my_bet ? 'Atualizar' : 'Enviar'}
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card-sunken border border-hairline">
              <Lock size={10} strokeWidth={2} className="text-ink-faint" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
                Bloqueado
              </span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-loss font-medium">{error}</p>
      )}
    </div>
  )
}
