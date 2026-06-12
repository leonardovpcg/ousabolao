import { type NextRequest } from 'next/server'
import satori from 'satori'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { MatchImageTemplate, type MatchImageData } from '@/lib/image/match-image-template'
import React from 'react'
import { APP_TZ } from '@/lib/utils/datetime'

// ── Font cache (per server process) ───────────────────────────
let fontRegular: ArrayBuffer | undefined
let fontBold:    ArrayBuffer | undefined

async function loadFonts(): Promise<[ArrayBuffer, ArrayBuffer]> {
  if (!fontRegular) {
    fontRegular = await fetch(
      'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff2',
    ).then(r => r.arrayBuffer())
  }
  if (!fontBold) {
    fontBold = await fetch(
      'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff2',
    ).then(r => r.arrayBuffer())
  }
  return [fontRegular!, fontBold!]
}

// ── Constants ──────────────────────────────────────────────────
const PHASE_LABELS: Record<string, string> = {
  group_stage:    'Fase de Grupos',
  round_of_32:    'Rodada de 32',
  round_of_16:    'Oitavas de Final',
  quarter_finals: 'Quartas de Final',
  semi_finals:    'Semifinais',
  third_place:    'Disputa 3º Lugar',
  final:          'Final',
}

function teamAbbr(name: string | null, country: string | null): string {
  const src = country ?? name ?? '?'
  return src.slice(0, 3).toUpperCase()
}

// image height constants (px) — must match template layout
const H_HEADER   = 72
const H_TEAMS    = 166
const H_BETS_HDR = 38
const H_BET_ROW  = 52
const H_EMPTY    = 80
const H_FOOTER   = 48

// ── Route ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return new Response('Acesso negado.', { status: 403 })

  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('matchId')
  if (!matchId) return new Response('matchId é obrigatório.', { status: 400 })

  // Fetch match + bets in parallel
  const [matchResult, betsResult] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        id, match_date, phase, match_group, round,
        home_score, away_score, status,
        home_team:national_teams!home_team_national_id(id, name, country, emblem_url),
        away_team:national_teams!away_team_national_id(id, name, country, emblem_url)
      `)
      .eq('id', matchId)
      .eq('category', 'national')
      .single(),
    supabase
      .from('bets_with_profiles')
      .select('user_name, home_prediction, away_prediction, points')
      .eq('match_id', matchId)
      .order('user_name'),
  ])

  if (matchResult.error || !matchResult.data) {
    return new Response('Partida não encontrada.', { status: 404 })
  }

  const match = matchResult.data
  type TeamRaw = { id: string; name: string; country: string | null; emblem_url: string | null }
  const homeTeamRaw = match.home_team as unknown as TeamRaw | null
  const awayTeamRaw = match.away_team as unknown as TeamRaw | null

  const matchDate = new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(match.match_date))

  const matchTime = new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(match.match_date)).replace(':', 'h')

  const bets = (betsResult.data ?? [])
    .filter(b => b.user_name && b.home_prediction !== null && b.away_prediction !== null)
    .map(b => ({
      name:     b.user_name!,
      homePred: b.home_prediction!,
      awayPred: b.away_prediction!,
      points:   b.points ?? null,
    }))

  const data: MatchImageData = {
    phaseLabel: PHASE_LABELS[match.phase] ?? match.phase,
    group:      match.match_group ?? null,
    round:      match.round ?? null,
    matchDate,
    matchTime,
    homeTeam: {
      name:      homeTeamRaw?.name ?? '?',
      abbr:      teamAbbr(homeTeamRaw?.name ?? null, homeTeamRaw?.country ?? null),
      emblemUrl: homeTeamRaw?.emblem_url ?? null,
    },
    awayTeam: {
      name:      awayTeamRaw?.name ?? '?',
      abbr:      teamAbbr(awayTeamRaw?.name ?? null, awayTeamRaw?.country ?? null),
      emblemUrl: awayTeamRaw?.emblem_url ?? null,
    },
    homeScore:  match.home_score,
    awayScore:  match.away_score,
    isFinished: match.status === 'finished' && match.home_score !== null,
    bets,
  }

  const W = 640
  const H = H_HEADER + H_TEAMS + H_BETS_HDR
    + (bets.length > 0 ? bets.length * H_BET_ROW : H_EMPTY)
    + H_FOOTER

  // ── Font loading ───────────────────────────────────────────
  let fontR: ArrayBuffer
  let fontB: ArrayBuffer
  try {
    ;[fontR, fontB] = await loadFonts()
  } catch (e) {
    console.error('[match-image] font load failed:', e)
    return new Response(`Erro ao carregar fontes: ${String(e)}`, { status: 500 })
  }

  // ── Satori SVG ─────────────────────────────────────────────
  let svg: string
  try {
    svg = await satori(
      React.createElement(MatchImageTemplate, { data }),
      {
        width:  W,
        height: H,
        fonts: [
          { name: 'Inter', data: fontR, weight: 400, style: 'normal' },
          { name: 'Inter', data: fontB, weight: 700, style: 'normal' },
        ],
      },
    )
  } catch (e) {
    console.error('[match-image] satori failed:', e)
    return new Response(`Erro ao gerar SVG: ${String(e)}`, { status: 500 })
  }

  // ── Sharp PNG ──────────────────────────────────────────────
  let pngBuffer: Buffer
  try {
    pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer()
  } catch (e) {
    console.error('[match-image] sharp failed:', e)
    return new Response(`Erro ao converter PNG: ${String(e)}`, { status: 500 })
  }

  const homeA = teamAbbr(homeTeamRaw?.name ?? null, homeTeamRaw?.country ?? null).toLowerCase()
  const awayA = teamAbbr(awayTeamRaw?.name ?? null, awayTeamRaw?.country ?? null).toLowerCase()

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      'Content-Type':        'image/png',
      'Content-Disposition': `attachment; filename="palpites-${homeA}x${awayA}.png"`,
      'Cache-Control':       'no-store',
    },
  })
}
