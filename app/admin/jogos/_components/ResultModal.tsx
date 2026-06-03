'use client'

import { useActionState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { launchResult, type ActionState } from '../actions'
import type { MatchWithTeams } from '../page'

type Props = {
  open: boolean
  onClose: () => void
  match: MatchWithTeams | null
}

function TeamFlag({ team }: { team: { name: string; emblem_url: string | null } | null }) {
  if (!team) return <span className="text-ink-faint">—</span>
  if (team.emblem_url) {
    return (
      <img
        src={team.emblem_url}
        alt={team.name}
        className="w-8 h-8 object-contain rounded-sm"
      />
    )
  }
  return (
    <div className="w-8 h-8 rounded-sm bg-card-sunken border border-hairline flex items-center justify-center text-[10px] font-bold text-ink-soft">
      {team.name.slice(0, 3).toUpperCase()}
    </div>
  )
}

export function ResultModal({ open, onClose, match }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(launchResult, null)

  useEffect(() => {
    if (state && 'ok' in state) onClose()
  }, [state, onClose])

  if (!match) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lançar resultado"
    >
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="matchId" value={match.id} />

        {state && 'error' in state && (
          <div className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss">
            {state.error}
          </div>
        )}

        {/* Match display */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <TeamFlag team={match.home_team} />
            <span className="text-xs font-medium text-ink text-center leading-tight">
              {match.home_team?.name ?? '—'}
            </span>
          </div>
          <span className="text-ink-faint font-display text-sm font-medium">×</span>
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <TeamFlag team={match.away_team} />
            <span className="text-xs font-medium text-ink text-center leading-tight">
              {match.away_team?.name ?? '—'}
            </span>
          </div>
        </div>

        {/* Score inputs */}
        <div className="flex items-center gap-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
              Gols mandante
            </label>
            <input
              name="home_score"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={match.home_score ?? 0}
              required
              className="w-20 rounded-input border border-hairline bg-card-sunken px-3 py-3 text-center font-display text-2xl font-bold text-ink nums outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <span className="font-display text-2xl font-bold text-ink-faint mt-5">×</span>

          <div className="flex-1 flex flex-col items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
              Gols visitante
            </label>
            <input
              name="away_score"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={match.away_score ?? 0}
              required
              className="w-20 rounded-input border border-hairline bg-card-sunken px-3 py-3 text-center font-display text-2xl font-bold text-ink nums outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        <p className="text-xs text-ink-faint text-center -mt-1">
          Apenas 90 min (prorrogação e pênaltis não contam)
        </p>

        <div className="flex gap-3">
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
            Confirmar resultado
          </button>
        </div>
      </form>
    </Modal>
  )
}
