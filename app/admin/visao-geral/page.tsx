import Link from 'next/link'
import {
  Swords, Trophy, Calendar, Users, Scale, CreditCard,
  LayoutGrid, BookOpen, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { APP_TZ, formatDateTime } from '@/lib/utils/datetime'

// ── Labels ────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  group_stage:    'Fase de Grupos',
  round_of_32:    '16-avos de Final',
  round_of_16:    'Oitavas de Final',
  quarter_finals: 'Quartas de Final',
  semi_finals:    'Semifinais',
  third_place:    'Disputa de 3º',
  final:          'Final',
}

const ROUND_LABELS: Record<string, string> = {
  '1': '1ª Rodada',
  '2': '2ª Rodada',
  '3': '3ª Rodada',
}

const ADMIN_SECTIONS = [
  { href: '/admin/jogos',         label: 'Jogos',           icon: Swords,      desc: 'Seleções e partidas'   },
  { href: '/admin/resultados',    label: 'Resultados',      icon: Trophy,      desc: 'Lançar placares'        },
  { href: '/admin/fases',         label: 'Fases',           icon: Calendar,    desc: 'Ciclo do torneio'       },
  { href: '/admin/participantes', label: 'Participantes',   icon: Users,       desc: 'Pagamentos e jogadores' },
  { href: '/admin/desempate',     label: 'Desempate',       icon: Scale,       desc: 'Perguntas especiais'    },
  { href: '/admin/pagamento',     label: 'Pagamento',       icon: CreditCard,  desc: 'Cota e chave PIX'       },
  { href: '/admin/palpites',      label: 'Palpites Gerais', icon: LayoutGrid,  desc: 'Visão de todos'         },
  { href: '/admin/regras',        label: 'Regras',          icon: BookOpen,    desc: 'Regulamento'            },
] as const

// ── Types ─────────────────────────────────────────────────────────

type RawPhase = {
  phase: string
  label: string
  status: string
  bet_mode?: string
  lock_minutes_before?: number
}

type MatchRow = { match_date: string; phase: string; round: string | null }

// ── Deadline ──────────────────────────────────────────────────────

function computeNextDeadline(openPhases: RawPhase[], matches: MatchRow[]) {
  const now = Date.now()
  let nearest: { ms: number; label: string; iso: string } | null = null

  for (const phase of openPhases) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const betMode = (phase as any).bet_mode ?? 'whole_phase'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lockMinutes: number = (phase as any).lock_minutes_before ?? 15
    const phaseMatches = matches.filter((m) => m.phase === phase.phase)

    if (betMode === 'per_round' && phase.phase === 'group_stage') {
      const rounds = [...new Set(phaseMatches.map((m) => m.round).filter(Boolean))] as string[]
      for (const round of rounds) {
        const roundMatches = phaseMatches.filter((m) => m.round === round)
        if (!roundMatches.length) continue
        const earliest = Math.min(...roundMatches.map((m) => new Date(m.match_date).getTime()))
        const deadlineMs = earliest - lockMinutes * 60 * 1000
        if (deadlineMs <= now) continue
        const windowLabel = `${ROUND_LABELS[round] ?? `Rodada ${round}`} · ${phase.label || PHASE_LABELS[phase.phase] || phase.phase}`
        if (!nearest || deadlineMs < nearest.ms) {
          nearest = { ms: deadlineMs, label: windowLabel, iso: new Date(deadlineMs).toISOString() }
        }
      }
    } else {
      if (!phaseMatches.length) continue
      const earliest = Math.min(...phaseMatches.map((m) => new Date(m.match_date).getTime()))
      const deadlineMs = earliest - lockMinutes * 60 * 1000
      if (deadlineMs <= now) continue
      const windowLabel = phase.label || PHASE_LABELS[phase.phase] || phase.phase
      if (!nearest || deadlineMs < nearest.ms) {
        nearest = { ms: deadlineMs, label: windowLabel, iso: new Date(deadlineMs).toISOString() }
      }
    }
  }

  return nearest
}

// ── StatusBadge ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { label: string; className: string }> = {
    upcoming:  { label: 'Aguardando', className: 'bg-card-sunken text-ink-soft  border-hairline'   },
    open:      { label: 'Aberta',     className: 'bg-win/10     text-win        border-win/25'      },
    locked:    { label: 'Travada',    className: 'bg-brand/10   text-brand      border-brand/25'    },
    concluded: { label: 'Encerrada',  className: 'bg-card-sunken text-ink-faint border-hairline'   },
  }
  const s = styles[status] ?? styles.upcoming
  return (
    <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full border ${s.className}`}>
      {s.label}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────

export default async function AdminVisaoGeralPage() {
  const supabase = await createClient()

  const [
    { data: poolSettings },
    { count: paidCount },
    { count: totalCount },
    { data: allPhases },
    { count: pendingResultsCount },
    { count: totalMatchesCount },
  ] = await Promise.all([
    supabase.from('pool_settings').select('quota_value, current_phase').maybeSingle(),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tournament_phases').select('*').order('display_order'),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('category', 'national').is('home_score', null),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('category', 'national'),
  ])

  // Deadline calculation requires matches for open phases
  const openPhases = ((allPhases ?? []) as RawPhase[]).filter((p) => p.status === 'open')
  const openPhaseNames = openPhases.map((p) => p.phase)
  const { data: matchRows } =
    openPhaseNames.length > 0
      ? await supabase
          .from('matches')
          .select('match_date, phase, round')
          .in('phase', openPhaseNames)
          .eq('category', 'national')
          .order('match_date')
      : { data: [] as MatchRow[] }

  const nextDeadline = computeNextDeadline(openPhases, matchRows ?? [])

  // Derived stats
  const paid       = paidCount ?? 0
  const total      = totalCount ?? 0
  const pending    = total - paid
  const quota      = Number(poolSettings?.quota_value ?? 100)
  const prize      = paid * quota
  const pendingRes = pendingResultsCount ?? 0
  const launched   = (totalMatchesCount ?? 0) - pendingRes

  const currentPhaseName = poolSettings?.current_phase ?? null
  const currentPhaseRow  = (allPhases ?? []).find((p) => p.phase === currentPhaseName)

  const nowLabel = new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const prizeFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(prize)

  const quotaFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(quota)

  return (
    <div className="space-y-6">

      {/* ── Heading ─────────────────────────────────────────────── */}
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink tracking-tight leading-none">
          Visão Geral
        </h1>
        <p className="text-sm text-ink-faint mt-1 capitalize">{nowLabel}</p>
      </div>

      {/* ── Status card ─────────────────────────────────────────── */}
      <div
        className="rounded-card bg-card border border-hairline p-5 lg:p-6"
        style={{ boxShadow: '0 1px 2px rgba(20,18,25,.04), 0 8px 24px rgba(20,18,25,.06)' }}
      >
        <p className="text-[10px] font-bold text-ink-faint uppercase tracking-wider mb-3">
          Copa do Mundo 2026
        </p>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Phase info */}
          <div>
            <h2 className="font-display text-xl lg:text-2xl font-bold text-ink leading-tight">
              {currentPhaseName
                ? (PHASE_LABELS[currentPhaseName] ?? currentPhaseName)
                : 'Sem fase configurada'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {currentPhaseRow && <StatusBadge status={currentPhaseRow.status} />}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(currentPhaseRow as any)?.bet_mode === 'per_round' && (
                <span className="text-[11px] text-ink-soft bg-card-sunken px-2 py-0.5 rounded-full border border-hairline">
                  Por Rodada
                </span>
              )}
            </div>
          </div>

          {/* Deadline */}
          <div className="sm:text-right flex-shrink-0">
            <p className="text-[10px] font-bold text-ink-faint uppercase tracking-wider mb-1">
              Próxima trava
            </p>
            {nextDeadline ? (
              <>
                <p className="text-sm font-medium text-ink">{nextDeadline.label}</p>
                <p className="text-xs text-ink-soft mt-0.5">{formatDateTime(nextDeadline.iso)}</p>
              </>
            ) : (
              <p className="text-xs text-ink-faint">
                {openPhases.length > 0 ? 'Sem jogos cadastrados' : 'Nenhuma fase aberta'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Metrics ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Participantes */}
        <Link
          href="/admin/participantes"
          className="group rounded-card bg-card border border-hairline p-4 hover:border-brand/30 transition-all"
          style={{ boxShadow: '0 1px 2px rgba(20,18,25,.04), 0 8px 24px rgba(20,18,25,.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">
              Participantes
            </span>
            <Users size={13} strokeWidth={1.5} className="text-ink-faint group-hover:text-brand transition-colors" />
          </div>
          <p className="font-display text-[2rem] font-bold text-ink nums leading-none">
            {total}
          </p>
          <p className="text-xs text-ink-soft mt-1.5 leading-snug">
            {paid} pago{paid !== 1 ? 's' : ''}{' '}
            ·{' '}
            <span className={pending > 0 ? 'text-loss' : 'text-win'}>
              {pending} pendente{pending !== 1 ? 's' : ''}
            </span>
          </p>
          <p className="flex items-center gap-0.5 text-[11px] text-brand mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
            Ver participantes <ChevronRight size={11} strokeWidth={2} />
          </p>
        </Link>

        {/* Resultados pendentes */}
        <Link
          href="/admin/resultados"
          className="group rounded-card bg-card border border-hairline p-4 hover:border-brand/30 transition-all"
          style={{ boxShadow: '0 1px 2px rgba(20,18,25,.04), 0 8px 24px rgba(20,18,25,.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">
              Resultados
            </span>
            <Trophy size={13} strokeWidth={1.5} className="text-ink-faint group-hover:text-brand transition-colors" />
          </div>
          <p className={`font-display text-[2rem] font-bold nums leading-none ${pendingRes > 0 ? 'text-brand' : 'text-win'}`}>
            {pendingRes}
          </p>
          <p className="text-xs text-ink-soft mt-1.5 leading-snug">
            {pendingRes > 0
              ? `${pendingRes} aguardando placar`
              : 'todos lançados'}{' '}
            · {launched} lançado{launched !== 1 ? 's' : ''}
          </p>
          <p className="flex items-center gap-0.5 text-[11px] text-brand mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
            Lançar resultados <ChevronRight size={11} strokeWidth={2} />
          </p>
        </Link>

        {/* Premiação */}
        <div
          className="rounded-card bg-card p-4 border"
          style={{
            borderColor: 'rgba(200,136,30,.25)',
            boxShadow: '0 1px 2px rgba(20,18,25,.04), 0 8px 24px rgba(20,18,25,.06)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">
              Premiação acumulada
            </span>
            <Trophy size={13} strokeWidth={1.5} className="text-brand" />
          </div>
          <p className="font-display text-[2rem] font-bold text-brand nums leading-none">
            {prizeFormatted}
          </p>
          <p className="text-xs text-ink-soft mt-1.5">
            {paid} inscrito{paid !== 1 ? 's' : ''} × {quotaFormatted}
          </p>
        </div>
      </div>

      {/* ── Quick access ────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-ink-faint uppercase tracking-wider mb-3">
          Acesso Rápido
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ADMIN_SECTIONS.map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-2.5 rounded-[14px] bg-card border border-hairline p-3.5 hover:border-brand/30 transition-all"
              style={{ boxShadow: '0 1px 2px rgba(20,18,25,.04), 0 4px 12px rgba(20,18,25,.04)' }}
            >
              <Icon
                size={16}
                strokeWidth={1.5}
                className="text-ink-faint group-hover:text-brand transition-colors"
              />
              <div>
                <p className="text-sm font-medium text-ink leading-tight">{label}</p>
                <p className="text-[11px] text-ink-faint mt-0.5 leading-tight">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
