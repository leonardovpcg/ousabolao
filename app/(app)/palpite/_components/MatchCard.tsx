'use client'

import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, Lock, CheckCircle2, Users, Share2, Loader2 } from 'lucide-react'
import { upsertBet } from '../actions'
import { Countdown } from './Countdown'
import type { MatchData, OtherBet } from './types'
import { formatTime } from '@/lib/utils/datetime'
import { MatchShareCard } from '@/components/ui/MatchShareCard'

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

// ── Others' bets list (accordion) ────────────────────────────────

function BetAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <div className="w-6 h-6 rounded-full bg-card-sunken border border-hairline flex items-center justify-center flex-shrink-0">
      <span className="text-[9px] font-bold text-ink-soft leading-none">{initials}</span>
    </div>
  )
}

function OtherBetsList({
  bets,
  isFinished,
  forceOpen = false,
}: {
  bets: OtherBet[]
  isFinished: boolean
  forceOpen?: boolean
}) {
  const [open, setOpen] = useState(false)
  const isOpen = open || forceOpen

  if (bets.length === 0) return null

  const sorted = [...bets].sort((a, b) =>
    (a.user_name ?? '').localeCompare(b.user_name ?? '', 'pt-BR', { sensitivity: 'base' }),
  )

  const label = isFinished ? 'Palpites dos parças' : 'Palpites revelados'

  return (
    <div className="mt-3 border-t border-hairline">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-2.5 text-left group"
      >
        <div className="flex items-center gap-1.5">
          <Users size={11} strokeWidth={2} className="text-ink-faint group-hover:text-ink-soft transition-colors" />
          <span className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider group-hover:text-ink-soft transition-colors">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-bold text-ink-soft tabular-nums bg-card-sunken border border-hairline px-2 py-0.5 rounded-pill leading-none">
            {bets.length}
          </span>
          {isOpen
            ? <ChevronUp size={13} strokeWidth={2.5} className="text-ink-faint" />
            : <ChevronDown size={13} strokeWidth={2.5} className="text-ink-faint" />
          }
        </div>
      </button>

      {isOpen && (
        <div className="rounded-xl border border-hairline overflow-hidden mb-1">
          {sorted.map((b, i) => (
            <div
              key={b.user_id}
              className={[
                'flex items-center gap-2.5 px-3 py-2',
                i !== sorted.length - 1 ? 'border-b border-hairline' : '',
              ].join(' ')}
            >
              <BetAvatar name={b.user_name ?? 'P'} />
              <span className="text-xs font-medium text-ink truncate flex-1">
                {b.user_name ?? 'Participante'}
              </span>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className="font-display text-sm font-bold text-ink nums">
                  {b.home_prediction} × {b.away_prediction}
                </span>
                {isFinished && b.points !== null && (
                  <span className={`text-xs font-bold min-w-[36px] text-right ${POINTS_COLOR[b.points] ?? 'text-ink-faint'}`}>
                    {b.points} pts
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Card header ──────────────────────────────────────────────────

function CardHeader({ match }: { match: MatchData }) {
  const sub = subLabel(match)
  return (
    <div className="flex items-center justify-between mb-3">
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
  currentUserName: string
}

type CardMode = 'upcoming' | 'open' | 'locked' | 'finished'

function getInitialMode(match: MatchData): CardMode {
  if (match.status === 'finished' && match.home_score !== null) return 'finished'
  if (!match.phase_is_open || match.deadline_utc === null) return 'upcoming'
  if (Date.now() >= new Date(match.deadline_utc).getTime()) return 'locked'
  return 'open'
}

export function MatchCard({ match, canBet, currentUserName }: Props) {
  const [mode, setMode] = useState<CardMode>(() => getInitialMode(match))
  const [home, setHome] = useState(match.my_bet?.home_prediction ?? 0)
  const [away, setAway] = useState(match.my_bet?.away_prediction ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [savedPrediction, setSavedPrediction] = useState<{ h: number; a: number } | null>(
    match.my_bet ? { h: match.my_bet.home_prediction, a: match.my_bet.away_prediction } : null,
  )
  const [justSaved, setJustSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const [imgLoading, setImgLoading] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  const handleExpire = useCallback(() => setMode('locked'), [])

  const imgFilename = `${(match.home_team?.name ?? 'time1')}-x-${(match.away_team?.name ?? 'time2')}.png`
    .toLowerCase().replace(/\s+/g, '-')

  // Merge my_bet + other_bets into a single flat list for the share card
  const shareBets = useMemo(() => {
    const myEntry = match.my_bet
      ? [{ name: currentUserName, home: match.my_bet.home_prediction, away: match.my_bet.away_prediction, points: match.my_bet.points }]
      : []
    const others = match.other_bets.map(b => ({
      name: b.user_name ?? 'Participante',
      home: b.home_prediction,
      away: b.away_prediction,
      points: b.points,
    }))
    return [...myEntry, ...others]
  }, [match.my_bet, match.other_bets, currentUserName])

  const handleShare = useCallback(async () => {
    if (!shareCardRef.current || imgLoading) return
    setImgLoading(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(shareCardRef.current, { pixelRatio: 2 })
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], imgFilename, { type: 'image/png' })
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'OusaBolão' })
      } else {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = imgFilename
        a.click()
      }
    } catch (e) {
      console.error('Erro ao compartilhar imagem:', e)
    } finally {
      setImgLoading(false)
    }
  }, [imgLoading, imgFilename])

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
      <>
        {/* Off-screen share card — captured by handleShare */}
        <div
          ref={shareCardRef}
          aria-hidden="true"
          style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}
        >
          <MatchShareCard
            homeTeam={match.home_team}
            awayTeam={match.away_team}
            homeScore={match.home_score}
            awayScore={match.away_score}
            isFinished
            phaseLabel={match.phase_label}
            matchGroup={match.match_group}
            round={match.round}
            matchDate={match.match_date}
            bets={shareBets}
          />
        </div>

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

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleShare}
              disabled={imgLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-hairline bg-card text-ink-faint text-[11px] font-semibold hover:text-ink hover:border-ink-faint active:scale-[.98] transition-all disabled:opacity-40"
              title="Compartilhar palpites"
            >
              {imgLoading
                ? <Loader2 size={12} className="animate-spin" />
                : <Share2 size={12} strokeWidth={2} />
              }
              Compartilhar
            </button>
          </div>
        </div>
      </>
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
      <>
        {/* Off-screen share card — captured by handleShare */}
        <div
          ref={shareCardRef}
          aria-hidden="true"
          style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}
        >
          <MatchShareCard
            homeTeam={match.home_team}
            awayTeam={match.away_team}
            homeScore={match.home_score}
            awayScore={match.away_score}
            isFinished={false}
            phaseLabel={match.phase_label}
            matchGroup={match.match_group}
            round={match.round}
            matchDate={match.match_date}
            bets={shareBets}
          />
        </div>

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

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleShare}
              disabled={imgLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-hairline bg-card text-ink-faint text-[11px] font-semibold hover:text-ink hover:border-ink-faint active:scale-[.98] transition-all disabled:opacity-40"
              title="Compartilhar palpites"
            >
              {imgLoading
                ? <Loader2 size={12} className="animate-spin" />
                : <Share2 size={12} strokeWidth={2} />
              }
              Compartilhar
            </button>
          </div>
        </div>
      </>
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
