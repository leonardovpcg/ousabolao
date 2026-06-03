import { createClient } from '@/lib/supabase/server'
import { PalpitesClient } from './_components/PalpitesClient'

export type BetEntry = {
  id: string | null
  user_id: string | null
  user_name: string | null
  match_id: string | null
  home_prediction: number | null
  away_prediction: number | null
  points: number | null
  payment_status: string | null
}

export type NationalTeam = {
  id: string
  name: string
  country: string | null
  emblem_url: string | null
}

export type MatchForBets = {
  id: string
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

export type ProfileRow = {
  id: string
  name: string | null
  payment_status: string
}

export default async function AdminPalpitesPage() {
  const supabase = await createClient()

  const [betsResult, matchesResult, profilesResult] = await Promise.all([
    supabase
      .from('bets_with_profiles')
      .select('id, user_id, user_name, match_id, home_prediction, away_prediction, points, payment_status'),
    supabase
      .from('matches')
      .select(`
        id, match_date, phase, match_group, round,
        home_score, away_score, status,
        home_team:national_teams!home_team_national_id(id, name, country, emblem_url),
        away_team:national_teams!away_team_national_id(id, name, country, emblem_url)
      `)
      .eq('category', 'national')
      .order('match_date'),
    supabase
      .from('profiles')
      .select('id, name, payment_status')
      .order('name'),
  ])

  if (betsResult.error || matchesResult.error || profilesResult.error) {
    return (
      <div className="rounded-card border border-hairline bg-card card-shadow-sm p-6">
        <p className="text-ink font-semibold">Erro ao carregar palpites</p>
        <p className="text-ink-soft text-sm mt-1">
          {betsResult.error?.message ?? matchesResult.error?.message ?? profilesResult.error?.message}
        </p>
      </div>
    )
  }

  return (
    <PalpitesClient
      bets={(betsResult.data ?? []) as BetEntry[]}
      matches={(matchesResult.data ?? []) as MatchForBets[]}
      profiles={(profilesResult.data ?? []) as ProfileRow[]}
    />
  )
}
