'use client'

import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, Loader2, AlertCircle, Trophy } from 'lucide-react'
import { formatDate, APP_TZ } from '@/lib/utils/datetime'
import { PHASES, PHASE_LABELS } from '@/app/admin/jogos/constants'
import type { BetEntry, MatchForBets, ProfileRow, NationalTeam } from '../page'

// ── Helpers ───────────────────────────────────────────────────

function teamAbbr(team: NationalTeam | null): string {
  if (!team) return '?'
  const src = team.country ?? team.name
  return src.slice(0, 3).toUpperCase()
}

function matchTimeLabel(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function pointsClass(pts: number): string {
  if (pts === 15) return 'text-brand font-bold'
  if (pts === 5)  return 'text-win font-semibold'
  return 'text-ink-faint'
}

const selectCls = [
  'rounded-input border border-hairline bg-card-sunken',
  'px-3 py-2 text-sm text-ink appearance-none cursor-pointer',
  'outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all',
].join(' ')

const ROUNDS = ['1', '2', '3'] as const

// ── TeamFlag ──────────────────────────────────────────────────

function TeamFlag({ team, size = 16 }: { team: NationalTeam | null; size?: number }) {
  if (!team) return <span className="text-[10px] text-ink-faint">?</span>
  if (team.emblem_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.emblem_url}
        alt={team.name}
        width={size}
        height={Math.round(size * 0.75)}
        className="rounded-[2px] object-cover flex-shrink-0"
      />
    )
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-[3px] bg-card-sunken border border-hairline text-[9px] font-bold text-ink-soft flex-shrink-0"
      style={{ width: size, height: Math.round(size * 0.75) }}
    >
      {teamAbbr(team)}
    </span>
  )
}

// ── ResultadosTable ───────────────────────────────────────────

type PlayerRow = {
  id: string
  name: string
  windowPoints: number
  bets: Map<string, BetEntry>  // matchId → bet
}

function ResultadosTable({
  finishedMatches,
  playerRows,
}: {
  finishedMatches: MatchForBets[]
  playerRows: PlayerRow[]
}) {
  if (finishedMatches.length === 0) {
    return (
      <div className="rounded-card border border-hairline bg-card card-shadow-sm px-5 py-14 text-center">
        <Trophy size={28} strokeWidth={1.5} className="text-ink-faint/50 mx-auto mb-3" />
        <p className="text-sm font-medium text-ink">Nenhum jogo encerrado neste filtro</p>
        <p className="text-xs text-ink-soft mt-1">
          Os resultados aparecem aqui após o admin lançar os placares.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-card border border-hairline card-shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">

          {/* Head */}
          <thead>
            <tr className="border-b border-hairline">
              {/* Participant column */}
              <th
                scope="col"
                className="sticky left-0 z-20 bg-paper border-r border-hairline px-4 py-3 text-left min-w-[148px]"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                  Participante
                </span>
              </th>

              {/* Match columns */}
              {finishedMatches.map(m => (
                <th
                  key={m.id}
                  scope="col"
                  className="bg-paper px-2 py-2 text-center min-w-[80px] max-w-[100px] border-r border-hairline/60 last-of-type:border-r-0"
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TeamFlag team={m.home_team} size={14} />
                    <span className="text-[8px] text-ink-faint">×</span>
                    <TeamFlag team={m.away_team} size={14} />
                  </div>
                  <div className="text-[9px] font-semibold text-ink-soft whitespace-nowrap">
                    {teamAbbr(m.home_team)} × {teamAbbr(m.away_team)}
                  </div>
                  <div className="text-[8px] text-ink-faint mt-0.5">{matchTimeLabel(m.match_date)}</div>
                  {/* Official score — always present in finished matches */}
                  <div className="mt-1 inline-flex items-center gap-0.5 bg-brand/10 rounded-pill px-1.5 py-0.5">
                    <span className="text-[9px] font-bold text-brand nums">
                      {m.home_score}–{m.away_score}
                    </span>
                  </div>
                </th>
              ))}

              {/* Total column */}
              <th
                scope="col"
                className="sticky right-0 z-20 bg-paper border-l border-hairline/60 px-3 py-3 text-center min-w-[56px]"
              >
                <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Pts</span>
              </th>
            </tr>
          </thead>

          {/* Body — sorted by window points desc */}
          <tbody>
            {playerRows.length === 0 ? (
              <tr>
                <td
                  colSpan={finishedMatches.length + 2}
                  className="px-4 py-10 text-center text-sm text-ink-faint"
                >
                  Nenhum participante encontrado.
                </td>
              </tr>
            ) : playerRows.map((player, rowIdx) => (
              <tr
                key={player.id}
                className={[
                  'border-b border-hairline/60 last:border-b-0',
                  rowIdx % 2 === 1 ? 'bg-paper/40' : 'bg-card',
                ].join(' ')}
              >
                {/* Name + rank badge */}
                <td className="sticky left-0 z-10 bg-inherit border-r border-hairline px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-[130px]">
                    <span className="text-[9px] font-bold text-ink-faint nums w-4 text-right flex-shrink-0">
                      {rowIdx + 1}
                    </span>
                    <span className="text-sm font-medium text-ink truncate">
                      {player.name}
                    </span>
                  </div>
                </td>

                {/* Bet cells */}
                {finishedMatches.map(m => {
                  const bet = player.bets.get(m.id)
                  return (
                    <td
                      key={m.id}
                      className="px-2 py-2.5 text-center border-r border-hairline/40 last-of-type:border-r-0"
                    >
                      {bet ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-display text-sm font-semibold text-ink nums leading-none">
                            {bet.home_prediction}×{bet.away_prediction}
                          </span>
                          {bet.points !== null && (
                            <span className={`text-[9px] nums leading-none ${pointsClass(bet.points)}`}>
                              {bet.points}pts
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-faint/50 text-xs select-none">—</span>
                      )}
                    </td>
                  )
                })}

                {/* Total pts */}
                <td className="sticky right-0 z-10 bg-inherit border-l border-hairline/60 px-3 py-2.5 text-center">
                  <span className="font-display text-base font-bold text-brand nums">
                    {player.windowPoints}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────

type Props = {
  bets: BetEntry[]
  matches: MatchForBets[]
  profiles: ProfileRow[]
}

export function ResultadosClient({ bets, matches, profiles }: Props) {
  const [selectedPhase, setSelectedPhase] = useState<string>(() => {
    const set = new Set(matches.filter(m => m.home_score !== null).map(m => m.phase))
    return PHASES.find(p => set.has(p)) ?? 'group_stage'
  })
  const [selectedRound, setSelectedRound] = useState<string>('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Phases that have at least one finished match
  const availablePhases = useMemo(() => {
    const set = new Set(matches.filter(m => m.home_score !== null).map(m => m.phase))
    return PHASES.filter(p => set.has(p))
  }, [matches])

  const availableRounds = useMemo(() => {
    if (selectedPhase !== 'group_stage') return []
    const set = new Set(
      matches
        .filter(m => m.phase === selectedPhase && m.home_score !== null && m.round)
        .map(m => m.round!)
    )
    return ROUNDS.filter(r => set.has(r))
  }, [matches, selectedPhase])

  // Only finished matches
  const finishedMatches = useMemo(() =>
    matches.filter(m =>
      m.phase === selectedPhase &&
      m.home_score !== null &&
      (!selectedRound || m.round === selectedRound)
    ), [matches, selectedPhase, selectedRound])

  const matchIdSet = useMemo(() => new Set(finishedMatches.map(m => m.id)), [finishedMatches])

  // Build player rows sorted by window pts desc
  const playerRows = useMemo<PlayerRow[]>(() => {
    return profiles
      .map(profile => {
        const playerBets = new Map<string, BetEntry>()
        let windowPoints = 0
        for (const b of bets) {
          if (b.user_id !== profile.id || !b.match_id || !matchIdSet.has(b.match_id)) continue
          playerBets.set(b.match_id, b)
          windowPoints += b.points ?? 0
        }
        return { id: profile.id, name: profile.name ?? '—', windowPoints, bets: playerBets }
      })
      .sort((a, b) => b.windowPoints - a.windowPoints)
  }, [profiles, bets, matchIdSet])

  const handlePhaseChange = useCallback((phase: string) => {
    setSelectedPhase(phase)
    setSelectedRound('')
  }, [])

  // Stats
  const totalPts = playerRows.reduce((sum, r) => sum + r.windowPoints, 0)
  const filterLabel = useMemo(() => {
    let label = PHASE_LABELS[selectedPhase] ?? selectedPhase
    if (selectedRound) label += ` — ${selectedRound}ª Rodada`
    return label
  }, [selectedPhase, selectedRound])

  const handleExportPdf = useCallback(async () => {
    setPdfLoading(true)
    setExportError(null)
    try {
      const params = new URLSearchParams({ phase: selectedPhase })
      if (selectedRound) params.set('round', selectedRound)
      const res = await fetch(`/api/admin/resultados/pdf?${params}`)
      if (!res.ok) { setExportError('Erro ao gerar PDF.'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `resultados-${selectedPhase}${selectedRound ? `-r${selectedRound}` : ''}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportError('Erro ao gerar PDF.')
    } finally {
      setPdfLoading(false)
    }
  }, [selectedPhase, selectedRound])

  return (
    <div>
      {/* Filters + export */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {availablePhases.length === 0 ? (
            <span className="text-sm text-ink-faint">Nenhum jogo encerrado ainda.</span>
          ) : (
            <>
              <div className="relative">
                <select
                  value={selectedPhase}
                  onChange={e => handlePhaseChange(e.target.value)}
                  className={selectCls}
                  aria-label="Fase"
                >
                  {availablePhases.map(p => (
                    <option key={p} value={p}>{PHASE_LABELS[p] ?? p}</option>
                  ))}
                </select>
              </div>
              {selectedPhase === 'group_stage' && availableRounds.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedRound}
                    onChange={e => setSelectedRound(e.target.value)}
                    className={selectCls}
                    aria-label="Rodada"
                  >
                    <option value="">Todas as rodadas</option>
                    {availableRounds.map(r => (
                      <option key={r} value={r}>{r}ª Rodada</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        <button
          onClick={handleExportPdf}
          disabled={pdfLoading || finishedMatches.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-btn border border-hairline bg-card text-ink text-xs font-semibold hover:bg-hairline active:scale-[0.98] transition-all disabled:opacity-40 flex-shrink-0"
        >
          {pdfLoading
            ? <Loader2 size={13} className="animate-spin" />
            : <FileText size={13} strokeWidth={2} />
          }
          PDF
        </button>
      </div>

      {/* Export error */}
      <AnimatePresence>
        {exportError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-input border border-loss/25 bg-loss/6 px-4 py-2.5 text-sm text-loss mb-4"
          >
            <AlertCircle size={13} strokeWidth={2} />
            {exportError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      {finishedMatches.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft bg-card border border-hairline rounded-pill px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
            <span className="nums font-semibold">{finishedMatches.length}</span>{' '}
            {finishedMatches.length === 1 ? 'jogo encerrado' : 'jogos encerrados'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft bg-card border border-hairline rounded-pill px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
            <span className="nums font-semibold">{totalPts}</span> pts distribuídos
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-faint bg-card-sunken border border-hairline rounded-pill px-3 py-1">
            {filterLabel}
          </span>
        </div>
      )}

      {/* Table */}
      <ResultadosTable finishedMatches={finishedMatches} playerRows={playerRows} />
    </div>
  )
}
