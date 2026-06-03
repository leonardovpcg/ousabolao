export type NationalTeam = {
  id: string
  name: string
  country: string | null
  emblem_url: string | null
}

export type OtherBet = {
  user_id: string
  user_name: string | null
  home_prediction: number
  away_prediction: number
  points: number | null
}

export type MyBet = {
  id: string
  home_prediction: number
  away_prediction: number
  points: number | null
}

export type MatchData = {
  id: string
  match_date: string
  phase: string
  phase_label: string
  match_group: string | null
  round: string | null
  status: string
  home_score: number | null
  away_score: number | null
  home_team: NationalTeam | null
  away_team: NationalTeam | null
  /** UTC ISO of betting deadline; null when phase is upcoming or has no matches */
  deadline_utc: string | null
  /** False if phase is not open (upcoming/locked/concluded) */
  phase_is_open: boolean
  my_bet: MyBet | null
  other_bets: OtherBet[]
}
