'use client'

import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'

export type PodiumEntry = {
  user_id: string
  position: number | null
  total_points: number
  name: string
  avatar_url: string | null
}

type Props = { entries: PodiumEntry[] }

const SLOT_CONFIG = {
  1: {
    label: '1',
    labelColor: 'text-gold',
    stepH: 80,
    avatarSize: 68,
    cardStyle: {
      boxShadow: '0 2px 4px rgba(200,136,30,.10), 0 12px 32px rgba(200,136,30,.14)',
      borderColor: 'rgba(200,136,30,0.30)',
    },
    ptsBg: 'bg-brand/8',
    ptsColor: 'text-gold',
    stepBg: 'bg-gradient-to-b from-brand/15 to-brand/8',
    stepBorder: 'border-t-2 border-brand/30',
  },
  2: {
    label: '2',
    labelColor: 'text-silver',
    stepH: 56,
    avatarSize: 56,
    cardStyle: {
      boxShadow: '0 1px 2px rgba(20,18,25,.04), 0 8px 20px rgba(20,18,25,.06)',
      borderColor: '#E4E2DA',
    },
    ptsBg: 'bg-hairline/60',
    ptsColor: 'text-ink-soft',
    stepBg: 'bg-card-sunken',
    stepBorder: 'border-t border-hairline',
  },
  3: {
    label: '3',
    labelColor: 'text-bronze',
    stepH: 40,
    avatarSize: 52,
    cardStyle: {
      boxShadow: '0 1px 2px rgba(20,18,25,.04), 0 6px 16px rgba(20,18,25,.05)',
      borderColor: '#E4E2DA',
    },
    ptsBg: 'bg-hairline/60',
    ptsColor: 'text-ink-soft',
    stepBg: 'bg-card-sunken',
    stepBorder: 'border-t border-hairline',
  },
} as const

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.10, delayChildren: 0.05 },
  },
}

const slotVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 22,
    },
  },
}

function PodiumSlot({ entry, rank }: { entry: PodiumEntry; rank: 1 | 2 | 3 }) {
  const cfg = SLOT_CONFIG[rank]

  return (
    <motion.div variants={slotVariants} className="flex flex-1 flex-col items-center">
      {/* Card container */}
      <div
        className="w-full flex flex-col items-center rounded-card bg-card border px-2 pt-4 pb-0 overflow-hidden"
        style={cfg.cardStyle}
      >
        {/* Position badge */}
        <span
          className={`font-display text-xs font-semibold mb-3 ${cfg.labelColor}`}
          aria-label={`${cfg.label}º lugar`}
        >
          {cfg.label}º
        </span>

        {/* Avatar */}
        <Avatar name={entry.name} size={cfg.avatarSize} />

        {/* Name */}
        <p className="mt-2.5 w-full px-1 text-center text-xs font-medium text-ink truncate leading-tight">
          {entry.name}
        </p>

        {/* Points */}
        <div className={`mt-2 mb-3 px-3 py-1 rounded-pill ${cfg.ptsBg}`}>
          <span className={`font-display text-sm font-bold nums ${cfg.ptsColor}`}>
            {entry.total_points}
          </span>
          <span className="text-ink-faint text-xs ml-0.5">pts</span>
        </div>

        {/* Podium step */}
        <div
          className={`w-full ${cfg.stepBg} ${cfg.stepBorder}`}
          style={{ height: cfg.stepH }}
        />
      </div>
    </motion.div>
  )
}

export function Podium({ entries }: Props) {
  const [first, second, third] = entries
  if (!first) return null

  return (
    <div className="px-4 pt-6 pb-2">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex items-end justify-center gap-3"
      >
        {second ? <PodiumSlot entry={second} rank={2} /> : <div className="flex-1" />}
        <PodiumSlot entry={first} rank={1} />
        {third ? <PodiumSlot entry={third} rank={3} /> : <div className="flex-1" />}
      </motion.div>
    </div>
  )
}
