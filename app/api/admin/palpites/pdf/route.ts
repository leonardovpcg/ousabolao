import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { PalpitesPdf } from '@/lib/pdf/palpites-pdf'
import React from 'react'
import { APP_TZ } from '@/lib/utils/datetime'
import type { PalpitesPdfData, PalpitesPdfMatch, PalpitesPdfRow } from '@/lib/pdf/palpites-pdf'

function teamAbbr(name: string | null, country: string | null): string {
  const src = country ?? name ?? '?'
  return src.slice(0, 3).toUpperCase()
}

function matchDayLabel(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ,
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso))
}

const PHASE_LABELS: Record<string, string> = {
  group_stage:    'Fase de Grupos',
  round_of_32:    'Rodada de 32',
  round_of_16:    'Oitavas de Final',
  quarter_finals: 'Quartas de Final',
  semi_finals:    'Semifinais',
  third_place:    'Disputa 3º Lugar',
  final:          'Final',
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Admin check
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return new Response('Acesso negado.', { status: 403 })

  // Parse params
  const { searchParams } = new URL(request.url)
  const phase         = searchParams.get('phase') ?? 'group_stage'
  const round         = searchParams.get('round')
  const participantId = searchParams.get('participantId')

  // Fetch matches
  let matchQuery = supabase
    .from('matches')
    .select(`
      id, match_date, phase, round, match_group, home_score, away_score, status,
      home_team:national_teams!home_team_national_id(id, name, country, emblem_url),
      away_team:national_teams!away_team_national_id(id, name, country, emblem_url)
    `)
    .eq('category', 'national')
    .eq('phase', phase)
    .order('match_date')
  if (round) matchQuery = matchQuery.eq('round', round)

  // Fetch bets
  let betQuery = supabase
    .from('bets_with_profiles')
    .select('user_id, match_id, home_prediction, away_prediction, points, payment_status')
  if (participantId) betQuery = betQuery.eq('user_id', participantId)

  // Fetch profiles
  let profileQuery = supabase
    .from('profiles')
    .select('id, name, payment_status')
    .order('name')
  if (participantId) profileQuery = profileQuery.eq('id', participantId)

  const [matchRes, betRes, profileRes] = await Promise.all([matchQuery, betQuery, profileQuery])

  if (matchRes.error || betRes.error || profileRes.error) {
    return new Response('Erro ao buscar dados.', { status: 500 })
  }

  type TeamRaw = { id: string; name: string; country: string | null; emblem_url: string | null } | null
  type MatchRaw = {
    id: string
    match_date: string
    round: string | null
    match_group: string | null
    home_score: number | null
    away_score: number | null
    status: string
    home_team: TeamRaw
    away_team: TeamRaw
  }

  const rawMatches = (matchRes.data ?? []) as MatchRaw[]
  const rawBets    = betRes.data ?? []
  const profiles   = profileRes.data ?? []

  // Build match list
  const pdfMatches: PalpitesPdfMatch[] = rawMatches.map(m => ({
    id:          m.id,
    home_abbr:   teamAbbr(m.home_team?.name ?? null, m.home_team?.country ?? null),
    away_abbr:   teamAbbr(m.away_team?.name ?? null, m.away_team?.country ?? null),
    home_emblem: m.home_team?.emblem_url ?? null,
    away_emblem: m.away_team?.emblem_url ?? null,
    date_label:  matchDayLabel(m.match_date),
    score:       m.home_score !== null ? `${m.home_score}–${m.away_score}` : null,
    match_group: m.match_group ?? null,
    round:       m.round ?? null,
  }))

  // Build bet map userId → matchId → bet
  const betMap = new Map<string, Map<string, { pred: string; points: number | null }>>()
  for (const b of rawBets) {
    if (!b.user_id || !b.match_id) continue
    if (!betMap.has(b.user_id)) betMap.set(b.user_id, new Map())
    betMap.get(b.user_id)!.set(b.match_id, {
      pred:   `${b.home_prediction}×${b.away_prediction}`,
      points: b.points ?? null,
    })
  }

  // Match IDs for ordering bets
  const matchIds = rawMatches.map(m => m.id)

  // Build rows
  const pdfRows: PalpitesPdfRow[] = profiles.map(p => ({
    player_name: p.name ?? 'Sem nome',
    is_paid:     p.payment_status === 'paid',
    bets:        matchIds.map(mid => {
      const b = betMap.get(p.id)?.get(mid)
      return b
        ? {
            prediction: b.pred,
            points: rawMatches.find(m => m.id === mid)?.home_score !== null ? (b.points) : null,
          }
        : { prediction: null, points: null }
    }),
  }))

  // Filter label
  let filterLabel = PHASE_LABELS[phase] ?? phase
  if (round) filterLabel += ` — ${round}ª Rodada`

  const data: PalpitesPdfData = {
    filter_label: filterLabel,
    matches:      pdfMatches,
    rows:         pdfRows,
    generated_at: new Date().toISOString(),
    total_bets:   rawBets.length,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(PalpitesPdf, { data }) as any)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="palpites-${phase}${round ? `-r${round}` : ''}.pdf"`,
      'Cache-Control':       'no-store',
    },
  })
}
