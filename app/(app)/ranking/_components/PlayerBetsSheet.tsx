'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { fetchPlayerBets, type BetDetail } from '../actions'
import type { RankingEntry } from '../rankingUtils'
import { formatDate } from '@/lib/utils/datetime'

const PHASE_LABELS: Record<string, string> = {
  group_stage: 'Grupos',
  round_of_32: 'Oitavas',
  round_of_16: 'Oitavas',
  quarter_finals: 'Quartas',
  semi_finals: 'Semi',
  third_place: '3º Lugar',
  final: 'Final',
}

const ROUND_LABELS: Record<string, string> = {
  '1': 'R1',
  '2': 'R2',
  '3': 'R3',
}

function TeamFlag({ url, name, size = 26 }: { url: string | null; name: string; size?: number }) {
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
      <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-bold text-gold bg-gold/10 border border-gold/25 leading-none whitespace-nowrap">
        +15 pts
      </span>
    )
  }
  if (p === 5) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-bold text-win bg-win/10 border border-win/25 leading-none whitespace-nowrap">
        +5 pts
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-medium text-ink-faint bg-card-sunken border border-hairline leading-none whitespace-nowrap">
      0 pts
    </span>
  )
}

function BetRow({ bet }: { bet: BetDetail }) {
  const m = bet.match
  if (!m) return null

  const phase = PHASE_LABELS[m.phase ?? ''] ?? m.phase ?? ''
  const round = m.phase === 'group_stage' && m.round ? ROUND_LABELS[m.round] ?? '' : ''
  const group = m.match_group ? `G${m.match_group}` : ''
  const meta = [phase, group, round].filter(Boolean).join(' · ')
  const dateLabel = m.match_date ? formatDate(m.match_date) : ''

  const isExact =
    m.home_score !== null &&
    m.away_score !== null &&
    bet.home_prediction === m.home_score &&
    bet.away_prediction === m.away_score

  return (
    <div className="px-5 py-3 border-b border-hairline last:border-0">
      {/* Row 1: flags + score + prediction + points */}
      <div className="flex items-center gap-2">
        <TeamFlag url={m.home_nt?.emblem_url ?? null} name={m.home_nt?.name ?? '?'} size={26} />

        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="font-display text-2xl font-bold text-ink nums leading-none">
            {m.home_score ?? '–'}
          </span>
          <span className="text-ink-faint text-base font-light leading-none">×</span>
          <span className="font-display text-2xl font-bold text-ink nums leading-none">
            {m.away_score ?? '–'}
          </span>
        </div>

        <TeamFlag url={m.away_nt?.emblem_url ?? null} name={m.away_nt?.name ?? '?'} size={26} />

        <div className="flex-1" />

        <span className="text-[11px] text-ink-faint flex-shrink-0">Palpite:</span>
        <span
          className={[
            'font-display text-sm font-bold nums flex-shrink-0',
            isExact ? 'text-gold' : 'text-ink-soft',
          ].join(' ')}
        >
          {bet.home_prediction}×{bet.away_prediction}
        </span>

        <PointsBadge points={bet.points} />
      </div>

      {/* Row 2: team names + meta */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px] text-ink-faint truncate flex-1 min-w-0">
          {m.home_nt?.name ?? '–'} × {m.away_nt?.name ?? '–'}
        </span>
        <span className="text-[10px] text-ink-faint/70 flex-shrink-0 ml-2">
          {meta}{dateLabel ? ` · ${dateLabel}` : ''}
        </span>
      </div>
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

  useEffect(() => {
    if (!entry) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entry, onClose])

  const miss = bets.filter((b) => (b.points ?? 0) === 0).length

  return (
    <AnimatePresence>
      {entry && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Centered card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className={[
              'fixed z-50 bg-card border border-hairline rounded-card',
              'flex flex-col overflow-hidden',
              // Mobile: 16px from all edges
              'inset-4',
              // Desktop: max-width centered dialog
              'lg:inset-auto lg:left-1/2 lg:top-1/2',
              'lg:-translate-x-1/2 lg:-translate-y-1/2',
              'lg:w-full lg:max-w-md lg:max-h-[85vh]',
            ].join(' ')}
            style={{ boxShadow: '0 2px 4px rgba(20,18,25,.06), 0 16px 48px rgba(20,18,25,.16)' }}
          >
            {/* Fixed header — never scrolls */}
            <div className="flex-shrink-0 px-5 pt-4">
              {/* Close button */}
              <div className="flex justify-end mb-3">
                <button
                  onClick={onClose}
                  className="rounded-pill p-1.5 text-ink-faint hover:bg-hairline hover:text-ink transition-colors"
                  aria-label="Fechar"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              {/* Player info */}
              <div className="flex items-center gap-3 pb-3 border-b border-hairline">
                <Avatar name={entry.name} imageUrl={entry.avatar_url} size={44} />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">
                    {entry.position}º lugar
                  </span>
                  <p className="font-display text-lg font-bold text-ink leading-tight truncate">
                    {entry.name}
                  </p>
                  <p className="text-xs text-ink-faint mt-0.5">
                    {bets.length} {bets.length === 1 ? 'jogo apostado' : 'jogos apostados'}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="font-display text-3xl font-bold text-ink nums leading-none">
                    {entry.total_points}
                  </span>
                  <span className="text-ink-faint text-sm ml-0.5">pts</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center py-2.5 border-b border-hairline">
                <div className="flex-1 text-center">
                  <span className="font-display text-xl font-bold text-ink nums">{entry.exact_scores}</span>
                  <span className="block text-[10px] text-ink-faint uppercase tracking-wide font-medium mt-0.5">Exatos</span>
                </div>
                <div className="w-px bg-hairline self-stretch" />
                <div className="flex-1 text-center">
                  <span className="font-display text-xl font-bold text-ink nums">{entry.correct_results}</span>
                  <span className="block text-[10px] text-ink-faint uppercase tracking-wide font-medium mt-0.5">Certos</span>
                </div>
                <div className="w-px bg-hairline self-stretch" />
                <div className="flex-1 text-center">
                  <span className="font-display text-xl font-bold text-ink nums">{miss}</span>
                  <span className="block text-[10px] text-ink-faint uppercase tracking-wide font-medium mt-0.5">Erros</span>
                </div>
              </div>
            </div>

            {/* Scrollable bets list */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="py-8 flex flex-col items-center gap-3">
                  <div className="w-7 h-7 rounded-full border-2 border-hairline border-t-brand animate-spin" />
                  <span className="text-xs text-ink-faint">Carregando palpites…</span>
                </div>
              ) : bets.length === 0 ? (
                <div className="py-8 text-center px-5">
                  <p className="text-sm text-ink-faint">Nenhum resultado lançado ainda.</p>
                </div>
              ) : (
                <div className="pb-4">
                  {bets.map((bet) => (
                    <BetRow key={bet.id} bet={bet} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
