import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cgDateKey } from '@/lib/utils/datetime'
import { PalpiteClient } from './_components/PalpiteClient'
import type { MatchData, MyBet, NationalTeam, OtherBet } from './_components/types'

// Phase labels PT-BR (fallback if DB label is missing)
const PHASE_LABELS: Record<string, string> = {
  group_stage: 'Fase de Grupos',
  round_of_32: '16-avos de Final',
  round_of_16: 'Oitavas de Final',
  quarter_finals: 'Quartas de Final',
  semi_finals: 'Semifinais',
  third_place: 'Disputa de 3º',
  final: 'Final',
}

type RawMatch = {
  id: string
  match_date: string
  phase: string
  match_group: string | null
  round: string | null
  status: string
  home_score: number | null
  away_score: number | null
  home_team_national_id: string | null
  away_team_national_id: string | null
}

type RawPhase = {
  id: string
  phase: string
  label: string
  status: string
  display_order: number
  betting_locks_at: string | null
  // columns added by migration 06 — not in generated types yet
  bet_mode?: string
  lock_minutes_before?: number
}

/** Compute the UTC deadline ISO for a match given its phase config and all matches. */
function computeDeadline(
  match: RawMatch,
  allMatches: RawMatch[],
  phase: RawPhase | undefined,
): string | null {
  if (!phase || phase.status === 'upcoming') return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const betMode: string = (phase as any).bet_mode ?? 'whole_phase'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lockMinutes: number = (phase as any).lock_minutes_before ?? 15

  let scopeMatches = allMatches.filter((m) => m.phase === match.phase)
  if (betMode === 'per_round' && match.phase === 'group_stage' && match.round) {
    scopeMatches = allMatches.filter(
      (m) => m.phase === match.phase && m.round === match.round,
    )
  }

  if (scopeMatches.length === 0) return null

  const earliestMs = Math.min(...scopeMatches.map((m) => new Date(m.match_date).getTime()))
  return new Date(earliestMs - lockMinutes * 60 * 1000).toISOString()
}

export default async function PalpitePage() {
  const supabase = await createClient()

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel fetches
  const [
    { data: profileData },
    { data: isAdminResult },
    { data: phaseRows },
    { data: matchRows },
    { data: nationalTeamRows },
    { data: myBetRows },
    { data: allBetRows },
  ] = await Promise.all([
    supabase.from('profiles').select('payment_status').eq('id', user.id).single(),
    supabase.rpc('is_admin'),
    supabase.from('tournament_phases').select('*').order('display_order'),
    supabase
      .from('matches')
      .select(
        'id, match_date, phase, match_group, round, status, home_score, away_score, home_team_national_id, away_team_national_id',
      )
      .eq('category', 'national')
      .order('match_date'),
    supabase.from('national_teams').select('id, name, country, emblem_url'),
    supabase
      .from('bets')
      .select('id, match_id, home_prediction, away_prediction, points')
      .eq('user_id', user.id),
    supabase
      .from('bets_with_profiles')
      .select('match_id, user_id, user_name, home_prediction, away_prediction, points'),
  ])

  const phases = (phaseRows ?? []) as RawPhase[]
  const phaseMap = new Map(phases.map((p) => [p.phase, p]))

  // Index national teams
  const teamMap = new Map<string, NationalTeam>()
  for (const t of nationalTeamRows ?? []) {
    teamMap.set(t.id, { id: t.id, name: t.name, country: t.country, emblem_url: t.emblem_url })
  }

  // Index my bets
  const myBetMap = new Map<string, MyBet>()
  for (const b of myBetRows ?? []) {
    myBetMap.set(b.match_id, {
      id: b.id,
      home_prediction: b.home_prediction,
      away_prediction: b.away_prediction,
      points: b.points ?? null,
    })
  }

  // Index others' bets by match_id
  const otherBetsMap = new Map<string, OtherBet[]>()
  for (const b of allBetRows ?? []) {
    if (!b.match_id || b.user_id === user.id) continue
    const entry: OtherBet = {
      user_id: b.user_id!,
      user_name: b.user_name,
      home_prediction: b.home_prediction ?? 0,
      away_prediction: b.away_prediction ?? 0,
      points: b.points ?? null,
    }
    const arr = otherBetsMap.get(b.match_id) ?? []
    arr.push(entry)
    otherBetsMap.set(b.match_id, arr)
  }

  // Build MatchData[]
  const rawMatches = (matchRows ?? []) as RawMatch[]
  const matches: MatchData[] = rawMatches.map((m) => {
    const phase = phaseMap.get(m.phase)
    const deadline_utc = computeDeadline(m, rawMatches, phase)
    const phase_is_open = phase?.status === 'open'

    return {
      id: m.id,
      match_date: m.match_date,
      phase: m.phase,
      phase_label: phase?.label ?? PHASE_LABELS[m.phase] ?? m.phase,
      match_group: m.match_group,
      round: m.round,
      status: m.status,
      home_score: m.home_score,
      away_score: m.away_score,
      home_team: m.home_team_national_id ? (teamMap.get(m.home_team_national_id) ?? null) : null,
      away_team: m.away_team_national_id ? (teamMap.get(m.away_team_national_id) ?? null) : null,
      deadline_utc,
      phase_is_open,
      my_bet: myBetMap.get(m.id) ?? null,
      other_bets: otherBetsMap.get(m.id) ?? [],
    }
  })

  // Find default day: nearest match_date >= now (Campo Grande today)
  const now = Date.now()
  const upcoming = matches.filter((m) => new Date(m.match_date).getTime() >= now)
  const defaultDay =
    upcoming.length > 0
      ? cgDateKey(upcoming[0].match_date)
      : matches.length > 0
        ? cgDateKey(matches[matches.length - 1].match_date)
        : cgDateKey(new Date().toISOString())

  const isPaid = profileData?.payment_status === 'paid'
  const isAdmin = isAdminResult === true

  return (
    <PalpiteClient
      matches={matches}
      currentUserId={user.id}
      isPaid={isPaid}
      isAdmin={isAdmin}
      defaultDay={defaultDay}
    />
  )
}
