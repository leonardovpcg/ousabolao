'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { fetchPlayerBets, type BetDetail } from '../actions'
import type { RankingEntry } from '../rankingUtils'
import { formatDate } from '@/lib/utils/datetime'

const PHASE_LABELS: Record<string, string> = {
  group_stage: 'Fase de Grupos',
  round_of_32: 'Oitavas',
  round_of_16: 'Oitavas',
  quarter_finals: 'Quartas',
  semi_finals: 'Semifinal',
  third_place: '3º Lugar',
  final: 'Final',
}

const ROUND_LABELS: Record<string, string> = {
  '1': '1ª Rodada',
  '2': '2ª Rodada',
  '3': '3ª Rodada',
}

function TeamFlag({ url, name, size = 28 }: { url: string | null; name: string; size?: number }) {
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
  return (
    <div
      className="rounded-sm bg-card-sunken border border-hairline flex items-center justify-center font-bold text-ink-soft flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {name.slice(0, 3).toUpperCase()}
    </div>
  )
}

function PointsBadge({ points }: { points: number | null }) {
  const p = points ?? 0
  if (p === 15) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-pill text-[11px] font-bold text-gold bg-gold/10 border border-gold/25 leading-none">
        +15 pts
      </span>
    )
  }
  if (p === 5) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-pill text-[11px] font-bold text-win bg-win/10 border border-win/25 leading-none">
        +5 pts
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-pill text-[11px] font-medium text-ink-faint bg-card-sunken border border-hairline leading-none">
      0 pts
    </span>
  )
}

function BetRow({ bet }: { bet: BetDetail }) {
  const m = bet.match
  if (!m) return null

  const phase = PHASE_LABELS[m.phase ?? ''] ?? m.phase ?? ''
  const round = m.phase === 'group_stage' && m.round ? ROUND_LABELS[m.round] ?? '' : ''
  const group = m.match_group ? `Grupo ${m.match_group}` : ''
  const subLabel = [group, round].filter(Boolean).join(' · ')
  const dateLabel = m.match_date ? formatDate(m.match_date) : ''

  const isExact =
    m.home_score !== null &&
    m.away_score !== null &&
    bet.home_prediction === m.home_score &&
    bet.away_prediction === m.away_score

  return (
    <div className="px-5 py-3.5 border-b border-hairline last:border-0">
      {/* Top row: phase + date */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">{phase}</span>
          {subLabel && (
            <span className="text-[10px] text-ink-faint/70">· {subLabel}</span>
          )}
        </div>
        <span className="text-[10px] text-ink-faint">{dateLabel}</span>
      </div>

      {/* Teams + official score */}
      <div className="flex items-center gap-2 mb-2">
        {/* Home */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <TeamFlag url={m.home_nt?.emblem_url ?? null} name={m.home_nt?.name ?? '?'} size={24} />
          <span className="text-xs font-semibold text-ink truncate">{m.home_nt?.name ?? '–'}</span>
        </div>

        {/* Official score */}
        <div className="flex items-center gap-1.5 flex-shrink-0 px-1">
          <span className="font-display text-xl font-bold text-ink nums">{m.home_score ?? '–'}</span>
          <span className="text-ink-faint text-sm font-light">×</span>
          <span className="font-display text-xl font-bold text-ink nums">{m.away_score ?? '–'}</span>
        </div>

        {/* Away */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-xs font-semibold text-ink truncate text-right">{m.away_nt?.name ?? '–'}</span>
          <TeamFlag url={m.away_nt?.emblem_url ?? null} name={m.away_nt?.name ?? '?'} size={24} />
        </div>
      </div>

      {/* Prediction + points */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-ink-faint">Seu palpite:</span>
          <span
            className={[
              'font-display text-sm font-bold nums',
              isExact ? 'text-gold' : 'text-ink-soft',
            ].join(' ')}
          >
            {bet.home_prediction} × {bet.away_prediction}
          </span>
          {isExact && (
            <span className="text-[9px] font-bold text-gold uppercase tracking-wide">exato!</span>
          )}
        </div>
        <PointsBadge points={bet.points} />
      </div>
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1">
      <span className="font-display text-2xl font-bold text-ink nums leading-none">{value}</span>
      <span className="text-[10px] text-ink-faint font-medium uppercase tracking-wide leading-none mt-0.5">{label}</span>
    </div>
  )
}

type Props = {
  entry: RankingEntry | null
  onClose: () => void
}

export function PlayerBetsSheet({ entry, onClose }: Props) {
  const [bets, setBets] = useState<BetDetail[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!entry) { setBets([]); return }
    setLoading(true)
    fetchPlayerBets(entry.user_id).then((data) => {
      setBets(data)
      setLoading(false)
    })
  }, [entry?.user_id])

  const totalPoints = bets.reduce((sum, b) => sum + (b.points ?? 0), 0)
  const exact = bets.filter((b) => b.points === 15).length
  const correct = bets.filter((b) => b.points === 5).length
  const miss = bets.filter((b) => (b.points ?? 0) === 0).length

  return (
    <Modal open={!!entry} onClose={onClose} title="">
      {entry && (
        <div className="-mt-3">
          {/* Player header */}
          <div className="flex items-center gap-4 pb-4 border-b border-hairline">
            <div
              className="rounded-full flex-shrink-0"
              style={{
                padding: 3,
                background: 'linear-gradient(145deg, #E4E2DA 0%, #C8C8D2 100%)',
              }}
            >
              <div className="rounded-full overflow-hidden bg-card">
                <Avatar name={entry.name} imageUrl={entry.avatar_url} size={56} />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-ink-faint uppercase tracking-wider">
                  {entry.position}º
                </span>
              </div>
              <p className="font-display text-xl font-bold text-ink leading-tight truncate">{entry.name}</p>
              <p className="text-xs text-ink-faint mt-0.5">{bets.length} jogos apostados</p>
            </div>
            <div className="ml-auto flex-shrink-0 text-right">
              <span className="font-display text-3xl font-bold text-ink nums leading-none">
                {entry.total_points}
              </span>
              <span className="text-ink-faint text-sm ml-1">pts</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-stretch gap-0 py-4 border-b border-hairline">
            <StatChip label="Exatos" value={entry.exact_scores} />
            <div className="w-px bg-hairline" />
            <StatChip label="Certos" value={entry.correct_results} />
            <div className="w-px bg-hairline" />
            <StatChip label="Erros" value={miss} />
          </div>

          {/* Bets list */}
          {loading ? (
            <div className="py-10 flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-hairline border-t-brand animate-spin" />
              <span className="text-xs text-ink-faint">Carregando palpites…</span>
            </div>
          ) : bets.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-ink-faint">Nenhum resultado lançado ainda.</p>
            </div>
          ) : (
            <div className="mt-1 -mx-5">
              {bets.map((bet) => (
                <BetRow key={bet.id} bet={bet} />
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
