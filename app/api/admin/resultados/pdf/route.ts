import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAllRows'
import { renderToBuffer } from '@react-pdf/renderer'
import { ResultadosPdf } from '@/lib/pdf/resultados-pdf'
import React from 'react'
import { APP_TZ } from '@/lib/utils/datetime'
import type { ResultadosPdfData, ResultadosPdfMatch, ResultadosPdfPlayer } from '@/lib/pdf/resultados-pdf'

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

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return new Response('Acesso negado.', { status: 403 })

  const { searchParams } = new URL(request.url)
  const phase = searchParams.get('phase') ?? 'group_stage'
  const round = searchParams.get('round')

  // Fetch only finished matches
  let matchQuery = supabase
    .from('matches')
    .select(`
      id, match_date, phase, round, match_group, home_score, away_score, status,
      home_team:national_teams!home_team_national_id(id, name, country, emblem_url),
      away_team:national_teams!away_team_national_id(id, name, country, emblem_url)
    `)
    .eq('category', 'national')
    .eq('phase', phase)
    .not('home_score', 'is', null)
    .order('match_date')

  if (round) matchQuery = matchQuery.eq('round', round)

  const betSelect = 'user_id, match_id, home_prediction, away_prediction, points' as const

  type BetRaw = {
    user_id: string | null
    match_id: string | null
    home_prediction: number | null
    away_prediction: number | null
    points: number | null
  }

  const [matchRes, betRes, profileRes] = await Promise.all([
    matchQuery,
    fetchAllRows<BetRaw>((from, to) =>
      supabase.from('bets').select(betSelect).order('created_at').order('id').range(from, to),
    ),
    supabase.from('profiles').select('id, name, payment_status').order('name'),
  ])

  if (matchRes.error || betRes.error || profileRes.error) {
    return new Response('Erro ao buscar dados.', { status: 500 })
  }

  type TeamRaw = { id: string; name: string; country: string | null; emblem_url: string | null } | null
  type MatchRaw = {
    id: string
    match_date: string
    round: string | null
    match_group: string | null
    home_score: number
    away_score: number
    status: string
    home_team: TeamRaw
    away_team: TeamRaw
  }

  const rawMatches = (matchRes.data ?? []) as MatchRaw[]
  const rawBets    = betRes.data
  const profiles   = profileRes.data ?? []

  const pdfMatches: ResultadosPdfMatch[] = rawMatches.map(m => ({
    id:          m.id,
    home_abbr:   teamAbbr(m.home_team?.name ?? null, m.home_team?.country ?? null),
    away_abbr:   teamAbbr(m.away_team?.name ?? null, m.away_team?.country ?? null),
    home_emblem: m.home_team?.emblem_url ?? null,
    away_emblem: m.away_team?.emblem_url ?? null,
    date_label:  matchDayLabel(m.match_date),
    score:       `${m.home_score}–${m.away_score}`,
    match_group: m.match_group ?? null,
    round:       m.round ?? null,
  }))

  const matchIds = rawMatches.map(m => m.id)
  const matchIdSet = new Set(matchIds)

  // Build bet map: userId → matchId → bet
  const betMap = new Map<string, Map<string, { pred: string; points: number | null }>>()
  for (const b of rawBets) {
    if (!b.user_id || !b.match_id || !matchIdSet.has(b.match_id)) continue
    if (!betMap.has(b.user_id)) betMap.set(b.user_id, new Map())
    betMap.get(b.user_id)!.set(b.match_id, {
      pred:   `${b.home_prediction}×${b.away_prediction}`,
      points: b.points ?? null,
    })
  }

  // Build player rows, compute window points, sort desc
  const pdfPlayers: ResultadosPdfPlayer[] = profiles
    .map(p => {
      const playerBets = betMap.get(p.id)
      const bets = matchIds.map(mid => {
        const b = playerBets?.get(mid)
        return b ? { prediction: b.pred, points: b.points } : { prediction: null, points: null }
      })
      const windowPoints = bets.reduce((sum, b) => sum + (b.points ?? 0), 0)
      return { player_name: p.name ?? 'Sem nome', window_points: windowPoints, bets }
    })
    .sort((a, b) => b.window_points - a.window_points)

  let filterLabel = PHASE_LABELS[phase] ?? phase
  if (round) filterLabel += ` — ${round}ª Rodada`

  const data: ResultadosPdfData = {
    filter_label: filterLabel,
    matches:      pdfMatches,
    players:      pdfPlayers,
    generated_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(ResultadosPdf, { data }) as any)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="resultados-${phase}${round ? `-r${round}` : ''}.pdf"`,
      'Cache-Control':       'no-store',
    },
  })
}
