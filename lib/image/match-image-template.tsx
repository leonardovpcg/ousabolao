/**
 * Satori-compatible JSX template for per-match WhatsApp image.
 * Rules: inline styles only, flexbox only, no Tailwind classes, no external CSS.
 */

import React from 'react'

const C = {
  paper:    '#F6F5F1',
  card:     '#FFFFFF',
  sunken:   '#EFEEE8',
  hairline: '#E4E2DA',
  ink:      '#16151A',
  inkSoft:  '#5C5A63',
  inkFaint: '#9A98A1',
  brand:    '#C8881E',
  win:      '#1E7A4D',
} as const

const ROUND_LABELS: Record<string, string> = {
  '1': '1ª Rodada',
  '2': '2ª Rodada',
  '3': '3ª Rodada',
}

export type MatchImageData = {
  phaseLabel: string
  group:      string | null
  round:      string | null
  matchDate:  string    // e.g. "12 de junho de 2026"
  matchTime:  string    // e.g. "15h00"
  homeTeam: { name: string; abbr: string; emblemUrl: string | null }
  awayTeam: { name: string; abbr: string; emblemUrl: string | null }
  homeScore:  number | null
  awayScore:  number | null
  isFinished: boolean
  bets: Array<{
    name:     string
    homePred: number
    awayPred: number
    points:   number | null
  }>
}

export function MatchImageTemplate({ data }: { data: MatchImageData }) {
  const {
    phaseLabel, group, round, matchDate, matchTime,
    homeTeam, awayTeam, homeScore, awayScore, isFinished, bets,
  } = data

  const subParts: string[] = []
  if (group) subParts.push(`Grupo ${group}`)
  if (round) subParts.push(ROUND_LABELS[round] ?? `Rodada ${round}`)
  const subLabel = subParts.length > 0 ? subParts.join(' · ') : null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 640,
        backgroundColor: C.paper,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 28px',
          backgroundColor: C.ink,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: -0.5 }}>
            OusaBolão
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: C.brand, letterSpacing: 0.5 }}>
            Copa do Mundo 2026
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {subLabel && (
            <span
              style={{
                fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                letterSpacing: 1.5, textTransform: 'uppercase',
              }}
            >
              {subLabel}
            </span>
          )}
          <span
            style={{
              fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
              letterSpacing: 1.5, textTransform: 'uppercase',
            }}
          >
            {phaseLabel}
          </span>
          <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>
            {matchDate} · {matchTime}
          </span>
        </div>
      </div>

      {/* ── Teams ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '28px 40px',
          backgroundColor: C.card,
          borderBottom: `1px solid ${C.hairline}`,
          gap: 20,
        }}
      >
        {/* Home */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1 }}>
          {homeTeam.emblemUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={homeTeam.emblemUrl}
              width={64}
              height={48}
              alt={homeTeam.name}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: 64, height: 48, borderRadius: 6,
                backgroundColor: C.sunken, border: `1px solid ${C.hairline}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: C.inkSoft }}>{homeTeam.abbr}</span>
            </div>
          )}
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, textAlign: 'center' }}>
            {homeTeam.name}
          </span>
        </div>

        {/* Score or × */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 104 }}>
          {isFinished && homeScore !== null && awayScore !== null ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 52, fontWeight: 800, color: C.ink, letterSpacing: -2, lineHeight: 1 }}>
                  {homeScore}
                </span>
                <span style={{ fontSize: 28, fontWeight: 300, color: C.inkFaint, lineHeight: 1 }}>×</span>
                <span style={{ fontSize: 52, fontWeight: 800, color: C.ink, letterSpacing: -2, lineHeight: 1 }}>
                  {awayScore}
                </span>
              </div>
              <span
                style={{
                  fontSize: 9, fontWeight: 700, color: C.brand,
                  letterSpacing: 1.5, textTransform: 'uppercase',
                  backgroundColor: 'rgba(200,136,30,0.1)',
                  padding: '3px 10px', borderRadius: 999,
                }}
              >
                Resultado Final
              </span>
            </>
          ) : (
            <span style={{ fontSize: 36, fontWeight: 300, color: C.inkFaint, lineHeight: 1 }}>×</span>
          )}
        </div>

        {/* Away */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1 }}>
          {awayTeam.emblemUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={awayTeam.emblemUrl}
              width={64}
              height={48}
              alt={awayTeam.name}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: 64, height: 48, borderRadius: 6,
                backgroundColor: C.sunken, border: `1px solid ${C.hairline}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: C.inkSoft }}>{awayTeam.abbr}</span>
            </div>
          )}
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, textAlign: 'center' }}>
            {awayTeam.name}
          </span>
        </div>
      </div>

      {/* ── Bets section header ─────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 28px',
          backgroundColor: C.sunken,
          borderBottom: `1px solid ${C.hairline}`,
        }}
      >
        <span
          style={{
            fontSize: 9, fontWeight: 700, color: C.inkFaint,
            letterSpacing: 1.5, textTransform: 'uppercase', flex: 1,
          }}
        >
          Participante
        </span>
        <span
          style={{
            fontSize: 9, fontWeight: 700, color: C.inkFaint,
            letterSpacing: 1.5, textTransform: 'uppercase', width: 96, textAlign: 'center',
          }}
        >
          Palpite
        </span>
        {isFinished && (
          <span
            style={{
              fontSize: 9, fontWeight: 700, color: C.inkFaint,
              letterSpacing: 1.5, textTransform: 'uppercase', width: 64, textAlign: 'right',
            }}
          >
            Pontos
          </span>
        )}
      </div>

      {/* ── Bet rows ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {bets.length === 0 ? (
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '32px 28px', backgroundColor: C.card,
            }}
          >
            <span style={{ fontSize: 13, color: C.inkFaint }}>Nenhum palpite registrado</span>
          </div>
        ) : bets.map((bet, i) => {
          const ptColor = bet.points === 15 ? C.brand : bet.points === 5 ? C.win : C.inkFaint
          const initials = bet.name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(w => w[0])
            .join('')
            .toUpperCase()

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '11px 28px',
                backgroundColor: i % 2 === 0 ? C.card : C.sunken,
                borderBottom: i < bets.length - 1 ? `1px solid ${C.hairline}` : 'none',
              }}
            >
              <div
                style={{
                  width: 30, height: 30, borderRadius: 15, flexShrink: 0,
                  backgroundColor: C.sunken, border: `1px solid ${C.hairline}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: C.inkSoft }}>{initials}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.ink, flex: 1 }}>
                {bet.name}
              </span>
              <span
                style={{
                  fontSize: 15, fontWeight: 700, color: C.ink,
                  width: 96, textAlign: 'center', letterSpacing: -0.5,
                }}
              >
                {bet.homePred} × {bet.awayPred}
              </span>
              {isFinished && (
                <span
                  style={{
                    fontSize: 13, fontWeight: 700, color: ptColor,
                    width: 64, textAlign: 'right',
                  }}
                >
                  {bet.points !== null ? `${bet.points}pts` : '—'}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 28px',
          borderTop: `1px solid ${C.hairline}`,
          backgroundColor: C.paper,
        }}
      >
        <span style={{ fontSize: 10, color: C.inkFaint }}>
          OusaBolão · {bets.length} {bets.length === 1 ? 'palpite' : 'palpites'}
        </span>
      </div>
    </div>
  )
}
