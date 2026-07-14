import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAllRows'
import { RelatoriosShell } from './_components/RelatoriosShell'

// ── Types ─────────────────────────────────────────────────────

export type BetEntry = {
  id: string | null
  user_id: string | null
  match_id: string | null
  home_prediction: number | null
  away_prediction: number | null
  points: number | null
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

export type TiebreakerQuestion = {
  id: string
  display_order: number
  question: string
  official_answer: string | null
  is_active: boolean
}

export type TiebreakerResponse = {
  id: string
  user_id: string
  question_id: string
  answer: string
  is_correct: boolean | null
}

// ── Page ──────────────────────────────────────────────────────

const BET_SELECT = 'id, user_id, match_id, home_prediction, away_prediction, points' as const

export default async function AdminRelatoriosPage() {
  const supabase = await createClient()

  const [
    betsResult,
    matchesResult, profilesResult, questionsResult, responsesResult,
  ] = await Promise.all([
    fetchAllRows<BetEntry>((from, to) =>
      supabase.from('bets').select(BET_SELECT).order('created_at').order('id').range(from, to),
    ),
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
    supabase
      .from('tiebreaker_questions')
      .select('id, display_order, question, official_answer, is_active')
      .order('display_order'),
    supabase
      .from('tiebreaker_responses')
      .select('id, user_id, question_id, answer, is_correct'),
  ])

  const fetchError =
    betsResult.error ??
    matchesResult.error ?? profilesResult.error ??
    questionsResult.error ?? responsesResult.error

  if (fetchError) {
    return (
      <div className="rounded-card border border-hairline bg-card card-shadow-sm p-6">
        <p className="text-ink font-semibold">Erro ao carregar dados</p>
        <p className="text-ink-soft text-sm mt-1">{fetchError.message}</p>
      </div>
    )
  }

  const allBets = betsResult.data

  return (
    <RelatoriosShell
      bets={allBets}
      matches={(matchesResult.data ?? []) as MatchForBets[]}
      profiles={(profilesResult.data ?? []) as ProfileRow[]}
      questions={(questionsResult.data ?? []) as TiebreakerQuestion[]}
      responses={(responsesResult.data ?? []) as TiebreakerResponse[]}
    />
  )
}
