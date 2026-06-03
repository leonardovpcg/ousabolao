'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Flag, CalendarDays } from 'lucide-react'
import { deleteTeam } from '../actions'
import { TeamModal } from './TeamModal'
import { MatchesTab } from './MatchesTab'
import type { NationalTeam, MatchWithTeams, TournamentPhase } from '../page'

type ActiveTab = 'selecoes' | 'partidas'

type ModalState =
  | { type: 'team_create' }
  | { type: 'team_edit'; team: NationalTeam }
  | null

type Props = {
  teams: NationalTeam[]
  matches: MatchWithTeams[]
  phases: TournamentPhase[]
}

export function JobsClient({ teams, matches, phases }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<ActiveTab>('selecoes')
  const [modal, setModal] = useState<ModalState>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const closeModal = useCallback(() => setModal(null), [])
  const refresh = useCallback(() => {
    closeModal()
    router.refresh()
  }, [closeModal, router])

  function handleDeleteTeam(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteTeam(id)
      setDeletingId(null)
      setConfirmDelete(null)
      router.refresh()
    })
  }

  const tabs = [
    { id: 'selecoes' as const, label: 'Seleções', icon: Flag, count: teams.length },
    { id: 'partidas' as const, label: 'Partidas', icon: CalendarDays, count: matches.length },
  ]

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
          Jogos
        </h1>
        <p className="text-ink-soft text-sm mt-1">Copa do Mundo 2026</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-hairline mb-8">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={[
              'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === id
                ? 'border-brand text-ink'
                : 'border-transparent text-ink-faint hover:text-ink-soft',
            ].join(' ')}
          >
            <Icon size={14} strokeWidth={1.5} />
            {label}
            <span className={[
              'text-[11px] font-semibold px-1.5 py-0.5 rounded-pill',
              activeTab === id ? 'bg-brand/12 text-brand' : 'bg-card-sunken text-ink-faint',
            ].join(' ')}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab: Seleções ─────────────────────────────────── */}
      {activeTab === 'selecoes' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-ink-faint">
              {teams.length === 0
                ? 'Nenhuma seleção cadastrada'
                : `${teams.length} seleção${teams.length !== 1 ? 'ões' : ''} cadastrada${teams.length !== 1 ? 's' : ''}`}
            </p>
            <button
              onClick={() => setModal({ type: 'team_create' })}
              className="flex items-center gap-1.5 rounded-btn bg-ink px-3.5 py-2 text-xs font-semibold text-card hover:bg-ink/90 active:scale-[0.98] transition-all"
            >
              <Plus size={13} strokeWidth={2} />
              Nova seleção
            </button>
          </div>

          {teams.length === 0 ? (
            <div className="rounded-card border border-hairline bg-card card-shadow-sm px-5 py-10 text-center">
              <Flag size={28} strokeWidth={1.5} className="text-ink-faint/50 mx-auto mb-3" />
              <p className="text-sm font-medium text-ink">Nenhuma seleção cadastrada</p>
              <p className="text-xs text-ink-soft mt-1">Comece cadastrando as seleções participantes.</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            >
              {teams.map((team) => (
                <motion.div
                  key={team.id}
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 28 } },
                  }}
                  className="flex items-center gap-3 rounded-card bg-card border border-hairline card-shadow-sm px-4 py-3 group"
                >
                  {team.emblem_url ? (
                    <img src={team.emblem_url} alt={team.name} className="w-8 h-8 object-contain flex-shrink-0 rounded-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-sm bg-card-sunken border border-hairline flex items-center justify-center text-[10px] font-bold text-ink-faint flex-shrink-0">
                      {team.name.slice(0, 3).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{team.name}</p>
                    {team.country && (
                      <p className="text-xs text-ink-faint truncate">{team.country}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setModal({ type: 'team_edit', team })}
                      className="p-1.5 rounded-[8px] text-ink-faint hover:bg-hairline hover:text-ink transition-colors"
                      title="Editar"
                    >
                      <Pencil size={13} strokeWidth={1.5} />
                    </button>
                    {confirmDelete === team.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          disabled={deletingId === team.id}
                          className="px-2 py-1 rounded-[6px] bg-loss/10 text-loss text-[11px] font-semibold hover:bg-loss/20 transition-colors"
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 rounded-[6px] bg-card-sunken text-ink-soft text-[11px] hover:bg-hairline transition-colors"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(team.id)}
                        className="p-1.5 rounded-[8px] text-ink-faint hover:bg-hairline hover:text-loss transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      )}

      {/* ── Tab: Partidas ─────────────────────────────────── */}
      {activeTab === 'partidas' && (
        <MatchesTab teams={teams} matches={matches} phases={phases} />
      )}

      {/* Team modals */}
      <TeamModal
        open={modal?.type === 'team_create' || modal?.type === 'team_edit'}
        onClose={refresh}
        team={modal?.type === 'team_edit' ? modal.team : null}
      />
    </>
  )
}
