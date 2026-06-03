import { createClient } from '@/lib/supabase/server'
import { PHASE_LABELS } from '../jogos/constants'
import { ResultadosClient, type MatchRow, type PhaseRow } from './_components/ResultadosClient'

export default async function AdminResultadosPage() {
  const supabase = await createClient()

  const [
    { data: matchRows, error: matchErr },
    { data: phaseRows },
  ] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        id, match_date, phase, match_group, round, status, home_score, away_score,
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

  if (matchErr) {
    return (
      <div className="rounded-card border border-hairline bg-card card-shadow-sm p-6">
        <p className="font-semibold text-ink">Erro ao carregar partidas</p>
        <p className="text-ink-soft text-sm mt-1">{matchErr.message}</p>
      </div>
    )
  }

  // Build phases list — fall back to constants if DB has no rows
  const phases: PhaseRow[] =
    phaseRows && phaseRows.length > 0
      ? phaseRows.map((p) => ({
          id: p.id,
          phase: p.phase,
          label: p.label || PHASE_LABELS[p.phase] || p.phase,
          display_order: p.display_order,
          status: p.status,
        }))
      : Object.entries(PHASE_LABELS).map(([phase, label], i) => ({
          id: phase,
          phase,
          label,
          display_order: i,
          status: 'upcoming',
        }))

  return (
    <ResultadosClient
      matches={(matchRows ?? []) as MatchRow[]}
      phases={phases}
    />
  )
}
