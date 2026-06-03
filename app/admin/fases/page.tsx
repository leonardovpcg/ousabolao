import { createClient } from '@/lib/supabase/server'
import { FasesClient } from './_components/FasesClient'

// ── Types ─────────────────────────────────────────────────────
// Extended to include columns added in migration 06

export type PhaseRow = {
  id: string
  phase: string
  label: string
  display_order: number
  status: string
  bet_mode: 'whole_phase' | 'per_round'
  lock_minutes_before: number
  betting_locks_at: string | null
}

export type PhaseRoundRow = {
  id: string
  phase: string
  round: string
  status: string
}

export type DeadlineEntry = {
  phaseKey: string
  round?: string           // only for per_round group_stage
  firstMatchAt: string | null  // UTC ISO
  locksAt: string | null       // UTC ISO = firstMatchAt − lock_minutes_before
}

// ── Deadline helpers ──────────────────────────────────────────

function computeDeadlines(
  phases: PhaseRow[],
  matches: { phase: string; round: string | null; match_date: string }[]
): DeadlineEntry[] {
  const firstIn = (phaseKey: string, round?: string): string | null => {
    const filtered = matches.filter(
      m => m.phase === phaseKey && (round == null || m.round === round)
    )
    if (filtered.length === 0) return null
    return filtered.reduce<string>(
      (min, m) => (new Date(m.match_date) < new Date(min) ? m.match_date : min),
      filtered[0].match_date
    )
  }

  const subtractMinutes = (iso: string | null, mins: number): string | null => {
    if (!iso) return null
    return new Date(new Date(iso).getTime() - mins * 60_000).toISOString()
  }

  return phases.flatMap<DeadlineEntry>(p => {
    const mins = p.lock_minutes_before ?? 30

    if (p.phase === 'group_stage' && p.bet_mode === 'per_round') {
      return (['1', '2', '3'] as const).map(round => {
        const firstAt = firstIn(p.phase, round)
        return {
          phaseKey: p.phase,
          round,
          firstMatchAt: firstAt,
          locksAt: subtractMinutes(firstAt, mins),
        }
      })
    }

    const firstAt = firstIn(p.phase)
    return [{ phaseKey: p.phase, firstMatchAt: firstAt, locksAt: subtractMinutes(firstAt, mins) }]
  })
}

// ── Page ──────────────────────────────────────────────────────

export default async function FasesPage() {
  const supabase = await createClient()
  // phase_rounds lives in migration 06 — access via any until types are regenerated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [
    { data: rawPhases, error: phasesErr },
    { data: rawRounds },
    { data: settings },
    { data: rawMatches },
  ] = await Promise.all([
    supabase.from('tournament_phases').select('*').order('display_order'),
    db.from('phase_rounds').select('*').eq('phase', 'group_stage').order('round'),
    supabase.from('pool_settings').select('id, current_phase').maybeSingle(),
    supabase
      .from('matches')
      .select('phase, round, match_date')
      .eq('category', 'national')
      .order('match_date'),
  ])

  if (phasesErr) {
    return (
      <div className="rounded-card border border-hairline bg-card card-shadow-sm p-6">
        <p className="text-ink font-semibold">Erro ao carregar fases</p>
        <p className="text-ink-soft text-sm mt-1">{phasesErr.message}</p>
      </div>
    )
  }

  const phases = (rawPhases as unknown as PhaseRow[]) ?? []
  const rounds = (rawRounds as PhaseRoundRow[]) ?? []
  const matches = (rawMatches ?? []) as { phase: string; round: string | null; match_date: string }[]

  const deadlines = computeDeadlines(phases, matches)

  return (
    <FasesClient
      phases={phases}
      rounds={rounds}
      deadlines={deadlines}
      currentPhase={settings?.current_phase ?? null}
      poolSettingsId={settings?.id ?? ''}
    />
  )
}
