'use client'

import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { RankingEntry } from './RankingClient'

type Props = {
  entries: RankingEntry[]
  currentUserId: string | null
  onSelect: (entry: RankingEntry) => void
}

const MEDAL = {
  1: {
    ordinal: '1º',
    labelClass: 'text-gold',
    ring: 'linear-gradient(145deg, #E8C45A 0%, #C8881E 55%, #E8C45A 100%)',
    ringSize: 4,
    avatarSize: 72,
    stepH: 88,
    stepBg: 'rgba(200,136,30,0.10)',
    stepBorder: '2px solid rgba(200,136,30,0.22)',
    ptsBg: 'rgba(200,136,30,0.08)',
    ptsClass: 'text-gold',
    cardShadow: '0 2px 4px rgba(200,136,30,.12), 0 14px 40px rgba(200,136,30,.15)',
    cardBorder: 'rgba(200,136,30,0.26)',
    delay: 0.08,
  },
  2: {
    ordinal: '2º',
    labelClass: 'text-silver',
    ring: 'linear-gradient(145deg, #C8C8D2 0%, #8E8E96 55%, #C8C8D2 100%)',
    ringSize: 3,
    avatarSize: 58,
    stepH: 62,
    stepBg: 'rgba(142,142,150,0.08)',
    stepBorder: '1px solid rgba(228,226,218,0.9)',
    ptsBg: 'rgba(228,226,218,0.70)',
    ptsClass: 'text-silver',
    cardShadow: '0 1px 2px rgba(20,18,25,.04), 0 8px 22px rgba(20,18,25,.07)',
    cardBorder: '#E4E2DA',
    delay: 0,
  },
  3: {
    ordinal: '3º',
    labelClass: 'text-bronze',
    ring: 'linear-gradient(145deg, #C89A6B 0%, #B07A4B 55%, #C89A6B 100%)',
    ringSize: 3,
    avatarSize: 52,
    stepH: 44,
    stepBg: 'rgba(176,122,75,0.07)',
    stepBorder: '1px solid rgba(228,226,218,0.9)',
    ptsBg: 'rgba(228,226,218,0.70)',
    ptsClass: 'text-bronze',
    cardShadow: '0 1px 2px rgba(20,18,25,.03), 0 6px 16px rgba(20,18,25,.05)',
    cardBorder: '#E4E2DA',
    delay: 0.16,
  },
} as const

function PodiumSlot({
  entry,
  rank,
  isMe,
  onSelect,
}: {
  entry: RankingEntry
  rank: 1 | 2 | 3
  isMe: boolean
  onSelect: (entry: RankingEntry) => void
}) {
  const m = MEDAL[rank]

  return (
    <motion.div
      className="flex flex-1 flex-col items-center"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22, delay: m.delay }}
    >
      <button
        type="button"
        onClick={() => onSelect(entry)}
        className="w-full flex flex-col items-center rounded-card bg-card border overflow-hidden transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          boxShadow: isMe
            ? `${m.cardShadow}, 0 0 0 2px rgba(200,136,30,0.38)`
            : m.cardShadow,
          borderColor: isMe ? 'rgba(200,136,30,0.42)' : m.cardBorder,
        }}
      >
        <div className="flex flex-col items-center pt-4 pb-0 px-2 w-full">
          {rank === 1 && (
            <Crown
              size={13}
              className="text-brand mb-1"
              strokeWidth={1.5}
              fill="currentColor"
              fillOpacity={0.2}
            />
          )}

          <span className={`font-display text-[11px] font-bold mb-2.5 ${m.labelClass}`}>
            {m.ordinal}
          </span>

          {/* Medal ring */}
          <div
            className="rounded-full flex-shrink-0"
            style={{ padding: m.ringSize, background: m.ring }}
          >
            <div className="rounded-full overflow-hidden bg-card">
              <Avatar name={entry.name} imageUrl={entry.avatar_url} size={m.avatarSize} />
            </div>
          </div>

          {/* Name */}
          <p className="mt-2.5 w-full px-1.5 text-center text-[11px] font-semibold text-ink truncate leading-tight">
            {entry.name}
          </p>
          {isMe && (
            <p className="text-[9px] font-medium text-brand mt-0.5">você</p>
          )}

          {/* Points */}
          <div
            className="mt-2 mb-3 px-2.5 py-1 rounded-pill"
            style={{ background: m.ptsBg }}
          >
            <span className={`font-display text-sm font-bold nums ${m.ptsClass}`}>
              {entry.total_points}
            </span>
            <span className="text-ink-faint text-[10px] ml-0.5">pts</span>
          </div>
        </div>

        {/* Step */}
        <div
          className="w-full"
          style={{
            height: m.stepH,
            background: m.stepBg,
            borderTop: m.stepBorder,
          }}
        />
      </button>
    </motion.div>
  )
}

export function Podium({ entries, currentUserId, onSelect }: Props) {
  const [first, second, third] = entries
  if (!first) return null

  return (
    <div className="pt-4 pb-3">
      <div className="flex items-end justify-center gap-2.5">
        {second ? (
          <PodiumSlot entry={second} rank={2} isMe={second.user_id === currentUserId} onSelect={onSelect} />
        ) : (
          <div className="flex-1" />
        )}
        <PodiumSlot entry={first} rank={1} isMe={first.user_id === currentUserId} onSelect={onSelect} />
        {third ? (
          <PodiumSlot entry={third} rank={3} isMe={third.user_id === currentUserId} onSelect={onSelect} />
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  )
}
