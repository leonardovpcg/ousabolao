'use client'

import { useActionState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { createTeam, updateTeam, type ActionState } from '../actions'
import type { NationalTeam } from '../page'

type Props = {
  open: boolean
  onClose: () => void
  team?: NationalTeam | null
}

const inputClass = [
  'w-full rounded-input border border-hairline bg-card-sunken',
  'px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint',
  'outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card',
].join(' ')

const labelClass = 'block text-xs font-semibold uppercase tracking-widest text-ink-faint mb-1.5'

export function TeamModal({ open, onClose, team }: Props) {
  const action = team ? updateTeam : createTeam
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

  useEffect(() => {
    if (state && 'ok' in state) onClose()
  }, [state, onClose])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={team ? 'Editar seleção' : 'Nova seleção'}
    >
      <form action={formAction} className="flex flex-col gap-4">
        {team && <input type="hidden" name="id" value={team.id} />}

        {state && 'error' in state && (
          <div className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss">
            {state.error}
          </div>
        )}

        <div>
          <label htmlFor="team-name" className={labelClass}>Nome da seleção</label>
          <input
            id="team-name"
            name="name"
            type="text"
            required
            defaultValue={team?.name ?? ''}
            placeholder="ex.: Brasil"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="team-country" className={labelClass}>País</label>
          <input
            id="team-country"
            name="country"
            type="text"
            required
            defaultValue={team?.country ?? ''}
            placeholder="ex.: Brazil"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="team-emblem" className={labelClass}>
            URL da bandeira/emblema
            <span className="ml-1 font-normal text-ink-faint normal-case tracking-normal">(opcional)</span>
          </label>
          <input
            id="team-emblem"
            name="emblem_url"
            type="url"
            defaultValue={team?.emblem_url ?? ''}
            placeholder="https://..."
            className={inputClass}
          />
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
            {team ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
