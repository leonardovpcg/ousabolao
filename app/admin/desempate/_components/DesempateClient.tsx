'use client'

import { useState, useEffect, useActionState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown,
  Loader2, CheckCircle2, AlertCircle, HelpCircle,
} from 'lucide-react'
import {
  createQuestion,
  updateQuestion,
  saveOfficialAnswer,
  toggleActive,
  deleteQuestion,
  moveQuestion,
} from '../actions'
import { Modal } from '@/components/ui/Modal'
import type { TiebreakerQuestion } from '../page'

// ── Styles ────────────────────────────────────────────────────

const inputCls = [
  'w-full rounded-input border border-hairline bg-card-sunken',
  'px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card transition-all',
].join(' ')
const labelCls = 'block text-xs font-semibold uppercase tracking-widest text-ink-faint mb-1.5'

// ── Edit modal ────────────────────────────────────────────────

function EditForm({
  question,
  onClose,
}: {
  question: TiebreakerQuestion
  onClose: () => void
}) {
  const [state, formAction, pending] = useActionState(updateQuestion, null)

  useEffect(() => {
    if (state && 'ok' in state) onClose()
  }, [state, onClose])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={question.id} />

      {state && 'error' in state && (
        <div className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss">
          {state.error}
        </div>
      )}

      <div>
        <label className={labelCls}>Pergunta</label>
        <textarea
          name="question"
          required
          rows={3}
          defaultValue={question.question}
          placeholder="Ex.: Quem será o campeão da Copa 2026?"
          className={inputCls + ' resize-none leading-relaxed'}
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
          className="flex-1 flex items-center justify-center gap-2 rounded-btn bg-ink py-2.5 text-sm font-semibold text-card hover:bg-ink/90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {pending && <Loader2 size={13} className="animate-spin" />}
          Salvar
        </button>
      </div>
    </form>
  )
}

// ── Add-question form ─────────────────────────────────────────

function AddForm() {
  const [state, formAction, pending] = useActionState(createQuestion, null)
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (state && 'ok' in state) setFormKey(k => k + 1)
  }, [state])

  return (
    <div className="rounded-card bg-card border border-hairline card-shadow-sm p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-4">
        Nova pergunta
      </p>

      {state && 'error' in state && (
        <div className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss mb-3">
          {state.error}
        </div>
      )}

      <form key={formKey} action={formAction} className="flex gap-3">
        <input
          name="question"
          type="text"
          required
          placeholder="Ex.: Quem será o campeão da Copa 2026?"
          className={inputCls + ' flex-1'}
        />
        <button
          type="submit"
          disabled={pending}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-btn bg-ink px-4 py-2.5 text-sm font-semibold text-card hover:bg-ink/90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} strokeWidth={2.5} />}
          Adicionar
        </button>
      </form>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

type Props = { questions: TiebreakerQuestion[] }

export function DesempateClient({ questions }: Props) {
  const router = useRouter()

  // ── Edit modal ──────────────────────────────────────────────
  const [editingQ, setEditingQ] = useState<TiebreakerQuestion | null>(null)
  const closeEdit = useCallback(() => {
    setEditingQ(null)
    router.refresh()
  }, [router])

  // ── Per-question pending actions ────────────────────────────
  const [pendingSet, setPendingSet] = useState(new Set<string>())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Official-answer inputs (overrides question's saved value until saved)
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({})

  const addPending = (key: string) =>
    setPendingSet(prev => new Set([...prev, key]))
  const removePending = (key: string) =>
    setPendingSet(prev => { const n = new Set(prev); n.delete(key); return n })
  const setError = (id: string, msg: string) =>
    setErrors(prev => ({ ...prev, [id]: msg }))
  const clearError = (id: string) =>
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n })

  const getAnswerInput = (q: TiebreakerQuestion) =>
    answerInputs[q.id] ?? (q.official_answer ?? '')

  const isAnswerDirty = (q: TiebreakerQuestion) => {
    if (answerInputs[q.id] === undefined) return false
    return answerInputs[q.id] !== (q.official_answer ?? '')
  }

  // ── Handlers ────────────────────────────────────────────────

  const handleSaveAnswer = useCallback(async (q: TiebreakerQuestion) => {
    const key: string = `${q.id}_answer`
    addPending(key)
    clearError(q.id)
    const result = await saveOfficialAnswer(q.id, answerInputs[q.id] ?? '')
    removePending(key)
    if (result && 'error' in result) {
      setError(q.id, result.error)
    } else {
      setAnswerInputs(prev => { const n = { ...prev }; delete n[q.id]; return n })
      router.refresh()
    }
  }, [answerInputs, router])

  const handleToggle = useCallback(async (id: string) => {
    const key: string = `${id}_toggle`
    addPending(key)
    clearError(id)
    const result = await toggleActive(id)
    removePending(key)
    if (result && 'error' in result) setError(id, result.error)
    else router.refresh()
  }, [router])

  const handleMove = useCallback(async (id: string, dir: 'up' | 'down') => {
    const key: string = `${id}_move`
    addPending(key)
    clearError(id)
    const result = await moveQuestion(id, dir)
    removePending(key)
    if (result && 'error' in result) setError(id, result.error)
    else router.refresh()
  }, [router])

  const handleDelete = useCallback(async (id: string) => {
    const key: string = `${id}_delete`
    addPending(key)
    setConfirmDeleteId(null)
    clearError(id)
    const result = await deleteQuestion(id)
    removePending(key)
    if (result && 'error' in result) setError(id, result.error)
    else router.refresh()
  }, [router])

  // ── Render ──────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
          Desempate
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          Perguntas de desempate · Copa 2026
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-card border border-hairline bg-card-sunken px-4 py-3 mb-6 flex items-start gap-3">
        <HelpCircle size={15} strokeWidth={1.5} className="text-ink-faint flex-shrink-0 mt-0.5" />
        <p className="text-xs text-ink-soft leading-relaxed">
          Os jogadores respondem às perguntas antes da Copa. As <strong>respostas oficiais</strong> são preenchidas aqui quando a Copa definir o resultado — use o campo de cada pergunta abaixo. Critério de desempate avalia as perguntas na ordem 1 → 5 até encontrar diferença.
        </p>
      </div>

      {/* Question list */}
      {questions.length === 0 ? (
        <div className="rounded-card border border-hairline bg-card card-shadow-sm px-5 py-12 text-center mb-4">
          <HelpCircle size={28} strokeWidth={1.5} className="text-ink-faint/50 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink">Nenhuma pergunta cadastrada</p>
          <p className="text-xs text-ink-soft mt-1">Use o formulário abaixo para adicionar as perguntas de desempate.</p>
        </div>
      ) : (
        <motion.div
          className="flex flex-col gap-2.5 mb-4"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {questions.map((q, idx) => {
            const isFirst = idx === 0
            const isLast = idx === questions.length - 1
            const answerInput = getAnswerInput(q)
            const answerDirty = isAnswerDirty(q)
            const answerSaving = pendingSet.has(`${q.id}_answer`)
            const togglePending = pendingSet.has(`${q.id}_toggle`)
            const movePending = pendingSet.has(`${q.id}_move`)
            const deletePending = pendingSet.has(`${q.id}_delete`)
            const error = errors[q.id]
            const isConfirmingDelete = confirmDeleteId === q.id

            return (
              <motion.div
                key={q.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 28 } },
                }}
                className="rounded-card bg-card border border-hairline card-shadow-sm overflow-hidden"
              >
                {/* Top row */}
                <div className="flex items-start gap-3 px-4 pt-3.5 pb-3 border-b border-hairline/60">
                  {/* Order badge */}
                  <div className="w-6 h-6 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-brand leading-none nums">{idx + 1}</span>
                  </div>

                  {/* Question text */}
                  <p className="flex-1 text-sm font-medium text-ink leading-snug min-w-0">
                    {q.question}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggle(q.id)}
                      disabled={togglePending}
                      className={[
                        'flex items-center gap-1 px-2 py-0.5 rounded-pill border text-[10px] font-semibold transition-colors disabled:opacity-40',
                        q.is_active
                          ? 'border-win/25 bg-win/8 text-win hover:bg-win/15'
                          : 'border-hairline bg-card-sunken text-ink-faint hover:bg-hairline',
                      ].join(' ')}
                    >
                      {togglePending ? (
                        <Loader2 size={8} className="animate-spin" />
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${q.is_active ? 'bg-win' : 'bg-ink-faint'}`} />
                      )}
                      {q.is_active ? 'Ativa' : 'Inativa'}
                    </button>

                    {/* Move buttons */}
                    <div className="flex">
                      <button
                        onClick={() => handleMove(q.id, 'up')}
                        disabled={isFirst || movePending}
                        className="p-1 rounded-l-[6px] border border-r-0 border-hairline text-ink-faint hover:bg-hairline hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        title="Mover para cima"
                      >
                        <ChevronUp size={13} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => handleMove(q.id, 'down')}
                        disabled={isLast || movePending}
                        className="p-1 rounded-r-[6px] border border-hairline text-ink-faint hover:bg-hairline hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        title="Mover para baixo"
                      >
                        <ChevronDown size={13} strokeWidth={2} />
                      </button>
                    </div>

                    {/* Edit */}
                    <button
                      onClick={() => setEditingQ(q)}
                      className="p-1.5 rounded-[8px] text-ink-faint hover:bg-hairline hover:text-ink transition-colors"
                      title="Editar"
                    >
                      <Pencil size={13} strokeWidth={1.5} />
                    </button>

                    {/* Delete / Confirm */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(q.id)}
                          disabled={deletePending}
                          className="px-2 py-0.5 rounded-[6px] bg-loss/10 text-loss text-[11px] font-semibold hover:bg-loss/20 transition-colors"
                        >
                          {deletePending ? <Loader2 size={10} className="animate-spin" /> : 'Excluir'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 rounded-[6px] bg-card-sunken text-ink-soft text-[11px] hover:bg-hairline transition-colors"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(q.id)}
                        className="p-1.5 rounded-[8px] text-ink-faint hover:bg-hairline hover:text-loss transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Official answer row */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint flex-shrink-0">
                      Resposta oficial
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={answerInput}
                        onChange={e => setAnswerInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Vazia — preencher após a Copa definir"
                        className={[
                          'flex-1 rounded-[8px] border border-hairline bg-card-sunken',
                          'px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint/60',
                          'outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card transition-all',
                        ].join(' ')}
                      />
                      <AnimatePresence>
                        {answerDirty && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => handleSaveAnswer(q)}
                            disabled={answerSaving}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-ink text-card text-[11px] font-semibold hover:bg-ink/85 disabled:opacity-40 transition-colors"
                          >
                            {answerSaving ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={10} strokeWidth={2.5} />
                            )}
                            Salvar
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Error or saved status */}
                  {error && (
                    <p className="flex items-center gap-1.5 mt-1.5 text-[11px] text-loss">
                      <AlertCircle size={10} strokeWidth={2} />
                      {error}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Add form */}
      <AddForm />

      {/* Edit modal */}
      <Modal
        open={editingQ !== null}
        onClose={closeEdit}
        title="Editar pergunta"
      >
        {editingQ && (
          <EditForm key={editingQ.id} question={editingQ} onClose={closeEdit} />
        )}
      </Modal>
    </div>
  )
}
