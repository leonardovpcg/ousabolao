'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { RankingEntry } from './RankingClient'

type Props = {
  entries: RankingEntry[]
  currentUserId: string | null
  picanhaUserIds: Set<string>
  showPicanha: boolean
  onSelect: (entry: RankingEntry) => void
}

function RankRow({
  entry,
  isMe,
  isPicanha,
  onSelect,
}: {
  entry: RankingEntry
  isMe: boolean
  isPicanha: boolean
  onSelect: (entry: RankingEntry) => void
}) {
  return (
    <motion.li
      layout
      layoutId={`rank-${entry.user_id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <button
        type="button"
        onClick={() => onSelect(entry)}
        className={[
          'relative w-full flex items-center gap-3 rounded-card bg-card border px-4 py-3.5',
          'transition-all duration-150 text-left',
          'hover:scale-[1.01] hover:card-shadow active:scale-[0.99]',
          isMe
            ? 'border-brand/40 card-shadow-sm'
            : isPicanha
            ? 'border-bronze/25 card-shadow-sm'
            : 'border-hairline card-shadow-sm',
        ].join(' ')}
      >
        {/* Left accent */}
        {isMe && (
          <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-brand" />
        )}
        {isPicanha && !isMe && (
          <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-bronze/50" />
        )}

        {/* Position */}
        <span
          className={[
            'font-display w-7 flex-shrink-0 text-center leading-none nums',
            isMe
              ? 'text-brand font-bold text-base'
              : isPicanha
              ? 'text-bronze font-semibold text-sm'
              : 'text-ink-faint font-medium text-sm',
          ].join(' ')}
        >
          {entry.position}
        </span>

        {/* Avatar */}
        <Avatar name={entry.name} imageUrl={entry.avatar_url} size={36} />

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p
            className={[
              'truncate text-sm leading-tight',
              isMe || isPicanha ? 'font-semibold text-ink' : 'font-medium text-ink',
            ].join(' ')}
          >
            {entry.name}
          </p>
          {isMe && (
            <p className="text-[11px] text-brand font-medium mt-0.5">você</p>
          )}
        </div>

        {/* Points */}
        <div className="flex-shrink-0 text-right">
          <p className="leading-none">
            <span
              className={[
                'font-display font-bold nums text-base',
                isMe ? 'text-brand' : 'text-ink',
              ].join(' ')}
            >
              {entry.total_points}
            </span>
            <span className="text-ink-faint text-xs ml-0.5">pts</span>
          </p>
          <p className="text-[11px] text-ink-faint mt-0.5">
            {entry.exact_scores} exatos
          </p>
        </div>
      </button>
    </motion.li>
  )
}

export function RankList({ entries, currentUserId, picanhaUserIds, showPicanha, onSelect }: Props) {
  const regularEntries = entries.filter((e) => !picanhaUserIds.has(e.user_id))
  const picanhaEntries = entries.filter((e) => picanhaUserIds.has(e.user_id))

  return (
    <div className="mt-4">
      <AnimatePresence mode="popLayout">
        {regularEntries.length > 0 && (
          <motion.ul
            key="regular-list"
            layout
            className="flex flex-col gap-2"
            aria-label="Classificação"
          >
            {regularEntries.map((entry) => (
              <RankRow
                key={entry.user_id}
                entry={entry}
                isMe={entry.user_id === currentUserId}
                isPicanha={false}
                onSelect={onSelect}
              />
            ))}
          </motion.ul>
        )}

        {showPicanha && picanhaEntries.length > 0 && (
          <motion.div
            key="picanha-zone"
            layout
            className="mt-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {/* Section divider */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-hairline" />
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill border"
                style={{
                  background: 'rgba(176,122,75,0.06)',
                  borderColor: 'rgba(176,122,75,0.22)',
                }}
              >
                <Flame size={13} className="text-bronze" strokeWidth={1.5} />
                <span className="text-[11px] font-bold text-bronze tracking-wider uppercase">
                  Zona da Picanha
                </span>
              </div>
              <div className="flex-1 h-px bg-hairline" />
            </div>
            <p className="text-center text-[12px] text-ink-faint mb-3 leading-relaxed">
              Os 2 últimos pagam o Ousa Churras
            </p>

            <ul className="flex flex-col gap-2" aria-label="Zona da Picanha">
              {picanhaEntries.map((entry) => (
                <RankRow
                  key={entry.user_id}
                  entry={entry}
                  isMe={entry.user_id === currentUserId}
                  isPicanha={true}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
