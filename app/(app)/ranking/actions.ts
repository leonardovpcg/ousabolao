'use server'

import { createClient } from '@/lib/supabase/server'

export type BetDetail = {
  id: string
  home_prediction: number
  away_prediction: number
  points: number | null
  match: {
    id: string
    home_score: number | null
    away_score: number | null
    match_date: string
    phase: string | null
    round: string | null
    match_group: string | null
    status: string | null
    home_nt: { name: string; emblem_url: string | null } | null
    away_nt: { name: string; emblem_url: string | null } | null
  } | null
}

export async function fetchPlayerBets(userId: string): Promise<BetDetail[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bets')
    .select(`
      id,
      home_prediction,
      away_prediction,
      points,
      match:matches (
        id,
        home_score,
        away_score,
        match_date,
        phase,
        round,
        match_group,
        status,
        home_nt:national_teams!matches_home_team_national_id_fkey ( name, emblem_url ),
        away_nt:national_teams!matches_away_team_national_id_fkey ( name, emblem_url )
      )
    `)
    .eq('user_id', userId)

  if (error || !data) return []

  return (data as unknown as BetDetail[])
    .filter((b) => b.match?.status === 'finished')
    .sort((a, b) => {
      const da = a.match?.match_date ?? ''
      const db = b.match?.match_date ?? ''
      return db.localeCompare(da)
    })
}
