'use client'

import { useState, useEffect, useActionState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Loader2, CheckCircle2, CalendarDays } from 'lucide-react'
import { createMatch, deleteMatch } from '../actions'
import { PHASE_LABELS } from '../constants'
import { formatTime, formatDate } from '@/lib/utils/datetime'
import { MatchModal } from './MatchModal'
import type { NationalTeam, MatchWithTeams, TournamentPhase } from '../page'

// ── Static config ─────────────────────────────────────────────

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const ROUNDS = ['1','2','3']
const ROUND_LABELS: Record<string, string> = {
  '1': '1ª Rodada',
  '2': '2ª Rodada',
  '3': '3ª Rodada',
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Agendado', cls: 'bg-card-sunken text-ink-soft border-hairline' },
  live:      { label: 'Ao Vivo',  cls: 'bg-win/10 text-win border-win/20' },
  finished:  { label: 'Encerrado', cls: 'bg-ink/6 text-ink-soft border-hairline' },
  cancelled: { label: 'Cancelado', cls: 'bg-loss/10 text-loss border-loss/20' },
}

// ── Grouping helpers ──────────────────────────────────────────

type RoundEntry  = { round: string; matches: MatchWithTeams[] }
type GroupEntry  = { group: string; rounds: RoundEntry[] }
type PhaseEntry  =
  | { phase: string; label: string; kind: 'group_stage'; groups: GroupEntry[]; ungrouped: MatchWithTeams[] }
  | { phase: string; label: string; kind: 'knockout'; matches: MatchWithTeams[] }

function buildPhaseList(matches: MatchWithTeams[], phases: TournamentPhase[]): PhaseEntry[] {
  const order = phases.map(p => p.phase)
  const getLabel = (key: string) =>
    phases.find(p => p.phase === key)?.label ?? PHASE_LABELS[key] ?? key

  return order.reduce<PhaseEntry[]>((acc, key) => {
    const pm = matches.filter(m => m.phase === key)
    if (pm.length === 0) return acc

    if (key === 'group_stage') {
      const groupKeys = [
        ...new Set(pm.map(m => m.match_group).filter(Boolean) as string[]),
      ].sort()
      const groups: GroupEntry[] = groupKeys.map(gk => {
        const gm = pm.filter(m => m.match_group === gk)
        const roundKeys = [
          ...new Set(gm.map(m => m.round).filter(Boolean) as string[]),
        ].sort()
        return {
          group: gk,
          rounds: roundKeys.map(rk => ({
            round: rk,
            matches: gm.filter(m => m.round === rk),
          })),
        }
      })
      acc.push({
        phase: key,
        label: getLabel(key),
        kind: 'group_stage',
        groups,
        ungrouped: pm.filter(m => !m.match_group),
      })
    } else {
      acc.push({ phase: key, label: getLabel(key), kind: 'knockout', matches: pm })
    }
    return acc
  }, [])
}

// ── Sub-components ────────────────────────────────────────────

function TeamFlag({ team }: { team: NationalTeam | null }) {
  if (!team) {
    return (
      <div className="w-7 h-7 rounded-sm bg-card-sunken border border-hairline flex-shrink-0" />
    )
  }
  if (team.emblem_url) {
    return (
      <img
        src={team.emblem_url}
        alt={team.name}
        className="w-7 h-7 object-contain flex-shrink-0 rounded-sm"
      />
    )
  }
  return (
    <div className="w-7 h-7 rounded-sm bg-card-sunken border border-hairline flex items-center justify-center text-[9px] font-bold text-ink-faint flex-shrink-0">
      {team.name.slice(0, 3).toUpperCase()}
    </div>
  )
}


type MatchCardProps = {
  match: MatchWithTeams
  onEdit: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
  confirmDeleteId: string | null
  deletingId: string | null
}

function MatchCard({
  match,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  confirmDeleteId,
  deletingId,
}: MatchCardProps) {
  const cfg = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.scheduled
  const isFinished = match.status === 'finished'
  const isConfirming = confirmDeleteId === match.id
  const isDeleting = deletingId === match.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className="rounded-card bg-card border border-hairline card-shadow-sm overflow-hidden group"
    >
      {/* Teams + time row */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
        {/* Home */}
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          <TeamFlag team={match.home_team} />
          <span className="text-sm font-medium text-ink truncate">
            {match.home_team?.name ?? '—'}
          </span>
        </div>

        {/* Center */}
        <div className="flex-shrink-0 w-16 text-center">
          {isFinished ? (
            <p className="font-display text-xl font-bold text-ink nums leading-none">
              {match.home_score ?? 0}
              <span className="text-ink-faint text-base mx-0.5">×</span>
              {match.away_score ?? 0}
            </p>
          ) : (
            <p className="font-display text-sm font-semibold text-brand nums tracking-tight">
              {formatTime(match.match_date)}
            </p>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-1 items-center gap-2.5 justify-end min-w-0">
          <span className="text-sm font-medium text-ink truncate text-right">
            {match.away_team?.name ?? '—'}
          </span>
          <TeamFlag team={match.away_team} />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between px-4 pb-3">
        <p className="text-[11px] text-ink-faint">
          {formatDate(match.match_date)}
          {match.match_group && (
            <> · <span className="font-medium">Gr. {match.match_group}</span></>
          )}
          {match.round && (
            <> · {ROUND_LABELS[match.round] ?? `Rod. ${match.round}`}</>
          )}
        </p>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-pill border ${cfg.cls}`}>
            {cfg.label}
          </span>

          <div className="flex items-center gap-0.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-[8px] text-ink-faint hover:bg-hairline hover:text-ink transition-colors"
              title="Editar"
            >
              <Pencil size={12} strokeWidth={1.5} />
            </button>
            {isConfirming ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={onDeleteConfirm}
                  disabled={isDeleting}
                  className="px-2 py-1 rounded-[6px] bg-loss/10 text-loss text-[11px] font-semibold hover:bg-loss/20 transition-colors"
                >
                  {isDeleting ? <Loader2 size={10} className="animate-spin" /> : 'Excluir'}
                </button>
                <button
                  onClick={onDeleteCancel}
                  className="px-2 py-1 rounded-[6px] bg-card-sunken text-ink-soft text-[11px] hover:bg-hairline transition-colors"
                >
                  Não
                </button>
              </div>
            ) : (
              <button
                onClick={onDeleteRequest}
                className="p-1.5 rounded-[8px] text-ink-faint hover:bg-hairline hover:text-loss transition-colors"
                title="Excluir"
              >
                <Trash2 size={12} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── MatchesTab ────────────────────────────────────────────────

type Props = {
  teams: NationalTeam[]
  matches: MatchWithTeams[]
  phases: TournamentPhase[]
}

const inputCls = [
  'w-full rounded-input border border-hairline bg-card-sunken',
  'px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint',
  'outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card',
].join(' ')
const selectCls = inputCls + ' cursor-pointer'
const labelCls = 'block text-xs font-semibold uppercase tracking-widest text-ink-faint mb-1.5'

export function MatchesTab({ teams, matches, phases }: Props) {
  const router = useRouter()

  // ── Context (sticky across submissions) ──────────────────
  const [selectedPhase, setSelectedPhase] = useState(phases[0]?.phase ?? 'group_stage')
  const [selectedGroup, setSelectedGroup] = useState('A')
  const [selectedRound, setSelectedRound] = useState('1')
  const isGroupStage = selectedPhase === 'group_stage'

  // ── Form reset key: incrementing remounts the form ───────
  const [formKey, setFormKey] = useState(0)
  const [justAdded, setJustAdded] = useState(false)

  const [addState, addAction, addPending] = useActionState(createMatch, null)

  useEffect(() => {
    if (addState && 'ok' in addState) {
      setFormKey(k => k + 1)
      setJustAdded(true)
      const t = setTimeout(() => setJustAdded(false), 2500)
      return () => clearTimeout(t)
    }
  }, [addState])

  // ── Edit modal ────────────────────────────────────────────
  const [editMatch, setEditMatch] = useState<MatchWithTeams | null>(null)
  const closeEdit = useCallback(() => {
    setEditMatch(null)
    router.refresh()
  }, [router])

  // ── Delete ────────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteMatch(id)
    setDeletingId(null)
    setConfirmDeleteId(null)
    if (result && 'error' in result) {
      setDeleteError(result.error)
    } else {
      setDeleteError(null)
      router.refresh()
    }
  }

  // ── Grouped list ──────────────────────────────────────────
  const phaseList = buildPhaseList(matches, phases)

  return (
    <div>
      {/* ── Quick-add panel ─────────────────────────────── */}
      <div className="rounded-card bg-card border border-hairline card-shadow-sm p-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-4">
          Nova partida
        </p>

        {/* Context selectors */}
        <div className={`grid gap-3 mb-4 ${isGroupStage ? 'sm:grid-cols-3' : 'sm:grid-cols-1 max-w-xs'}`}>
          <div>
            <label className={labelCls}>Fase</label>
            <select
              value={selectedPhase}
              onChange={e => setSelectedPhase(e.target.value)}
              className={selectCls}
            >
              {phases.map(p => (
                <option key={p.phase} value={p.phase}>{p.label}</option>
              ))}
            </select>
          </div>
          {isGroupStage && (
            <>
              <div>
                <label className={labelCls}>Grupo</label>
                <select
                  value={selectedGroup}
                  onChange={e => setSelectedGroup(e.target.value)}
                  className={selectCls}
                >
                  {GROUPS.map(g => (
                    <option key={g} value={g}>Grupo {g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Rodada</label>
                <select
                  value={selectedRound}
                  onChange={e => setSelectedRound(e.target.value)}
                  className={selectCls}
                >
                  {ROUNDS.map(r => (
                    <option key={r} value={r}>{ROUND_LABELS[r]}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="h-px bg-hairline mb-4" />

        {/* Feedback */}
        {addState && 'error' in addState && (
          <div className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss mb-3">
            {addState.error}
          </div>
        )}
        {justAdded && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-input border border-win/25 bg-win/6 px-4 py-2.5 text-sm text-win mb-3"
          >
            <CheckCircle2 size={14} strokeWidth={2} />
            Partida adicionada com sucesso.
          </motion.div>
        )}

        {/* Match fields — key resets selects+date without losing context */}
        <form key={formKey} action={addAction}>
          <input type="hidden" name="phase" value={selectedPhase} />
          {isGroupStage && (
            <>
              <input type="hidden" name="match_group" value={selectedGroup} />
              <input type="hidden" name="round" value={selectedRound} />
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Mandante</label>
              <select
                name="home_team_national_id"
                required
                defaultValue=""
                className={selectCls}
                disabled={teams.length < 2}
              >
                <option value="" disabled>Selecionar seleção…</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Visitante</label>
              <select
                name="away_team_national_id"
                required
                defaultValue=""
                className={selectCls}
                disabled={teams.length < 2}
              >
                <option value="" disabled>Selecionar seleção…</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>
                Data e hora{' '}
                <span className="normal-case font-normal tracking-normal text-ink-faint">
                  (Campo Grande)
                </span>
              </label>
              <input
                name="match_date"
                type="datetime-local"
                required
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            {teams.length < 2 && (
              <p className="text-xs text-ink-faint">
                Cadastre ao menos 2 seleções na aba Seleções primeiro.
              </p>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={addPending || teams.length < 2}
                className="flex items-center gap-2 rounded-btn bg-ink px-5 py-2.5 text-sm font-semibold text-card hover:bg-ink/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {addPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} strokeWidth={2.5} />
                )}
                Adicionar partida
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete error */}
      {deleteError && (
        <div className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss mb-4">
          {deleteError}
        </div>
      )}

      {/* ── Match list ───────────────────────────────────── */}
      {matches.length === 0 ? (
        <div className="rounded-card border border-hairline bg-card card-shadow-sm px-5 py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-card-sunken border border-hairline flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={22} strokeWidth={1.5} className="text-ink-faint/50" />
          </div>
          <p className="text-sm font-medium text-ink">Nenhuma partida cadastrada</p>
          <p className="text-xs text-ink-soft mt-1">
            {teams.length < 2
              ? 'Cadastre ao menos 2 seleções para começar.'
              : 'Use o formulário acima para adicionar as partidas.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {phaseList.map(pg => (
            <div key={pg.phase}>
              {/* Phase header */}
              {(() => {
                const total =
                  pg.kind === 'group_stage'
                    ? pg.groups.reduce(
                        (n, g) => n + g.rounds.reduce((m, r) => m + r.matches.length, 0),
                        pg.ungrouped.length
                      )
                    : pg.matches.length
                return (
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="font-display text-base font-semibold text-ink">{pg.label}</h3>
                    <div className="flex-1 h-px bg-hairline" />
                    <span className="text-xs text-ink-faint">
                      {total} partida{total !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              })()}

              {pg.kind === 'group_stage' ? (
                <div className="flex flex-col gap-5">
                  {pg.groups.map(({ group, rounds }) => (
                    <div key={group}>
                      {/* Group header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-brand">{group}</span>
                        </div>
                        <span className="text-xs font-semibold text-ink-soft">Grupo {group}</span>
                        <div className="flex-1 h-px bg-hairline" />
                      </div>

                      {rounds.map(({ round, matches: rm }) => (
                        <div key={round} className="mb-3 last:mb-0">
                          {rounds.length > 1 && (
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-2 ml-1">
                              {ROUND_LABELS[round] ?? `Rodada ${round}`}
                            </p>
                          )}
                          <div className="flex flex-col gap-2">
                            {rm.map(match => (
                              <MatchCard
                                key={match.id}
                                match={match}
                                onEdit={() => setEditMatch(match)}
                                onDeleteRequest={() => setConfirmDeleteId(match.id)}
                                onDeleteConfirm={() => handleDelete(match.id)}
                                onDeleteCancel={() => setConfirmDeleteId(null)}
                                confirmDeleteId={confirmDeleteId}
                                deletingId={deletingId}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {pg.ungrouped.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {pg.ungrouped.map(match => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          onEdit={() => setEditMatch(match)}
                          onDeleteRequest={() => setConfirmDeleteId(match.id)}
                          onDeleteConfirm={() => handleDelete(match.id)}
                          onDeleteCancel={() => setConfirmDeleteId(null)}
                          confirmDeleteId={confirmDeleteId}
                          deletingId={deletingId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pg.matches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onEdit={() => setEditMatch(match)}
                      onDeleteRequest={() => setConfirmDeleteId(match.id)}
                      onDeleteConfirm={() => handleDelete(match.id)}
                      onDeleteCancel={() => setConfirmDeleteId(null)}
                      confirmDeleteId={confirmDeleteId}
                      deletingId={deletingId}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit modal (reuses MatchModal — only for updates) */}
      <MatchModal
        open={editMatch !== null}
        onClose={closeEdit}
        teams={teams}
        match={editMatch}
      />
    </div>
  )
}
