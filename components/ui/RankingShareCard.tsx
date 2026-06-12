'use client'

import type { RankingEntry } from '@/app/(app)/ranking/rankingUtils'

const C = {
  ink:        '#16151A',
  inkSoft:    '#5C5A63',
  inkFaint:   '#9A98A1',
  paper:      '#F6F5F1',
  card:       '#FFFFFF',
  cardSunken: '#EFEEE8',
  hairline:   '#E4E2DA',
  brand:      '#C8881E',
  gold:       '#C8881E',
  silver:     '#8E8E96',
  bronze:     '#B07A4B',
}

type Props = {
  entries:       RankingEntry[]
  currentUserId: string | null
}

function medalColor(pos: number): string {
  if (pos === 1) return C.gold
  if (pos === 2) return C.silver
  if (pos === 3) return C.bronze
  return C.inkFaint
}

function medalLabel(pos: number): string {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return String(pos)
}

function AvatarCircle({ name, size, color }: { name: string; size: number; color: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color,
    }}>
      {initials}
    </div>
  )
}

export function RankingShareCard({ entries, currentUserId }: Props) {
  const showPicanha = entries.length >= 4
  const picanhaIds = showPicanha
    ? new Set(entries.slice(-2).map(e => e.user_id))
    : new Set<string>()

  return (
    <div style={{
      width: 640,
      background: C.card,
      fontFamily: "'Geist', 'Inter', system-ui, -apple-system, sans-serif",
      overflow: 'hidden',
    }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        background: C.ink,
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, background: C.brand, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ color: C.card, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
            OusaBolão
          </span>
        </div>
        <span style={{ color: C.inkFaint, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Copa do Mundo 2026
        </span>
      </div>

      {/* ── Title bar ──────────────────────────────────────────── */}
      <div style={{
        background: C.paper,
        padding: '20px 24px 16px',
        borderBottom: `1px solid ${C.hairline}`,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
            Ranking
          </div>
          <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>
            {entries.length} participante{entries.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.silver }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.bronze }} />
        </div>
      </div>

      {/* ── Gold accent bar ────────────────────────────────────── */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.brand}, ${C.brand}55)` }} />

      {/* ── Column headers ─────────────────────────────────────── */}
      <div style={{
        padding: '8px 24px',
        display: 'flex', alignItems: 'center',
        background: C.cardSunken,
        borderBottom: `1px solid ${C.hairline}`,
      }}>
        <span style={{ width: 36, fontSize: 10, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Pos
        </span>
        <span style={{ flex: 1, fontSize: 10, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Participante
        </span>
        <span style={{ width: 56, textAlign: 'center', fontSize: 10, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Pts
        </span>
        <span style={{ width: 48, textAlign: 'right', fontSize: 10, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Exatos
        </span>
      </div>

      {/* ── Rows ───────────────────────────────────────────────── */}
      {entries.map((entry, i) => {
        const isMe = entry.user_id === currentUserId
        const isPicanha = picanhaIds.has(entry.user_id)
        const mColor = entry.position <= 3 ? medalColor(entry.position) : C.inkSoft
        const rowBg = isMe
          ? `rgba(200,136,30,.06)`
          : i % 2 === 0 ? C.card : 'rgba(239,238,232,.5)'

        return (
          <div
            key={entry.user_id}
            style={{
              padding: '10px 24px',
              display: 'flex', alignItems: 'center',
              background: rowBg,
              borderBottom: i < entries.length - 1 ? `1px solid ${C.hairline}` : 'none',
              borderLeft: isMe ? `3px solid ${C.brand}` : '3px solid transparent',
            }}
          >
            {/* Position */}
            <div style={{
              width: 36, fontSize: entry.position <= 3 ? 18 : 14,
              fontWeight: 700, color: mColor, flexShrink: 0,
              textAlign: 'left', lineHeight: 1,
            }}>
              {entry.position <= 3 ? medalLabel(entry.position) : `${entry.position}.`}
            </div>

            {/* Avatar + name */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <AvatarCircle name={entry.name} size={32} color={mColor} />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: isMe ? 700 : 500, color: C.ink,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {entry.name}
                  {isPicanha && (
                    <span style={{ marginLeft: 6, fontSize: 12 }}>🥩</span>
                  )}
                </div>
                {entry.position <= 3 && (
                  <div style={{ fontSize: 10, color: mColor, fontWeight: 600, marginTop: 1, letterSpacing: '0.03em' }}>
                    {entry.position === 1 ? '1º lugar' : entry.position === 2 ? '2º lugar' : '3º lugar'}
                  </div>
                )}
              </div>
            </div>

            {/* Points */}
            <div style={{
              width: 56, textAlign: 'center', fontSize: 16, fontWeight: 800,
              color: entry.position <= 3 ? mColor : C.ink,
              fontVariantNumeric: 'tabular-nums', flexShrink: 0,
            }}>
              {entry.total_points}
            </div>

            {/* Exact scores */}
            <div style={{
              width: 48, textAlign: 'right', fontSize: 12, fontWeight: 600,
              color: C.inkFaint, flexShrink: 0,
            }}>
              {entry.exact_scores} ✓
            </div>
          </div>
        )
      })}

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div style={{
        background: C.cardSunken,
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderTop: `1px solid ${C.hairline}`,
      }}>
        <span style={{ fontSize: 11, color: C.inkFaint, letterSpacing: '0.04em' }}>
          OusaBolão · Copa do Mundo 2026
        </span>
      </div>
    </div>
  )
}
