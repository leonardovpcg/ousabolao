'use client'

import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'

export type RankEntry = {
  user_id: string
  position: number | null
  total_points: number
  exact_scores: number
  correct_results: number
  name: string
  avatar_url: string | null
}

type Props = {
  entries: RankEntry[]
  currentUserId: string | null
  startPosition: number
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 28,
    },
  },
}

export function RankList({ entries, currentUserId, startPosition }: Props) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-2 mt-4"
      aria-label="Classificação"
    >
      {entries.map((entry, idx) => {
        const isMe = entry.user_id === currentUserId
        const pos = entry.position ?? startPosition + idx

        return (
          <motion.li key={entry.user_id} variants={rowVariants}>
            <div
              className={[
                'relative flex items-center gap-3 rounded-card px-4 py-3.5 bg-card border',
                'transition-all duration-150',
                isMe
                  ? 'border-brand/40 card-shadow-sm'
                  : 'border-hairline card-shadow-sm hover:border-hairline/80',
              ].join(' ')}
            >
              {/* Brand left accent for current user */}
              {isMe && (
                <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-brand" />
              )}

              {/* Position — Fraunces editorial number */}
              <span
                className={[
                  'font-display w-7 flex-shrink-0 text-center leading-none',
                  isMe ? 'text-brand font-bold text-base' : 'text-ink-faint font-medium text-sm',
                ].join(' ')}
              >
                {pos}
              </span>

              {/* Avatar */}
              <Avatar name={entry.name} size={36} />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p
                  className={[
                    'truncate text-sm leading-tight',
                    isMe ? 'font-semibold text-ink' : 'font-medium text-ink',
                  ].join(' ')}
                >
                  {entry.name}
                </p>
                {isMe && (
                  <p className="text-xs text-ink-faint mt-0.5">você</p>
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
                <p className="text-xs text-ink-faint mt-0.5">
                  {entry.exact_scores} exatos
                </p>
              </div>
            </div>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}
