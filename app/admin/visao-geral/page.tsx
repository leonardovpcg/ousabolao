import Link from 'next/link'
import {
  Swords, Trophy, Calendar, Users, Scale, CreditCard,
  LayoutGrid, BookOpen, ChevronRight, CheckCircle2, AlertCircle,
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
  { href: '/admin/palpites',      label: 'Relatórios',      icon: LayoutGrid,  desc: 'Palpites e resultados'  },
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

type UpcomingMatch = {
  id: string
  match_date: string
  phase: string
  round: string | null
  match_group: string | null
  home_team_national_id: string | null
  away_team_national_id: string | null
}

type NationalTeam = {
  id: string
  name: string
  country: string | null
  emblem_url: string | null
}

type PendingProfile = {
  id: string
  name: string | null
  email: string | null
}

// ── Helpers ───────────────────────────────────────────────────────

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

function formatMatchLabel(iso: string): string {
  const d = new Date(iso)
  const day = new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ, day: 'numeric', month: 'short',
  }).format(d).replace('. ', ' de ')
  const time = new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ, hour: '2-digit', minute: '2-digit',
  }).format(d).replace(':', 'h')
  return `${day} · ${time}`
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
    { data: upcomingMatchRows },
    { data: pendingProfiles },
    { data: nationalTeamRows },
  ] = await Promise.all([
    supabase.from('pool_settings').select('quota_value, current_phase').maybeSingle(),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tournament_phases').select('*').order('display_order'),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('category', 'national').is('home_score', null),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('category', 'national'),
    supabase
      .from('matches')
      .select('id, match_date, phase, round, match_group, home_team_national_id, away_team_national_id')
      .eq('category', 'national')
      .is('home_score', null)
      .gt('match_date', new Date().toISOString())
      .order('match_date')
      .limit(6),
    supabase
      .from('profiles')
      .select('id, name, email')
      .eq('payment_status', 'pending')
      .order('name')
      .limit(20),
    supabase.from('national_teams').select('id, name, country, emblem_url'),
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

  // Team map for upcoming matches
  const teamMap = new Map<string, NationalTeam>()
  for (const t of nationalTeamRows ?? []) {
    teamMap.set(t.id, t as NationalTeam)
  }

  const upcomingMatches = (upcomingMatchRows ?? []) as UpcomingMatch[]
  const pendingList     = (pendingProfiles ?? []) as PendingProfile[]

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

      {/* ── Desktop: painéis detalhados (substitui acesso rápido) ── */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-4">

        {/* Próximos jogos */}
        <div
          className="rounded-card bg-card border border-hairline p-5"
          style={{ boxShadow: '0 1px 2px rgba(20,18,25,.04), 0 8px 24px rgba(20,18,25,.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">
              Próximos jogos
            </p>
            <Link
              href="/admin/resultados"
              className="text-[11px] text-brand hover:underline underline-offset-2"
            >
              Ver todos
            </Link>
          </div>

          {upcomingMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Calendar size={22} strokeWidth={1.5} className="text-ink-faint/50" />
              <p className="text-xs text-ink-faint text-center">
                Nenhum jogo programado
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-hairline">
              {upcomingMatches.map((m) => {
                const home = m.home_team_national_id ? teamMap.get(m.home_team_national_id) : null
                const away = m.away_team_national_id ? teamMap.get(m.away_team_national_id) : null
                const phaseLabel = PHASE_LABELS[m.phase] ?? m.phase
                const roundLabel = m.round ? (ROUND_LABELS[m.round] ?? `R${m.round}`) : null
                const ctxLabel = [m.match_group && `Gr. ${m.match_group}`, roundLabel]
                  .filter(Boolean).join(' · ')

                return (
                  <div key={m.id} className="flex items-center justify-between py-2.5 gap-3">
                    {/* Teams */}
                    <div className="flex items-center gap-2 min-w-0">
                      {home?.emblem_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={home.emblem_url} alt={home.name} className="w-5 h-5 object-contain flex-shrink-0 rounded-sm" />
                        : <div className="w-5 h-5 rounded-sm bg-card-sunken border border-hairline flex-shrink-0" />
                      }
                      <span className="text-xs font-semibold text-ink truncate max-w-[72px]">
                        {home?.name ?? '—'}
                      </span>
                      <span className="text-[10px] text-ink-faint flex-shrink-0">×</span>
                      {away?.emblem_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={away.emblem_url} alt={away.name} className="w-5 h-5 object-contain flex-shrink-0 rounded-sm" />
                        : <div className="w-5 h-5 rounded-sm bg-card-sunken border border-hairline flex-shrink-0" />
                      }
                      <span className="text-xs font-semibold text-ink truncate max-w-[72px]">
                        {away?.name ?? '—'}
                      </span>
                    </div>

                    {/* Date + context */}
                    <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                      <span className="text-[11px] font-medium text-ink-soft tabular-nums">
                        {formatMatchLabel(m.match_date)}
                      </span>
                      {ctxLabel && (
                        <span className="text-[10px] text-ink-faint">{ctxLabel}</span>
                      )}
                      {!ctxLabel && (
                        <span className="text-[10px] text-ink-faint">{phaseLabel}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pendentes de pagamento */}
        <div
          className="rounded-card bg-card border border-hairline p-5"
          style={{ boxShadow: '0 1px 2px rgba(20,18,25,.04), 0 8px 24px rgba(20,18,25,.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">
              Pendentes de pagamento
            </p>
            <Link
              href="/admin/participantes"
              className="text-[11px] text-brand hover:underline underline-offset-2"
            >
              Gerenciar
            </Link>
          </div>

          {pendingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CheckCircle2 size={22} strokeWidth={1.5} className="text-win" />
              <p className="text-xs text-win font-medium">Todos os participantes estão em dia!</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-loss/5 border border-loss/15">
                <AlertCircle size={13} strokeWidth={1.75} className="text-loss flex-shrink-0" />
                <span className="text-xs text-loss font-medium">
                  {pendingList.length} participante{pendingList.length !== 1 ? 's' : ''} com pagamento pendente
                </span>
              </div>
              <div className="flex flex-col divide-y divide-hairline">
                {pendingList.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">
                        {p.name ?? 'Sem nome'}
                      </p>
                      {p.email && (
                        <p className="text-[10px] text-ink-faint truncate">{p.email}</p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-loss bg-loss/8 border border-loss/15 px-2 py-0.5 rounded-full">
                      Pendente
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Quick access (mobile/tablet only) ───────────────────── */}
      <div className="lg:hidden">
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
