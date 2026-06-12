'use client'

import { formatDate, formatTime } from '@/lib/utils/datetime'
import type { NationalTeam } from '@/app/(app)/palpite/_components/types'

// Design tokens — inline for reliable html-to-image capture
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
  win:        '#1E7A4D',
}

export type ShareBet = {
  name: string
  home: number
  away: number
  points: number | null
}

type Props = {
  homeTeam:   NationalTeam | null
  awayTeam:   NationalTeam | null
  homeScore:  number | null
  awayScore:  number | null
  isFinished: boolean
  phaseLabel: string
  matchGroup: string | null
  round:      string | null
  matchDate:  string
  bets:       ShareBet[]
}

const ROUND_LABELS: Record<string, string> = {
  '1': '1ª Rodada', '2': '2ª Rodada', '3': '3ª Rodada',
}

function ptsColor(pts: number | null): string {
  if (pts === 15) return C.gold
  if (pts === 5)  return C.win
  return C.inkFaint
}

function Flag({ url, name, size }: { url: string | null; name: string; size: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        crossOrigin="anonymous"
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 4, flexShrink: 0,
      background: C.cardSunken, border: `1px solid ${C.hairline}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: C.inkSoft, letterSpacing: '0.04em',
    }}>
      {name.slice(0, 3).toUpperCase()}
    </div>
  )
}

export function MatchShareCard({
  homeTeam, awayTeam, homeScore, awayScore, isFinished,
  phaseLabel, matchGroup, round, matchDate, bets,
}: Props) {
  const metaParts: string[] = []
  if (matchGroup) metaParts.push(`Grupo ${matchGroup}`)
  if (round) metaParts.push(ROUND_LABELS[round] ?? `R${round}`)
  metaParts.push(phaseLabel)
  const meta = metaParts.join(' · ')

  const sorted = [...bets].sort((a, b) => {
    if (isFinished && a.points !== null && b.points !== null && a.points !== b.points) {
      return b.points - a.points
    }
    return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  })

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

      {/* ── Teams hero ─────────────────────────────────────────── */}
      <div style={{
        background: C.paper,
        padding: '28px 32px 22px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>

          {/* Home team */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Flag url={homeTeam?.emblem_url ?? null} name={homeTeam?.name ?? '?'} size={68} />
            <span style={{
              fontSize: 13, fontWeight: 600, color: C.ink,
              textAlign: 'center', lineHeight: 1.25, maxWidth: 120,
            }}>
              {homeTeam?.name ?? '–'}
            </span>
          </div>

          {/* Score / vs */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
            {isFinished ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 52, fontWeight: 800, color: C.ink, lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {homeScore}
                </span>
                <span style={{ fontSize: 26, color: C.inkFaint, fontWeight: 300, lineHeight: 1 }}>×</span>
                <span style={{
                  fontSize: 52, fontWeight: 800, color: C.ink, lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {awayScore}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 28, color: C.inkFaint, fontWeight: 300, lineHeight: 1 }}>×</span>
            )}
            {isFinished && (
              <span style={{ fontSize: 10, color: C.inkFaint, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Resultado final
              </span>
            )}
          </div>

          {/* Away team */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Flag url={awayTeam?.emblem_url ?? null} name={awayTeam?.name ?? '?'} size={68} />
            <span style={{
              fontSize: 13, fontWeight: 600, color: C.ink,
              textAlign: 'center', lineHeight: 1.25, maxWidth: 120,
            }}>
              {awayTeam?.name ?? '–'}
            </span>
          </div>
        </div>

        {/* Meta: phase + date */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{
            fontSize: 11, color: C.inkSoft, textTransform: 'uppercase',
            letterSpacing: '0.05em', fontWeight: 600,
          }}>
            {meta}
          </span>
          <span style={{ fontSize: 12, color: C.inkFaint }}>
            {formatDate(matchDate)} · {formatTime(matchDate)}
          </span>
        </div>
      </div>

      {/* ── Gold accent bar ────────────────────────────────────── */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.brand}, ${C.brand}55)` }} />

      {/* ── Bets section ───────────────────────────────────────── */}
      <div style={{ background: C.card }}>

        {/* Section header */}
        <div style={{
          padding: '14px 24px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${C.hairline}`,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.inkSoft,
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            Palpites
          </span>
          <span style={{ fontSize: 12, color: C.inkFaint }}>
            {bets.length} participante{bets.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Column headers */}
        <div style={{
          padding: '8px 24px',
          display: 'flex', alignItems: 'center',
          borderBottom: `1px solid ${C.hairline}`,
          background: C.cardSunken,
        }}>
          <span style={{ flex: 1, fontSize: 10, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Participante
          </span>
          <span style={{ width: 72, textAlign: 'center', fontSize: 10, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Palpite
          </span>
          {isFinished && (
            <span style={{ width: 64, textAlign: 'right', fontSize: 10, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Pontos
            </span>
          )}
        </div>

        {/* Bet rows */}
        {sorted.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: C.inkFaint, fontSize: 13 }}>
            Nenhum palpite registrado
          </div>
        ) : sorted.map((bet, i) => (
          <div
            key={i}
            style={{
              padding: '11px 24px',
              display: 'flex', alignItems: 'center',
              background: i % 2 === 0 ? C.card : 'rgba(239,238,232,.5)',
              borderBottom: i < sorted.length - 1 ? `1px solid ${C.hairline}` : 'none',
            }}
          >
            <span style={{
              flex: 1, fontSize: 14, fontWeight: 500, color: C.ink,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              paddingRight: 8,
            }}>
              {bet.name}
            </span>
            <span style={{
              width: 72, textAlign: 'center', fontSize: 15, fontWeight: 700,
              color: C.ink, fontVariantNumeric: 'tabular-nums', flexShrink: 0,
            }}>
              {bet.home}&nbsp;×&nbsp;{bet.away}
            </span>
            {isFinished && (
              <span style={{
                width: 64, textAlign: 'right', fontSize: 13, fontWeight: 700,
                color: ptsColor(bet.points), flexShrink: 0,
              }}>
                {bet.points !== null ? `${bet.points} pts` : '–'}
              </span>
            )}
          </div>
        ))}
      </div>

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
