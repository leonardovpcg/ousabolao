'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  CheckCircle2, Clock, Lock, Circle, Repeat2,
  Loader2, AlertCircle, ChevronDown, Unlock,
} from 'lucide-react'
import {
  updateLockMinutes,
  toggleBetMode,
  setCurrentPhase,
  openPhase,
  openRound,
} from '../actions'
import { formatDate, formatTime } from '@/lib/utils/datetime'
import type { PhaseRow, PhaseRoundRow, DeadlineEntry } from '../page'

// ── Constants ─────────────────────────────────────────────────

const ROUND_LABELS: Record<string, string> = {
  '1': '1ª Rodada',
  '2': '2ª Rodada',
  '3': '3ª Rodada',
}

const STATUS_CFG: Record<string, {
  label: string
  badgeCls: string
  borderCls: string
  icon: React.ElementType
}> = {
  upcoming: {
    label: 'Próxima',
    badgeCls: 'bg-card-sunken text-ink-faint border-hairline',
    borderCls: 'border-l-hairline',
    icon: Circle,
  },
  open: {
    label: 'Aberta',
    badgeCls: 'bg-win/10 text-win border-win/20',
    borderCls: 'border-l-win',
    icon: Unlock,
  },
  locked: {
    label: 'Encerrada',
    badgeCls: 'bg-brand/10 text-brand border-brand/20',
    borderCls: 'border-l-brand',
    icon: Lock,
  },
  concluded: {
    label: 'Concluída',
    badgeCls: 'bg-ink/6 text-ink-soft border-hairline',
    borderCls: 'border-l-ink/25',
    icon: CheckCircle2,
  },
}

// ── Helpers ───────────────────────────────────────────────────

function formatDeadline(iso: string | null): string {
  if (!iso) return ''
  return `${formatDate(iso)} · ${formatTime(iso)}`
}

function DeadlineText({
  locksAt,
  firstMatchAt,
  lockMinutes,
}: {
  locksAt: string | null
  firstMatchAt: string | null
  lockMinutes: number
}) {
  if (!firstMatchAt) {
    return (
      <span className="text-ink-faint italic">aguardando cadastro de jogos</span>
    )
  }
  if (!locksAt) {
    return <span className="text-ink-faint">configure X minutos</span>
  }
  return (
    <span className="text-ink-soft">
      {formatDeadline(locksAt)}
      <span className="text-ink-faint ml-1.5 text-[10px]">
        ({lockMinutes}min antes do 1º jogo)
      </span>
    </span>
  )
}

// ── Per-phase state helpers ───────────────────────────────────

type PhaseState = {
  lockInput: number
  lockSaving: boolean
  lockError: string | null
  toggling: boolean
  opening: boolean
  error: string | null
}

type RoundState = {
  opening: boolean
  error: string | null
}

// ── Main component ────────────────────────────────────────────

type Props = {
  phases: PhaseRow[]
  rounds: PhaseRoundRow[]
  deadlines: DeadlineEntry[]
  currentPhase: string | null
  poolSettingsId: string
}

export function FasesClient({
  phases,
  rounds,
  deadlines,
  currentPhase,
  poolSettingsId,
}: Props) {
  const router = useRouter()

  // ── Current-phase selector ────────────────────────────────
  const [selectedPhase, setSelectedPhase] = useState(currentPhase ?? '')
  const [savingCurrent, setSavingCurrent] = useState(false)
  const [currentPhaseError, setCurrentPhaseError] = useState<string | null>(null)
  const currentPhaseDirty = selectedPhase !== (currentPhase ?? '')

  const handleSetCurrentPhase = useCallback(async () => {
    if (!selectedPhase || !currentPhaseDirty) return
    setSavingCurrent(true)
    setCurrentPhaseError(null)
    const result = await setCurrentPhase(poolSettingsId, selectedPhase)
    setSavingCurrent(false)
    if (result && 'error' in result) {
      setCurrentPhaseError(result.error)
    } else {
      router.refresh()
    }
  }, [selectedPhase, currentPhaseDirty, poolSettingsId, router])

  // ── Per-phase state ───────────────────────────────────────
  const [phaseStates, setPhaseStates] = useState<Record<string, Partial<PhaseState>>>({})

  function patchPhase(id: string, patch: Partial<PhaseState>) {
    setPhaseStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  function getPhase(p: PhaseRow): PhaseState {
    return {
      lockInput: p.lock_minutes_before ?? 30,
      lockSaving: false,
      lockError: null,
      toggling: false,
      opening: false,
      error: null,
      ...phaseStates[p.id],
    }
  }

  const getLockInput = (p: PhaseRow) =>
    phaseStates[p.id]?.lockInput ?? (p.lock_minutes_before ?? 30)

  const isLockDirty = (p: PhaseRow) => {
    const input = phaseStates[p.id]?.lockInput
    if (input === undefined) return false
    return input !== (p.lock_minutes_before ?? 30)
  }

  const handleLockChange = (phaseId: string, val: number) => {
    patchPhase(phaseId, { lockInput: val })
  }

  const handleSaveLock = useCallback(async (phaseId: string, minutes: number) => {
    patchPhase(phaseId, { lockSaving: true, lockError: null })
    const result = await updateLockMinutes(phaseId, minutes)
    patchPhase(phaseId, { lockSaving: false })
    if (result && 'error' in result) {
      patchPhase(phaseId, { lockError: result.error })
    } else {
      patchPhase(phaseId, { lockInput: minutes })
      router.refresh()
    }
  }, [router])

  const handleToggleBetMode = useCallback(async (phaseId: string) => {
    patchPhase(phaseId, { toggling: true, error: null })
    const result = await toggleBetMode(phaseId)
    patchPhase(phaseId, { toggling: false })
    if (result && 'error' in result) {
      patchPhase(phaseId, { error: result.error })
    } else {
      router.refresh()
    }
  }, [router])

  const handleOpenPhase = useCallback(async (phaseId: string) => {
    patchPhase(phaseId, { opening: true, error: null })
    const result = await openPhase(phaseId)
    patchPhase(phaseId, { opening: false })
    if (result && 'error' in result) {
      patchPhase(phaseId, { error: result.error })
    } else {
      router.refresh()
    }
  }, [router])

  // ── Per-round state ───────────────────────────────────────
  const [roundStates, setRoundStates] = useState<Record<string, Partial<RoundState>>>({})

  function patchRound(key: string, patch: Partial<RoundState>) {
    setRoundStates(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  function getRound(round: string): RoundState {
    return { opening: false, error: null, ...roundStates[round] }
  }

  const handleOpenRound = useCallback(async (round: string) => {
    patchRound(round, { opening: true, error: null })
    const result = await openRound(round)
    patchRound(round, { opening: false })
    if (result && 'error' in result) {
      patchRound(round, { error: result.error })
    } else {
      router.refresh()
    }
  }, [router])

  // ── Deadline lookup ───────────────────────────────────────
  const getDeadline = (phaseKey: string, round?: string) =>
    deadlines.find(d => d.phaseKey === phaseKey && d.round === round)

  // ── Input / select classes ────────────────────────────────
  const inputCls = [
    'rounded-input border border-hairline bg-card-sunken',
    'px-3 py-2 text-sm text-ink',
    'outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card transition-all',
  ].join(' ')

  const selectCls = inputCls + ' cursor-pointer pr-8'

  // ── Render ────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
          Fases
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          Ciclo de palpites da Copa 2026
        </p>
      </div>

      {/* ── Current-phase card ─────────────────────────────── */}
      <div className="rounded-card bg-card border border-hairline card-shadow-sm p-5 mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-3">
          Fase atual do torneio
        </p>
        <p className="text-xs text-ink-soft mb-3">
          Define qual fase aparece no Palpite e no Início para os jogadores.
        </p>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedPhase}
              onChange={e => setSelectedPhase(e.target.value)}
              className={selectCls + ' w-full'}
            >
              <option value="" disabled>Selecionar fase…</option>
              {phases.map(p => (
                <option key={p.phase} value={p.phase}>{p.label}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              strokeWidth={1.5}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
          </div>

          {currentPhaseDirty && (
            <button
              onClick={handleSetCurrentPhase}
              disabled={savingCurrent}
              className="flex items-center gap-2 rounded-btn bg-ink px-4 py-2 text-sm font-semibold text-card hover:bg-ink/90 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {savingCurrent ? <Loader2 size={13} className="animate-spin" /> : null}
              Definir
            </button>
          )}
        </div>

        {currentPhaseError && (
          <p className="flex items-center gap-1.5 mt-2 text-xs text-loss">
            <AlertCircle size={12} strokeWidth={2} />
            {currentPhaseError}
          </p>
        )}
      </div>

      {/* ── Phase timeline ─────────────────────────────────── */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-hairline hidden sm:block" aria-hidden />

        <motion.div
          className="flex flex-col gap-3"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          {phases.map((p) => {
            const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.upcoming
            const StatusIcon = cfg.icon
            const ps = getPhase(p)
            const lockInput = getLockInput(p)
            const lockDirty = isLockDirty(p)
            const isGroupStage = p.phase === 'group_stage'
            const isEditable = !['locked', 'concluded'].includes(p.status)
            const deadline = getDeadline(p.phase)
            const phaseRounds = rounds.filter(r => r.phase === p.phase)

            return (
              <motion.div
                key={p.id}
                variants={{
                  hidden: { opacity: 0, x: -8 },
                  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
                }}
                className="flex items-start gap-4"
              >
                {/* Timeline dot */}
                <div className={[
                  'hidden sm:flex w-10 h-10 rounded-full border-2 items-center justify-center flex-shrink-0 mt-0.5 bg-card z-10',
                  p.status === 'open'
                    ? 'border-win text-win'
                    : p.status === 'locked'
                    ? 'border-brand text-brand'
                    : p.status === 'concluded'
                    ? 'border-ink/25 text-ink-faint'
                    : 'border-hairline text-ink-faint',
                ].join(' ')}>
                  <StatusIcon size={15} strokeWidth={1.75} />
                </div>

                {/* Phase card */}
                <div className={[
                  'flex-1 rounded-card bg-card border border-l-[3px] card-shadow-sm overflow-hidden',
                  'border-hairline',
                  cfg.borderCls,
                ].join(' ')}>
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-display text-sm font-semibold text-ink truncate">
                        {p.label}
                      </span>
                      {p.phase === currentPhase && (
                        <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-pill bg-brand/12 text-brand border border-brand/20">
                          Atual
                        </span>
                      )}
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-pill border ${cfg.badgeCls} flex-shrink-0`}>
                      <StatusIcon size={9} strokeWidth={2.5} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-3.5 space-y-3.5">
                    {/* Bet-mode toggle — group_stage only */}
                    {isGroupStage && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-ink-soft">Modo de palpite</p>
                        <button
                          onClick={() => handleToggleBetMode(p.id)}
                          disabled={ps.toggling || !isEditable}
                          className={[
                            'flex items-center gap-2 px-3 py-1.5 rounded-btn border text-xs font-medium transition-all',
                            'disabled:opacity-40 disabled:cursor-not-allowed',
                            p.bet_mode === 'per_round'
                              ? 'border-brand/30 bg-brand/8 text-brand hover:bg-brand/15'
                              : 'border-hairline bg-card-sunken text-ink-soft hover:bg-hairline hover:text-ink',
                          ].join(' ')}
                          title={!isEditable ? 'Fase encerrada — modo não alterável' : undefined}
                        >
                          {ps.toggling ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Repeat2 size={11} strokeWidth={1.75} />
                          )}
                          {p.bet_mode === 'per_round' ? 'Por rodada' : 'Fase inteira'}
                        </button>
                      </div>
                    )}

                    {/* Lock-minutes editor */}
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-ink-soft flex-shrink-0">Antecedência</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={1440}
                          value={lockInput}
                          disabled={!isEditable}
                          onChange={e => handleLockChange(p.id, Number(e.target.value))}
                          className={[
                            inputCls,
                            'w-16 text-center nums',
                            !isEditable && 'opacity-50 cursor-not-allowed',
                          ].join(' ')}
                        />
                        <span className="text-xs text-ink-faint whitespace-nowrap">min antes do 1º jogo</span>
                        {lockDirty && (
                          <button
                            onClick={() => handleSaveLock(p.id, lockInput)}
                            disabled={ps.lockSaving}
                            className="px-2.5 py-1 rounded-[8px] bg-ink text-card text-[11px] font-semibold hover:bg-ink/85 disabled:opacity-40 transition-colors"
                          >
                            {ps.lockSaving ? <Loader2 size={10} className="animate-spin" /> : 'Salvar'}
                          </button>
                        )}
                      </div>
                      {ps.lockError && (
                        <span className="text-[11px] text-loss flex items-center gap-1">
                          <AlertCircle size={10} strokeWidth={2} />
                          {ps.lockError}
                        </span>
                      )}
                    </div>

                    {/* Deadline(s) */}
                    {isGroupStage && p.bet_mode === 'per_round' ? (
                      // Per-round deadlines + round cards
                      <div className="space-y-2 pt-0.5">
                        {phaseRounds.length > 0 ? (
                          phaseRounds.map(r => {
                            const rDeadline = getDeadline(p.phase, r.round)
                            const rCfg = STATUS_CFG[r.status] ?? STATUS_CFG.upcoming
                            const RIcon = rCfg.icon
                            const rs = getRound(r.round)

                            return (
                              <div
                                key={r.round}
                                className="flex items-center justify-between rounded-[10px] border border-hairline bg-card-sunken/60 px-3.5 py-2.5 gap-3"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-semibold text-ink-soft">
                                      {ROUND_LABELS[r.round] ?? `Rodada ${r.round}`}
                                    </span>
                                    <span className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-px rounded-pill border ${rCfg.badgeCls}`}>
                                      <RIcon size={7} strokeWidth={2.5} />
                                      {rCfg.label}
                                    </span>
                                  </div>
                                  <p className="text-[11px]">
                                    <span className="text-ink-faint mr-1">Prazo:</span>
                                    <DeadlineText
                                      locksAt={rDeadline?.locksAt ?? null}
                                      firstMatchAt={rDeadline?.firstMatchAt ?? null}
                                      lockMinutes={p.lock_minutes_before}
                                    />
                                  </p>
                                  {rs.error && (
                                    <p className="text-[10px] text-loss mt-0.5 flex items-center gap-1">
                                      <AlertCircle size={9} strokeWidth={2} />
                                      {rs.error}
                                    </p>
                                  )}
                                </div>

                                {r.status === 'upcoming' && (
                                  <button
                                    onClick={() => handleOpenRound(r.round)}
                                    disabled={rs.opening}
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-ink text-card text-[11px] font-semibold hover:bg-ink/85 active:scale-[0.98] disabled:opacity-40 transition-all"
                                  >
                                    {rs.opening ? (
                                      <Loader2 size={10} className="animate-spin" />
                                    ) : (
                                      <Unlock size={10} strokeWidth={2} />
                                    )}
                                    Abrir
                                  </button>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-xs text-ink-faint italic">
                            Rodadas não encontradas — rode a migration 06.
                          </p>
                        )}
                      </div>
                    ) : (
                      // Whole-phase deadline
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs">
                          <span className="text-ink-faint mr-1">Prazo:</span>
                          <DeadlineText
                            locksAt={deadline?.locksAt ?? null}
                            firstMatchAt={deadline?.firstMatchAt ?? null}
                            lockMinutes={p.lock_minutes_before}
                          />
                        </p>

                        {p.status === 'upcoming' && (
                          <button
                            onClick={() => handleOpenPhase(p.id)}
                            disabled={ps.opening || !deadline?.firstMatchAt}
                            title={!deadline?.firstMatchAt ? 'Cadastre jogos desta fase antes de abrir' : undefined}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-btn bg-ink text-card text-xs font-semibold hover:bg-ink/85 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            {ps.opening ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Unlock size={12} strokeWidth={2} />
                            )}
                            Abrir palpites
                          </button>
                        )}
                      </div>
                    )}

                    {/* Phase-level error */}
                    {ps.error && (
                      <p className="flex items-center gap-1.5 text-xs text-loss">
                        <AlertCircle size={12} strokeWidth={2} />
                        {ps.error}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Empty state */}
      {phases.length === 0 && (
        <div className="rounded-card border border-hairline bg-card card-shadow-sm px-5 py-12 text-center">
          <Clock size={28} strokeWidth={1.5} className="text-ink-faint/50 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink">Nenhuma fase configurada</p>
          <p className="text-xs text-ink-soft mt-1">
            Rode a migration 01 para criar as fases da Copa.
          </p>
        </div>
      )}
    </div>
  )
}
