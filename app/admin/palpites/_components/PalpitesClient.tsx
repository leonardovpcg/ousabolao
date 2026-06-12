'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText, Loader2, AlertCircle, LayoutGrid, ImageDown } from 'lucide-react'
import { formatDate, APP_TZ } from '@/lib/utils/datetime'
import { PHASES, PHASE_LABELS } from '@/app/admin/jogos/constants'
import type { BetEntry, MatchForBets, ProfileRow, NationalTeam } from '../page'

// ── Helpers ───────────────────────────────────────────────────

function teamAbbr(team: NationalTeam | null): string {
  if (!team) return '?'
  const src = team.country ?? team.name
  return src.slice(0, 3).toUpperCase()
}

function matchDayLabel(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ,
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso))
}

function pointsClass(pts: number): string {
  if (pts === 15) return 'text-brand font-bold'
  if (pts === 5)  return 'text-win font-semibold'
  return 'text-ink-faint'
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
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

// ── MatrixTable ───────────────────────────────────────────────

type BetMap = Map<string, Map<string, BetEntry>>

function MatrixTable({
  filteredMatches,
  rows,
  betMap,
  downloadingMatchId,
  onDownloadImage,
}: {
  filteredMatches: MatchForBets[]
  rows: ProfileRow[]
  betMap: BetMap
  downloadingMatchId: string | null
  onDownloadImage: (matchId: string) => void
}) {
  if (filteredMatches.length === 0) {
    return (
      <div className="rounded-card border border-hairline bg-card card-shadow-sm px-5 py-14 text-center">
        <LayoutGrid size={28} strokeWidth={1.5} className="text-ink-faint/50 mx-auto mb-3" />
        <p className="text-sm font-medium text-ink">Nenhum jogo neste filtro</p>
        <p className="text-xs text-ink-soft mt-1">
          Selecione uma fase diferente ou cadastre jogos em Jogos.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-card border border-hairline card-shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">

          {/* ── Head ── */}
          <thead>
            <tr className="border-b border-hairline">
              {/* Corner */}
              <th
                scope="col"
                className="sticky left-0 z-20 bg-paper border-r border-hairline px-4 py-3 text-left min-w-[148px]"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                  Participante
                </span>
              </th>

              {/* Match columns */}
              {filteredMatches.map(m => {
                const hasResult = m.home_score !== null
                return (
                  <th
                    key={m.id}
                    scope="col"
                    className="bg-paper px-2 py-2 text-center min-w-[80px] max-w-[100px] border-r border-hairline/60 last:border-r-0"
                  >
                    {/* Flags */}
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TeamFlag team={m.home_team} size={14} />
                      <span className="text-[8px] text-ink-faint">×</span>
                      <TeamFlag team={m.away_team} size={14} />
                    </div>
                    {/* Abbrs */}
                    <div className="text-[9px] font-semibold text-ink-soft whitespace-nowrap">
                      {teamAbbr(m.home_team)} × {teamAbbr(m.away_team)}
                    </div>
                    {/* Date */}
                    <div className="text-[8px] text-ink-faint mt-0.5">
                      {matchDayLabel(m.match_date)}
                    </div>
                    {/* Score badge */}
                    {hasResult && (
                      <div className="mt-1 inline-flex items-center gap-0.5 bg-ink/8 rounded-pill px-1.5 py-0.5">
                        <span className="text-[8px] font-bold text-ink nums">
                          {m.home_score}–{m.away_score}
                        </span>
                      </div>
                    )}
                    {/* Download image button */}
                    <div className="mt-1.5">
                      <button
                        onClick={() => onDownloadImage(m.id)}
                        title="Baixar imagem para WhatsApp"
                        className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-hairline transition-colors group"
                      >
                        {downloadingMatchId === m.id
                          ? <Loader2 size={10} className="animate-spin text-ink-soft" />
                          : <ImageDown size={10} strokeWidth={2} className="text-ink-faint group-hover:text-brand transition-colors" />
                        }
                      </button>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={filteredMatches.length + 1}
                  className="px-4 py-10 text-center text-sm text-ink-faint"
                >
                  Nenhum participante encontrado.
                </td>
              </tr>
            ) : rows.map((profile, rowIdx) => {
              const playerBets = betMap.get(profile.id)
              const isPending  = profile.payment_status === 'pending'

              return (
                <tr
                  key={profile.id}
                  className={[
                    'border-b border-hairline/60 last:border-b-0',
                    rowIdx % 2 === 1 ? 'bg-paper/40' : 'bg-card',
                  ].join(' ')}
                >
                  {/* Participant name — sticky */}
                  <td className="sticky left-0 z-10 bg-inherit border-r border-hairline px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-[130px]">
                      <span className="text-sm font-medium text-ink truncate">
                        {profile.name ?? '—'}
                      </span>
                      {isPending && (
                        <span className="flex-shrink-0 text-[8px] font-semibold text-loss/80 bg-loss/8 border border-loss/20 rounded-pill px-1.5 py-0.5 leading-none">
                          Pend.
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Bet cells */}
                  {filteredMatches.map(m => {
                    const bet = playerBets?.get(m.id)
                    const hasResult = m.home_score !== null

                    return (
                      <td
                        key={m.id}
                        className="px-2 py-2.5 text-center border-r border-hairline/40 last:border-r-0"
                      >
                        {bet ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-display text-sm font-semibold text-ink nums leading-none">
                              {bet.home_prediction}×{bet.away_prediction}
                            </span>
                            {hasResult && bet.points !== null && (
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
                </tr>
              )
            })}
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

export function PalpitesClient({ bets, matches, profiles }: Props) {

  // ── Phase init — first phase that has matches ───────────────
  const [selectedPhase, setSelectedPhase] = useState<string>(() => {
    const set = new Set(matches.map(m => m.phase))
    return PHASES.find(p => set.has(p)) ?? 'group_stage'
  })
  const [selectedRound, setSelectedRound] = useState<string>('')
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('')

  // ── Export state ────────────────────────────────────────────
  const [csvLoading, setCsvLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [downloadingMatchId, setDownloadingMatchId] = useState<string | null>(null)

  // ── Derived: available phases ───────────────────────────────
  const availablePhases = useMemo(() => {
    const set = new Set(matches.map(m => m.phase))
    return PHASES.filter(p => set.has(p))
  }, [matches])

  // ── Derived: rounds available for selected phase ────────────
  const availableRounds = useMemo(() => {
    if (selectedPhase !== 'group_stage') return []
    const set = new Set(
      matches
        .filter(m => m.phase === selectedPhase && m.round)
        .map(m => m.round!)
    )
    return ROUNDS.filter(r => set.has(r))
  }, [matches, selectedPhase])

  // ── Derived: filtered matches ───────────────────────────────
  const filteredMatches = useMemo(() =>
    matches.filter(m =>
      m.phase === selectedPhase &&
      (!selectedRound || m.round === selectedRound)
    ), [matches, selectedPhase, selectedRound])

  const matchIdSet = useMemo(() => new Set(filteredMatches.map(m => m.id)), [filteredMatches])

  // ── Derived: filtered bets ──────────────────────────────────
  const filteredBets = useMemo(() =>
    bets.filter(b =>
      b.match_id !== null &&
      matchIdSet.has(b.match_id) &&
      (!selectedParticipantId || b.user_id === selectedParticipantId)
    ), [bets, matchIdSet, selectedParticipantId])

  // ── Derived: bet map userId → matchId → bet ─────────────────
  const betMap: BetMap = useMemo(() => {
    const map = new Map<string, Map<string, BetEntry>>()
    for (const bet of filteredBets) {
      if (!bet.user_id || !bet.match_id) continue
      if (!map.has(bet.user_id)) map.set(bet.user_id, new Map())
      map.get(bet.user_id)!.set(bet.match_id, bet)
    }
    return map
  }, [filteredBets])

  // ── Derived: rows (participants) ────────────────────────────
  const rows = useMemo(() =>
    selectedParticipantId
      ? profiles.filter(p => p.id === selectedParticipantId)
      : profiles
  , [profiles, selectedParticipantId])

  // ── Derived: stats ──────────────────────────────────────────
  const stats = useMemo(() => {
    const expected = rows.length * filteredMatches.length
    const placed   = filteredBets.length
    const pct      = expected > 0 ? Math.round((placed / expected) * 100) : 0
    return { expected, placed, pct, matchCount: filteredMatches.length }
  }, [rows, filteredMatches, filteredBets])

  // ── Reset round when phase changes ─────────────────────────
  const handlePhaseChange = useCallback((phase: string) => {
    setSelectedPhase(phase)
    setSelectedRound('')
  }, [])

  // ── Filter label (for PDF) ──────────────────────────────────
  const filterLabel = useMemo(() => {
    let label = PHASE_LABELS[selectedPhase] ?? selectedPhase
    if (selectedRound) label += ` — ${selectedRound}ª Rodada`
    return label
  }, [selectedPhase, selectedRound])

  // ── CSV export ──────────────────────────────────────────────
  const handleExportCsv = useCallback(() => {
    setCsvLoading(true)
    setExportError(null)
    try {
      const matchHeaders = filteredMatches.map(m =>
        `"${teamAbbr(m.home_team)} x ${teamAbbr(m.away_team)} (${matchDayLabel(m.match_date)})"`
      )
      const header = ['Participante', 'Pgto', ...matchHeaders].join(',')

      const csvRows = rows.map(profile => {
        const playerBets = betMap.get(profile.id)
        const cells = filteredMatches.map(m => {
          const bet = playerBets?.get(m.id)
          if (!bet) return '""'
          const pred = `${bet.home_prediction}x${bet.away_prediction}`
          const pts  = m.home_score !== null && bet.points !== null ? ` (${bet.points}pts)` : ''
          return `"${pred}${pts}"`
        })
        const status = profile.payment_status === 'paid' ? 'Pago' : 'Pendente'
        return [`"${profile.name ?? ''}"`, `"${status}"`, ...cells].join(',')
      })

      const csv = '﻿' + [header, ...csvRows].join('\n')
      const filename = `palpites-${selectedPhase}${selectedRound ? `-r${selectedRound}` : ''}.csv`
      triggerDownload(csv, filename, 'text/csv;charset=utf-8')
    } finally {
      setCsvLoading(false)
    }
  }, [filteredMatches, rows, betMap, selectedPhase, selectedRound])

  // ── PDF export ──────────────────────────────────────────────
  const handleExportPdf = useCallback(async () => {
    setPdfLoading(true)
    setExportError(null)
    try {
      const params = new URLSearchParams({ phase: selectedPhase })
      if (selectedRound)        params.set('round', selectedRound)
      if (selectedParticipantId) params.set('participantId', selectedParticipantId)

      const res = await fetch(`/api/admin/palpites/pdf?${params}`)
      if (!res.ok) { setExportError('Erro ao gerar PDF.'); return }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `palpites-${selectedPhase}${selectedRound ? `-r${selectedRound}` : ''}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportError('Erro ao gerar PDF.')
    } finally {
      setPdfLoading(false)
    }
  }, [selectedPhase, selectedRound, selectedParticipantId])

  // ── Match image download ─────────────────────────────────────
  const handleDownloadMatchImage = useCallback(async (matchId: string) => {
    setDownloadingMatchId(matchId)
    setExportError(null)
    try {
      const res = await fetch(`/api/admin/match-image?matchId=${matchId}`)
      if (!res.ok) {
        const msg = await res.text().catch(() => '')
        setExportError(`Erro ao gerar imagem: ${msg || res.status}`)
        return
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      const cd   = res.headers.get('Content-Disposition') ?? ''
      const name = cd.match(/filename="([^"]+)"/)?.[1] ?? `palpites-${matchId}.png`
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportError('Erro ao gerar imagem.')
    } finally {
      setDownloadingMatchId(null)
    }
  }, [])

  // ── Render ──────────────────────────────────────────────────

  return (
    <div>
      {/* ── Filters + Export row ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Phase */}
          <div className="relative">
            <select
              value={selectedPhase}
              onChange={e => handlePhaseChange(e.target.value)}
              className={selectCls}
              aria-label="Fase"
            >
              {availablePhases.length === 0 ? (
                <option value="">Sem jogos cadastrados</option>
              ) : availablePhases.map(p => (
                <option key={p} value={p}>{PHASE_LABELS[p] ?? p}</option>
              ))}
            </select>
          </div>

          {/* Round (group_stage only) */}
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

          {/* Participant */}
          {profiles.length > 0 && (
            <div className="relative">
              <select
                value={selectedParticipantId}
                onChange={e => setSelectedParticipantId(e.target.value)}
                className={selectCls}
                aria-label="Participante"
              >
                <option value="">Todos os participantes</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name ?? '(sem nome)'}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleExportCsv}
            disabled={csvLoading || filteredMatches.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-btn border border-hairline bg-card text-ink text-xs font-semibold hover:bg-hairline active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {csvLoading
              ? <Loader2 size={13} className="animate-spin" />
              : <Download size={13} strokeWidth={2} />
            }
            CSV
          </button>
          <button
            onClick={handleExportPdf}
            disabled={pdfLoading || filteredMatches.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-btn border border-hairline bg-card text-ink text-xs font-semibold hover:bg-hairline active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {pdfLoading
              ? <Loader2 size={13} className="animate-spin" />
              : <FileText size={13} strokeWidth={2} />
            }
            PDF
          </button>
        </div>
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

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft bg-card border border-hairline rounded-pill px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
          <span className="nums font-semibold">{stats.matchCount}</span> {stats.matchCount === 1 ? 'jogo' : 'jogos'}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft bg-card border border-hairline rounded-pill px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
          <span className="nums font-semibold">{stats.placed}</span> palpites registrados
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft bg-card border border-hairline rounded-pill px-3 py-1">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stats.pct === 100 ? 'bg-win' : stats.pct > 50 ? 'bg-brand' : 'bg-ink-faint'}`} />
          <span className="nums font-semibold">{stats.pct}%</span> de cobertura
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-faint bg-card-sunken border border-hairline rounded-pill px-3 py-1">
          {filterLabel}
        </span>
      </div>

      {/* ── Matrix table ─────────────────────────────────────── */}
      <MatrixTable
        filteredMatches={filteredMatches}
        rows={rows}
        betMap={betMap}
        downloadingMatchId={downloadingMatchId}
        onDownloadImage={handleDownloadMatchImage}
      />
    </div>
  )
}
