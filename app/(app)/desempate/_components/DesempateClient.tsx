'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Clock, CheckCircle2, AlertCircle, Loader2,
  ChevronDown, Eye,
} from 'lucide-react'
import { saveResponse } from '../actions'
import { DEADLINE_UTC_ISO } from '@/lib/tiebreaker'
import type { TiebreakerQuestion, MyResponse, AllResponse } from '../page'

// ── Deadline constant ─────────────────────────────────────────

const DEADLINE = new Date(DEADLINE_UTC_ISO)

const DEADLINE_LABEL = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Campo_Grande',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour:   '2-digit',
  minute: '2-digit',
}).format(DEADLINE).replace(/(\d{2}):(\d{2})/, '$1h$2')

// ── useCountdown ──────────────────────────────────────────────
// Single interval, stable across renders via ref for the callback.

type CountdownState = {
  days: number; hours: number; minutes: number; seconds: number
  expired: boolean; mounted: boolean
}

function useCountdown(onExpiry: () => void): CountdownState {
  const [ms, setMs] = useState(0)
  const [mounted, setMounted] = useState(false)
  const onExpiryRef = useRef(onExpiry)
  onExpiryRef.current = onExpiry

  useEffect(() => {
    // Initialise on client only (avoids SSR hydration mismatch)
    const initial = Math.max(0, DEADLINE.getTime() - Date.now())
    setMs(initial)
    setMounted(true)

    if (initial === 0) { onExpiryRef.current(); return }

    const id = setInterval(() => {
      const remaining = Math.max(0, DEADLINE.getTime() - Date.now())
      setMs(remaining)
      if (remaining === 0) {
        clearInterval(id)
        onExpiryRef.current()
      }
    }, 1000)

    return () => clearInterval(id)
  }, []) // run once on mount — stable via ref for callback

  const total = Math.floor(ms / 1000)
  return {
    days:    Math.floor(total / 86400),
    hours:   Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    expired: mounted && ms === 0,
    mounted,
  }
}

// ── CountdownBanner ───────────────────────────────────────────

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-display text-4xl sm:text-5xl font-bold text-ink nums leading-none tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-faint">
        {label}
      </span>
    </div>
  )
}

type BannerProps = Pick<CountdownState, 'days' | 'hours' | 'minutes' | 'seconds' | 'expired' | 'mounted'>

function CountdownBanner({ days, hours, minutes, seconds, expired, mounted }: BannerProps) {
  if (!mounted) {
    // Skeleton until client hydrates
    return <div className="rounded-card bg-card border border-hairline card-shadow-sm h-[116px]" />
  }

  if (expired) {
    return (
      <div className="rounded-card bg-card-sunken border border-hairline px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-ink/6 flex items-center justify-center flex-shrink-0">
          <Lock size={16} strokeWidth={1.75} className="text-ink-soft" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Respostas encerradas</p>
          <p className="text-xs text-ink-faint mt-0.5">
            Prazo atingido em {DEADLINE_LABEL} · Campo Grande, MS
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-card bg-card border border-hairline card-shadow-sm px-5 py-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={13} strokeWidth={1.5} className="text-brand" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">
          Tempo para responder
        </span>
      </div>

      <div className="flex items-end gap-3 sm:gap-5 mb-4">
        <TimeUnit value={days}    label="dias" />
        <span className="font-display text-3xl font-light text-ink-faint/30 pb-5 select-none">·</span>
        <TimeUnit value={hours}   label="horas" />
        <span className="font-display text-3xl font-light text-ink-faint/30 pb-5 select-none">·</span>
        <TimeUnit value={minutes} label="min" />
        <span className="font-display text-3xl font-light text-ink-faint/30 pb-5 select-none">·</span>
        <TimeUnit value={seconds} label="seg" />
      </div>

      <p className="text-[11px] text-ink-faint">
        Prazo: {DEADLINE_LABEL} · Campo Grande, MS
      </p>
    </div>
  )
}

// ── InfoBox ───────────────────────────────────────────────────

function InfoBox() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-card border border-hairline bg-card-sunken overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-semibold text-ink-soft">
          Como funciona o desempate?
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`text-ink-faint transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-hairline/60"
          >
            <div className="px-4 py-4 text-xs text-ink-soft leading-relaxed space-y-2">
              <p>
                Em caso de empate no ranking, as perguntas são avaliadas{' '}
                <strong className="text-ink">uma por uma na ordem 1→5</strong>, até encontrar diferença.
              </p>
              <p>Critérios seguintes: mais placares exatos → mais resultados corretos.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── State 1 — Editable question card ─────────────────────────

function QuestionCard({
  question, savedAnswer, locked,
}: {
  question: TiebreakerQuestion
  savedAnswer: string | null
  locked: boolean
}) {
  const [value, setValue]       = useState(savedAnswer ?? '')
  const [saving, setSaving]     = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const savedRef = useRef(savedAnswer ?? '')
  const isDirty  = value.trim() !== savedRef.current.trim()
  const hasSaved = savedRef.current.trim().length > 0

  const handleSave = useCallback(async () => {
    if (!value.trim() || saving || locked) return
    setSaving(true)
    setError(null)

    const result = await saveResponse(question.id, value)
    setSaving(false)

    if (!result || 'ok' in result) {
      savedRef.current = value.trim()
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 3000)
      return
    }

    if (result.error === 'deadline_passed') {
      setError('Prazo encerrado — respostas não aceitas.')
    } else {
      setError(result.error)
    }
  }, [value, saving, locked, question.id])

  return (
    <div className={[
      'rounded-card bg-card border border-hairline card-shadow-sm overflow-hidden transition-opacity duration-300',
      locked ? 'opacity-70' : '',
    ].join(' ')}>

      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3.5 border-b border-hairline/60">
        <div className="w-6 h-6 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[11px] font-bold text-brand leading-none nums">
            {question.display_order}
          </span>
        </div>
        <p className="text-sm font-semibold text-ink leading-snug flex-1 min-w-0">
          {question.question}
        </p>
        <div className="flex-shrink-0 ml-1">
          {locked
            ? <Lock size={13} strokeWidth={1.5} className="text-ink-faint mt-0.5" />
            : hasSaved && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-win">
                  <CheckCircle2 size={10} strokeWidth={2.5} />
                  Salvo
                </span>
              )
          }
        </div>
      </div>

      {/* Textarea */}
      <div className="px-4 py-3.5">
        <textarea
          value={value}
          onChange={e => { if (!locked) setValue(e.target.value) }}
          disabled={locked}
          rows={2}
          placeholder={locked ? '—' : 'Sua resposta…'}
          maxLength={500}
          className={[
            'w-full rounded-input border border-hairline bg-card-sunken resize-none leading-relaxed',
            'px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint',
            'outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card transition-all',
            locked ? 'opacity-60 cursor-not-allowed' : '',
          ].join(' ')}
        />

        {error && (
          <p className="flex items-center gap-1.5 mt-2 text-xs text-loss">
            <AlertCircle size={11} strokeWidth={2} />
            {error}
          </p>
        )}

        {!locked && (
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[10px] text-ink-faint nums">{value.length}/500</span>

            <div className="flex items-center gap-2">
              <AnimatePresence>
                {justSaved && (
                  <motion.span
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-win"
                  >
                    <CheckCircle2 size={11} strokeWidth={2.5} />
                    Salvo!
                  </motion.span>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !value.trim() || !isDirty}
                className={[
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-btn text-xs font-semibold transition-all',
                  'disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]',
                  isDirty && value.trim()
                    ? 'bg-ink text-card hover:bg-ink/90'
                    : 'bg-card-sunken text-ink-soft border border-hairline',
                ].join(' ')}
              >
                {saving && <Loader2 size={11} className="animate-spin" />}
                {hasSaved ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── State 2 — Transparency block ──────────────────────────────

function TransparencyBlock({
  question, responses, userId,
}: {
  question: TiebreakerQuestion
  responses: AllResponse[]
  userId: string
}) {
  const sorted = useMemo(() =>
    [...responses].sort((a, b) =>
      (a.player_name ?? '').localeCompare(b.player_name ?? '', 'pt-BR')
    ), [responses])

  return (
    <div className="rounded-card bg-card border border-hairline card-shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 px-4 pt-4 pb-3.5 border-b border-hairline/60">
        <div className="w-6 h-6 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[11px] font-bold text-brand leading-none nums">
            {question.display_order}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink leading-snug">{question.question}</p>
          {question.official_answer && (
            <p className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-win">
              <CheckCircle2 size={11} strokeWidth={2.5} />
              Resposta oficial: <span className="font-bold">{question.official_answer}</span>
            </p>
          )}
        </div>
        <span className="flex-shrink-0 flex items-center gap-1 text-[10px] text-ink-faint ml-1">
          <Eye size={11} strokeWidth={1.5} />
          {sorted.length}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="px-4 py-4 text-sm text-ink-faint italic">Nenhuma resposta registrada.</p>
      ) : (
        <ul className="divide-y divide-hairline/60">
          {sorted.map((r, i) => {
            const isMe = r.user_id === userId
            const isCorrect = question.official_answer !== null &&
              r.answer.trim().toLowerCase() === question.official_answer.trim().toLowerCase()
            return (
              <li
                key={i}
                className={[
                  'flex items-start gap-3 px-4 py-2.5',
                  isMe ? 'bg-brand/4' : '',
                ].join(' ')}
              >
                <span className={[
                  'text-sm flex-shrink-0 w-[120px] sm:w-[140px] truncate',
                  isMe ? 'font-semibold text-ink' : 'text-ink-soft',
                ].join(' ')}>
                  {r.player_name ?? 'Jogador'}
                  {isMe && (
                    <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-brand align-middle">
                      você
                    </span>
                  )}
                </span>
                <span className={[
                  'text-sm flex-1 min-w-0 break-words leading-snug',
                  isCorrect ? 'text-win font-medium' : 'text-ink-soft',
                ].join(' ')}>
                  {r.answer}
                </span>
                {isCorrect && (
                  <CheckCircle2 size={13} strokeWidth={2} className="text-win flex-shrink-0 mt-0.5" />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────

type Props = {
  questions: TiebreakerQuestion[]
  myResponses: MyResponse[]
  allResponses: AllResponse[]
  initialExpired: boolean
  userId: string
}

export function DesempateClient({
  questions,
  myResponses,
  allResponses: initialAllResponses,
  initialExpired,
  userId,
}: Props) {
  const router = useRouter()

  const [isExpired, setIsExpired] = useState(
    initialExpired || Date.now() >= DEADLINE.getTime()
  )

  const handleExpiry = useCallback(() => {
    setIsExpired(true)
    router.refresh() // re-fetches server data with transparency view
  }, [router])

  const countdown = useCountdown(handleExpiry)

  // After router.refresh(), allResponses is populated
  const hasTransparencyData = initialAllResponses.length > 0

  const myResponseMap = useMemo(() => {
    const m = new Map<string, string>()
    myResponses.forEach(r => m.set(r.question_id, r.answer))
    return m
  }, [myResponses])

  const allResponseMap = useMemo(() => {
    const m = new Map<string, AllResponse[]>()
    initialAllResponses.forEach(r => {
      if (!m.has(r.question_id)) m.set(r.question_id, [])
      m.get(r.question_id)!.push(r)
    })
    return m
  }, [initialAllResponses])

  // Determine display state: expired from server prop OR client timer
  const showExpired = isExpired || (countdown.mounted && countdown.expired)

  const stagger = {
    hidden: {},
    show:   { transition: { staggerChildren: 0.06 } },
  }
  const itemVariant = {
    hidden: { opacity: 0, y: 8 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
  }

  return (
    <div className="max-w-[700px] mx-auto flex flex-col gap-4 pb-4">

      {/* Header */}
      <div className="mb-1">
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
          Desempate
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          {showExpired
            ? 'Respostas de todos os participantes'
            : 'Responda antes do prazo — usadas em caso de empate no ranking'
          }
        </p>
      </div>

      {/* Countdown / expired banner */}
      <CountdownBanner
        days={countdown.days}
        hours={countdown.hours}
        minutes={countdown.minutes}
        seconds={countdown.seconds}
        expired={showExpired}
        mounted={countdown.mounted}
      />

      {/* Collapsible info */}
      <InfoBox />

      {/* Empty */}
      {questions.length === 0 && (
        <div className="rounded-card bg-card border border-hairline card-shadow-sm px-5 py-12 text-center">
          <p className="text-sm text-ink-faint">Nenhuma pergunta ativa ainda.</p>
        </div>
      )}

      {/* STATE 2 — transparency loading placeholder */}
      {showExpired && !hasTransparencyData && questions.length > 0 && (
        <div className="rounded-card bg-card border border-hairline card-shadow-sm px-5 py-8 text-center">
          <Loader2 size={22} strokeWidth={1.5} className="text-ink-faint animate-spin mx-auto mb-3" />
          <p className="text-sm text-ink-soft">A carregar respostas dos participantes…</p>
        </div>
      )}

      {/* STATE 2 — transparency loaded */}
      {showExpired && hasTransparencyData && (
        <motion.div className="flex flex-col gap-3" initial="hidden" animate="show" variants={stagger}>
          {questions.map(q => (
            <motion.div key={q.id} variants={itemVariant}>
              <TransparencyBlock
                question={q}
                responses={allResponseMap.get(q.id) ?? []}
                userId={userId}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* STATE 1 — editable cards */}
      {!showExpired && questions.length > 0 && (
        <motion.div className="flex flex-col gap-3" initial="hidden" animate="show" variants={stagger}>
          {questions.map(q => (
            <motion.div key={q.id} variants={itemVariant}>
              <QuestionCard
                question={q}
                savedAnswer={myResponseMap.get(q.id) ?? null}
                locked={showExpired}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

    </div>
  )
}
