'use client'

import { useActionState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { createMatch, updateMatch, type ActionState } from '../actions'
import { PHASES, PHASE_LABELS } from '../constants'
import { utcToDatetimeLocal } from '@/lib/utils/datetime'
import type { NationalTeam, MatchWithTeams } from '../page'

type Props = {
  open: boolean
  onClose: () => void
  teams: NationalTeam[]
  match?: MatchWithTeams | null
}


const inputClass = [
  'w-full rounded-input border border-hairline bg-card-sunken',
  'px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint',
  'outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card',
].join(' ')

const selectClass = inputClass + ' cursor-pointer'
const labelClass = 'block text-xs font-semibold uppercase tracking-widest text-ink-faint mb-1.5'


export function MatchModal({ open, onClose, teams, match }: Props) {
  const action = match ? updateMatch : createMatch
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

  useEffect(() => {
    if (state && 'ok' in state) onClose()
  }, [state, onClose])

  const defaultPhase = match?.phase ?? 'group_stage'
  const isGroupStage = defaultPhase === 'group_stage'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={match ? 'Editar partida' : 'Nova partida'}
    >
      <form key={match?.id ?? 'new'} action={formAction} className="flex flex-col gap-4">
        {match && <input type="hidden" name="id" value={match.id} />}

        {state && 'error' in state && (
          <div className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss">
            {state.error}
          </div>
        )}

        {/* Teams */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="home-team" className={labelClass}>Mandante</label>
            <select
              id="home-team"
              name="home_team_national_id"
              required
              defaultValue={match?.home_team_national_id ?? ''}
              className={selectClass}
            >
              <option value="" disabled>Seleção…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="away-team" className={labelClass}>Visitante</label>
            <select
              id="away-team"
              name="away_team_national_id"
              required
              defaultValue={match?.away_team_national_id ?? ''}
              className={selectClass}
            >
              <option value="" disabled>Seleção…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date/time */}
        <div>
          <label htmlFor="match-date" className={labelClass}>
            Data e hora <span className="normal-case font-normal tracking-normal text-ink-faint">(Campo Grande)</span>
          </label>
          <input
            id="match-date"
            name="match_date"
            type="datetime-local"
            required
            defaultValue={match ? utcToDatetimeLocal(match.match_date) : ''}
            className={inputClass}
          />
        </div>

        {/* Phase */}
        <div>
          <label htmlFor="match-phase" className={labelClass}>Fase</label>
          <select
            id="match-phase"
            name="phase"
            required
            defaultValue={defaultPhase}
            className={selectClass}
          >
            {PHASES.map((p) => (
              <option key={p} value={p}>{PHASE_LABELS[p]}</option>
            ))}
          </select>
        </div>

        {/* Group + Round */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="match-group" className={labelClass}>
              Grupo <span className="normal-case font-normal tracking-normal text-ink-faint">(opcional)</span>
            </label>
            <input
              id="match-group"
              name="match_group"
              type="text"
              defaultValue={match?.match_group ?? ''}
              placeholder="ex.: A"
              maxLength={10}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="match-round" className={labelClass}>
              Rodada <span className="normal-case font-normal tracking-normal text-ink-faint">(opcional)</span>
            </label>
            <input
              id="match-round"
              name="round"
              type="text"
              defaultValue={match?.round ?? ''}
              placeholder="ex.: 1"
              maxLength={50}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-btn border border-hairline bg-card py-2.5 text-sm font-medium text-ink-soft hover:bg-hairline transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 flex items-center justify-center gap-2 rounded-btn bg-ink py-2.5 text-sm font-semibold text-card active:scale-[0.98] hover:bg-ink/90 transition-all disabled:opacity-50"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {match ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
