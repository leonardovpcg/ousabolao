import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { Crosshair, Hash, Star, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { APP_TZ, formatDateTime } from '@/lib/utils/datetime'
import { DeadlineTimer, type DeadlineInfo } from './_components/DeadlineTimer'

// ── Constants ──────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  group_stage: 'Fase de Grupos',
  round_of_32: '16-avos de Final',
  round_of_16: 'Oitavas de Final',
  quarter_finals: 'Quartas de Final',
  semi_finals: 'Semifinais',
  third_place: 'Disputa de 3º',
  final: 'Final',
}

const ROUND_LABELS: Record<string, string> = {
  '1': '1ª Rodada',
  '2': '2ª Rodada',
  '3': '3ª Rodada',
}

const POSITION_COLOR: Record<number, string> = {
  1: 'text-gold',
  2: 'text-silver',
  3: 'text-bronze',
}

// ── Types ──────────────────────────────────────────────────────────

type RawPhase = {
  phase: string
  label: string
  status: string
  // columns from migration 06 — not in generated types
  bet_mode?: string
  lock_minutes_before?: number
}

type MatchRow = { match_date: string; phase: string; round: string | null }

// ── Deadline computation ───────────────────────────────────────────

function computeNextDeadline(
  openPhases: RawPhase[],
  matches: MatchRow[],
): DeadlineInfo | null {
  const now = Date.now()
  let nearest: { ms: number; info: DeadlineInfo } | null = null

  for (const phase of openPhases) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const betMode: string = (phase as any).bet_mode ?? 'whole_phase'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lockMinutes: number = (phase as any).lock_minutes_before ?? 15
    const phaseMatches = matches.filter((m) => m.phase === phase.phase)

    if (betMode === 'per_round' && phase.phase === 'group_stage') {
      const rounds = [
        ...new Set(phaseMatches.map((m) => m.round).filter(Boolean)),
      ] as string[]

      for (const round of rounds) {
        const roundMatches = phaseMatches.filter((m) => m.round === round)
        if (roundMatches.length === 0) continue
        const earliest = Math.min(
          ...roundMatches.map((m) => new Date(m.match_date).getTime()),
        )
        const deadlineMs = earliest - lockMinutes * 60 * 1000
        if (deadlineMs <= now) continue
        const deadlineIso = new Date(deadlineMs).toISOString()
        const roundLabel = ROUND_LABELS[round] ?? `Rodada ${round}`
        const phaseLabel = phase.label || PHASE_LABELS[phase.phase] || phase.phase
        const candidate: DeadlineInfo = {
          deadline_utc: deadlineIso,
          window_label: `${roundLabel} · ${phaseLabel}`,
          deadline_label: formatDateTime(deadlineIso),
        }
        if (!nearest || deadlineMs < nearest.ms) nearest = { ms: deadlineMs, info: candidate }
      }
    } else {
      if (phaseMatches.length === 0) continue
      const earliest = Math.min(
        ...phaseMatches.map((m) => new Date(m.match_date).getTime()),
      )
      const deadlineMs = earliest - lockMinutes * 60 * 1000
      if (deadlineMs <= now) continue
      const deadlineIso = new Date(deadlineMs).toISOString()
      const candidate: DeadlineInfo = {
        deadline_utc: deadlineIso,
        window_label: phase.label || PHASE_LABELS[phase.phase] || phase.phase,
        deadline_label: formatDateTime(deadlineIso),
      }
      if (!nearest || deadlineMs < nearest.ms) nearest = { ms: deadlineMs, info: candidate }
    }
  }

  return nearest?.info ?? null
}

// ── Greeting ───────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = parseInt(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: APP_TZ,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10,
  )
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

// ── MetricCard ─────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  valueClass = 'text-ink',
  sub,
  icon,
}: {
  label: string
  value: string
  valueClass?: string
  sub: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-card bg-card border border-hairline card-shadow-sm p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">
          {label}
        </span>
        <span className="text-ink-faint/70">{icon}</span>
      </div>
      <p className={`font-display text-[2rem] font-bold nums leading-none ${valueClass}`}>
        {value}
      </p>
      <p className="text-xs text-ink-soft mt-1.5 leading-tight">{sub}</p>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────

export default async function InicioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: rankingRow },
    { count: totalParticipants },
    { count: betCount },
    { data: poolSettings },
    { count: paidCount },
    { data: openPhaseRows },
  ] = await Promise.all([
    supabase.from('profiles').select('name, payment_status').eq('id', user.id).single(),
    supabase
      .from('ranking')
      .select('total_points, exact_scores, correct_results, position')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('ranking').select('*', { count: 'exact', head: true }),
    supabase.from('bets').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('pool_settings').select('quota_value').single(),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'paid'),
    supabase.from('tournament_phases').select('*').eq('status', 'open'),
  ])

  // Fetch matches for open phases (deadline computation)
  const openPhaseNames = (openPhaseRows ?? []).map((p) => p.phase)
  const { data: matchRows } =
    openPhaseNames.length > 0
      ? await supabase
          .from('matches')
          .select('match_date, phase, round')
          .in('phase', openPhaseNames)
          .eq('category', 'national')
          .order('match_date')
      : { data: [] as MatchRow[] }

  const deadlineInfo = computeNextDeadline(
    (openPhaseRows ?? []) as RawPhase[],
    matchRows ?? [],
  )

  // Prize
  const quotaValue = poolSettings?.quota_value ?? 100
  const paid = paidCount ?? 0
  const prize = quotaValue * paid
  const prizeFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(prize)

  const firstName = profile?.name?.split(' ')[0] ?? 'Jogador'
  const greeting = getGreeting()
  const position = rankingRow?.position ?? null
  const posColor = position !== null ? (POSITION_COLOR[position] ?? 'text-ink') : 'text-ink-faint'
  const total = totalParticipants ?? 0
  const isPaid = profile?.payment_status === 'paid'

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6 flex items-baseline gap-2 flex-wrap">
        <span className="text-base font-medium text-ink-soft">{greeting},</span>
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-none">
          {firstName}
        </h1>
      </div>

      {/* Payment-pending banner */}
      {!isPaid && (
        <div
          className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl border"
          style={{ background: 'rgba(178,58,46,.05)', borderColor: 'rgba(178,58,46,.18)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-loss mt-1.5 flex-shrink-0" />
          <p className="text-sm text-ink-soft leading-snug">
            <span className="font-semibold text-ink">Pagamento pendente.</span>{' '}
            Conclua a inscrição para palpitar.
          </p>
        </div>
      )}

      {/* Timer */}
      <DeadlineTimer deadlineInfo={deadlineInfo} />

      {/* Prize + metrics */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr]">
        {/* Prize */}
        <div
          className="rounded-card bg-card border card-shadow-sm p-5 lg:p-6 flex flex-col justify-between gap-4"
          style={{ borderColor: 'rgba(200,136,30,.22)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">
              Premiação acumulada
            </p>
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(200,136,30,.10)' }}
            >
              <Trophy size={15} className="text-brand" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="font-display text-4xl lg:text-5xl font-bold text-brand nums leading-none">
              {prizeFormatted}
            </p>
            <p className="text-xs text-ink-soft mt-2">
              {paid} participante{paid !== 1 ? 's' : ''} pago{paid !== 1 ? 's' : ''}{' '}
              · R$ {quotaValue.toLocaleString('pt-BR')}/inscrição
            </p>
          </div>
        </div>

        {/* 4 metric cards */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Posição"
            value={position !== null ? `${position}º` : '–'}
            valueClass={posColor}
            sub={
              position !== null && total > 0
                ? `de ${total} jogadores`
                : 'sem palpites ainda'
            }
            icon={<Trophy size={13} strokeWidth={1.5} />}
          />
          <MetricCard
            label="Pontos"
            value={String(rankingRow?.total_points ?? 0)}
            sub="acumulados"
            icon={<Star size={13} strokeWidth={1.5} />}
          />
          <MetricCard
            label="Palpites"
            value={String(betCount ?? 0)}
            sub="enviados"
            icon={<Hash size={13} strokeWidth={1.5} />}
          />
          <MetricCard
            label="Exatos"
            value={String(rankingRow?.exact_scores ?? 0)}
            sub="placares exatos"
            icon={<Crosshair size={13} strokeWidth={1.5} />}
          />
        </div>
      </div>
    </div>
  )
}
