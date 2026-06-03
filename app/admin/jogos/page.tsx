import { createClient } from '@/lib/supabase/server'
import { JobsClient } from './_components/JobsClient'
import { PHASES, PHASE_LABELS } from './constants'

export type NationalTeam = {
  id: string
  name: string
  country: string | null
  emblem_url: string | null
}

export type MatchWithTeams = {
  id: string
  home_team_national_id: string | null
  away_team_national_id: string | null
  match_date: string
  phase: string
  match_group: string | null
  round: string | null
  home_score: number | null
  away_score: number | null
  status: string
  home_team: NationalTeam | null
  away_team: NationalTeam | null
}

export type TournamentPhase = {
  id: string
  phase: string
  label: string
  display_order: number
  status: string
}

export default async function AdminJogosPage() {
  const supabase = await createClient()

  const [
    { data: teams, error: teamsErr },
    { data: matches, error: matchErr },
    { data: phasesData },
  ] = await Promise.all([
    supabase
      .from('national_teams')
      .select('id, name, country, emblem_url')
      .order('name'),
    supabase
      .from('matches')
      .select(`
        id, home_team_national_id, away_team_national_id,
        match_date, phase, match_group, round,
        home_score, away_score, status,
        home_team:national_teams!home_team_national_id(id, name, country, emblem_url),
        away_team:national_teams!away_team_national_id(id, name, country, emblem_url)
      `)
      .eq('category', 'national')
      .order('match_date'),
    supabase
      .from('tournament_phases')
      .select('id, phase, label, display_order, status')
      .order('display_order'),
  ])

  if (teamsErr || matchErr) {
    return (
      <div className="rounded-card border border-hairline bg-card card-shadow-sm p-6">
        <p className="text-ink font-semibold">Erro ao carregar dados</p>
        <p className="text-ink-soft text-sm mt-1">{teamsErr?.message ?? matchErr?.message}</p>
      </div>
    )
  }

  const phases: TournamentPhase[] =
    phasesData && phasesData.length > 0
      ? (phasesData as TournamentPhase[])
      : PHASES.map((p, i) => ({
          id: p,
          phase: p,
          label: PHASE_LABELS[p],
          display_order: i,
          status: 'upcoming',
        }))

  return (
    <JobsClient
      teams={(teams ?? []) as NationalTeam[]}
      matches={(matches ?? []) as MatchWithTeams[]}
      phases={phases}
    />
  )
}
