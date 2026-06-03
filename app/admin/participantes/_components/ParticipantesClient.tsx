'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users, CheckCircle2, Clock, ShieldCheck, ShieldOff,
  Loader2, AlertCircle, UserCog,
} from 'lucide-react'
import { togglePayment, grantAdmin, revokeAdmin } from '../actions'
import type { Participant } from '../page'

// ── Helpers ───────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

// ── Sub-components ────────────────────────────────────────────

function AvatarBadge({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? 'Participante'}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-hairline"
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
      <span className="text-[13px] font-semibold text-brand leading-none">
        {getInitials(name)}
      </span>
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: number
  icon: React.ElementType
  accent?: 'default' | 'win' | 'brand'
}

function MetricCard({ label, value, icon: Icon, accent = 'default' }: MetricCardProps) {
  const accentCls = {
    default: 'text-ink-faint',
    win: 'text-win',
    brand: 'text-brand',
  }[accent]

  return (
    <div className="rounded-card bg-card border border-hairline card-shadow-sm px-4 py-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
          {label}
        </p>
        <Icon size={14} strokeWidth={1.5} className={accentCls} />
      </div>
      <p className={`font-display text-3xl font-bold nums leading-none ${accentCls === 'text-ink-faint' ? 'text-ink' : accentCls}`}>
        {value}
      </p>
    </div>
  )
}

// ── Participant card ──────────────────────────────────────────

type CardState = {
  payPending: boolean
  rolePending: boolean
  error: string | null
  confirmRole: 'grant' | 'revoke' | null
}

type ParticipantCardProps = {
  participant: Participant
  isSelf: boolean
  state: CardState
  onTogglePayment: () => void
  onRequestRole: (action: 'grant' | 'revoke') => void
  onConfirmRole: () => void
  onCancelRole: () => void
}

function ParticipantCard({
  participant: p,
  isSelf,
  state,
  onTogglePayment,
  onRequestRole,
  onConfirmRole,
  onCancelRole,
}: ParticipantCardProps) {
  const isPaid = p.payment_status === 'paid'
  const anyPending = state.payPending || state.rolePending

  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 28 } },
      }}
      className="rounded-card bg-card border border-hairline card-shadow-sm px-4 py-3.5"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <AvatarBadge name={p.name} avatarUrl={p.avatar_url} />

        {/* Info + actions */}
        <div className="flex-1 min-w-0">
          {/* Name + badges row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate leading-snug">
                {p.name ?? <span className="text-ink-faint italic">sem nome</span>}
                {isSelf && (
                  <span className="ml-1.5 text-[10px] font-medium text-ink-faint">(você)</span>
                )}
              </p>
              <p className="text-xs text-ink-faint truncate mt-0.5">{p.email ?? '—'}</p>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
              {p.is_admin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill border border-hairline bg-ink/5 text-[10px] font-semibold text-ink-soft">
                  <ShieldCheck size={10} strokeWidth={2} />
                  Admin
                </span>
              )}
              <span
                className={[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-pill border text-[10px] font-semibold',
                  isPaid
                    ? 'border-win/25 bg-win/8 text-win'
                    : 'border-brand/25 bg-brand/8 text-brand',
                ].join(' ')}
              >
                {isPaid ? (
                  <CheckCircle2 size={10} strokeWidth={2.5} />
                ) : (
                  <Clock size={10} strokeWidth={2.5} />
                )}
                {isPaid ? 'Pago' : 'Pendente'}
              </span>
            </div>
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {/* Payment toggle */}
            <button
              onClick={onTogglePayment}
              disabled={anyPending}
              className={[
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                isPaid
                  ? 'border-hairline bg-card-sunken text-ink-soft hover:bg-hairline hover:text-ink'
                  : 'border-win/25 bg-win/8 text-win hover:bg-win/15',
              ].join(' ')}
            >
              {state.payPending ? (
                <Loader2 size={10} className="animate-spin" />
              ) : isPaid ? (
                <Clock size={10} strokeWidth={2} />
              ) : (
                <CheckCircle2 size={10} strokeWidth={2.5} />
              )}
              {isPaid ? 'Marcar pendente' : 'Marcar pago'}
            </button>

            {/* Admin role management */}
            {state.confirmRole ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-ink-soft">
                  {state.confirmRole === 'revoke' ? 'Remover admin?' : 'Tornar admin?'}
                </span>
                <button
                  onClick={onConfirmRole}
                  disabled={state.rolePending}
                  className="px-2.5 py-1 rounded-[8px] bg-ink text-card text-[11px] font-semibold hover:bg-ink/85 disabled:opacity-40 transition-colors"
                >
                  {state.rolePending ? <Loader2 size={10} className="animate-spin" /> : 'Confirmar'}
                </button>
                <button
                  onClick={onCancelRole}
                  className="px-2.5 py-1 rounded-[8px] border border-hairline bg-card-sunken text-ink-soft text-[11px] hover:bg-hairline transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : p.is_admin ? (
              <button
                onClick={() => onRequestRole('revoke')}
                disabled={isSelf || anyPending}
                title={isSelf ? 'Você não pode remover seu próprio acesso' : undefined}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border border-loss/20 bg-loss/6 text-loss text-[11px] font-medium hover:bg-loss/12 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {state.rolePending ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <ShieldOff size={10} strokeWidth={2} />
                )}
                Remover admin
              </button>
            ) : (
              <button
                onClick={() => onRequestRole('grant')}
                disabled={anyPending}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border border-hairline bg-card-sunken text-ink-soft text-[11px] font-medium hover:bg-hairline hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {state.rolePending ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <UserCog size={10} strokeWidth={1.5} />
                )}
                Tornar admin
              </button>
            )}
          </div>

          {/* Per-participant error */}
          {state.error && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-loss">
              <AlertCircle size={11} strokeWidth={2} />
              {state.error}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────

type Props = {
  participants: Participant[]
  currentUserId: string
}

type CardStates = Record<string, Partial<CardState>>

function getCardState(states: CardStates, id: string): CardState {
  return {
    payPending: false,
    rolePending: false,
    error: null,
    confirmRole: null,
    ...states[id],
  }
}

export function ParticipantesClient({ participants, currentUserId }: Props) {
  const router = useRouter()
  const [cardStates, setCardStates] = useState<CardStates>({})

  function patchCard(id: string, patch: Partial<CardState>) {
    setCardStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }

  const handleTogglePayment = useCallback(async (userId: string) => {
    patchCard(userId, { payPending: true, error: null })
    const result = await togglePayment(userId)
    patchCard(userId, { payPending: false })
    if (result && 'error' in result) {
      patchCard(userId, { error: result.error })
    } else {
      router.refresh()
    }
  }, [router])

  const handleRequestRole = useCallback((userId: string, action: 'grant' | 'revoke') => {
    patchCard(userId, { confirmRole: action, error: null })
  }, [])

  const handleConfirmRole = useCallback(async (userId: string) => {
    const action = cardStates[userId]?.confirmRole
    if (!action) return
    patchCard(userId, { confirmRole: null, rolePending: true, error: null })
    const result = action === 'grant' ? await grantAdmin(userId) : await revokeAdmin(userId)
    patchCard(userId, { rolePending: false })
    if (result && 'error' in result) {
      patchCard(userId, { error: result.error })
    } else {
      router.refresh()
    }
  }, [cardStates, router])

  const handleCancelRole = useCallback((userId: string) => {
    patchCard(userId, { confirmRole: null })
  }, [])

  // Derived metrics
  const paid = participants.filter(p => p.payment_status === 'paid').length
  const pending = participants.filter(p => p.payment_status === 'pending').length

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
          Participantes
        </h1>
        <p className="text-ink-soft text-sm mt-1">Gerenciar pagamentos e papéis</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <MetricCard label="Participantes" value={participants.length} icon={Users} />
        <MetricCard label="Pagos" value={paid} icon={CheckCircle2} accent="win" />
        <MetricCard label="Pendentes" value={pending} icon={Clock} accent="brand" />
      </div>

      {/* Participant list */}
      {participants.length === 0 ? (
        <div className="rounded-card border border-hairline bg-card card-shadow-sm px-5 py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-card-sunken border border-hairline flex items-center justify-center mx-auto mb-4">
            <Users size={22} strokeWidth={1.5} className="text-ink-faint/50" />
          </div>
          <p className="text-sm font-medium text-ink">Nenhum participante ainda</p>
          <p className="text-xs text-ink-soft mt-1">Os participantes aparecem aqui após o primeiro login.</p>
        </div>
      ) : (
        <motion.div
          className="flex flex-col gap-2"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          {participants.map(p => (
            <ParticipantCard
              key={p.id}
              participant={p}
              isSelf={p.id === currentUserId}
              state={getCardState(cardStates, p.id)}
              onTogglePayment={() => handleTogglePayment(p.id)}
              onRequestRole={(action) => handleRequestRole(p.id, action)}
              onConfirmRole={() => handleConfirmRole(p.id)}
              onCancelRole={() => handleCancelRole(p.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
