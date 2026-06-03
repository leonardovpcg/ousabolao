'use client'

import { useState, useEffect, useActionState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown,
  Loader2, BookOpen, AlertCircle,
} from 'lucide-react'
import { createRule, updateRule, deleteRule, moveRule } from '../actions'
import { Modal } from '@/components/ui/Modal'
import type { Rule } from '../page'

// ── Styles ────────────────────────────────────────────────────

const inputCls = [
  'w-full rounded-input border border-hairline bg-card-sunken',
  'px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card transition-all',
].join(' ')

const labelCls = 'block text-xs font-semibold uppercase tracking-widest text-ink-faint mb-1.5'

// ── Edit modal form ───────────────────────────────────────────

function EditForm({ rule, onClose }: { rule: Rule; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(updateRule, null)

  useEffect(() => {
    if (state && 'ok' in state) onClose()
  }, [state, onClose])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={rule.id} />

      {state && 'error' in state && (
        <div className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss">
          {state.error}
        </div>
      )}

      <div>
        <label className={labelCls}>Título</label>
        <input
          name="title"
          type="text"
          required
          defaultValue={rule.title}
          placeholder="Ex.: Art. 1º — Objeto"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Conteúdo</label>
        <textarea
          name="content"
          required
          rows={10}
          defaultValue={rule.content}
          placeholder="Texto do artigo..."
          className={inputCls + ' resize-y leading-relaxed min-h-[180px]'}
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

// ── Add form ──────────────────────────────────────────────────

function AddForm() {
  const [state, formAction, pending] = useActionState(createRule, null)
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (state && 'ok' in state) setFormKey(k => k + 1)
  }, [state])

  return (
    <div className="rounded-card bg-card border border-hairline card-shadow-sm p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-4">
        Novo artigo
      </p>

      {state && 'error' in state && (
        <div className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss mb-3">
          {state.error}
        </div>
      )}

      <form key={formKey} action={formAction} className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>Título</label>
          <input
            name="title"
            type="text"
            required
            placeholder="Ex.: Art. 13º — Disposições finais"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Conteúdo</label>
          <textarea
            name="content"
            required
            rows={5}
            placeholder="Texto do artigo..."
            className={inputCls + ' resize-y leading-relaxed'}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 rounded-btn bg-ink px-4 py-2.5 text-sm font-semibold text-card hover:bg-ink/90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} strokeWidth={2.5} />
          )}
          Adicionar artigo
        </button>
      </form>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────

type Props = { rules: Rule[] }

export function RegrasClient({ rules }: Props) {
  const router = useRouter()

  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const closeEdit = useCallback(() => {
    setEditingRule(null)
    router.refresh()
  }, [router])

  const [pendingSet, setPendingSet] = useState(new Set<string>())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const addPending = (key: string) =>
    setPendingSet(prev => new Set([...prev, key]))
  const removePending = (key: string) =>
    setPendingSet(prev => { const n = new Set(prev); n.delete(key); return n })
  const setError = (id: string, msg: string) =>
    setErrors(prev => ({ ...prev, [id]: msg }))
  const clearError = (id: string) =>
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n })

  const handleMove = useCallback(async (id: string, dir: 'up' | 'down') => {
    const key = `${id}_move`
    addPending(key)
    clearError(id)
    const result = await moveRule(id, dir)
    removePending(key)
    if (result && 'error' in result) setError(id, result.error)
    else router.refresh()
  }, [router])

  const handleDelete = useCallback(async (id: string) => {
    const key = `${id}_delete`
    addPending(key)
    setConfirmDeleteId(null)
    clearError(id)
    const result = await deleteRule(id)
    removePending(key)
    if (result && 'error' in result) setError(id, result.error)
    else router.refresh()
  }, [router])

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
          Regulamento
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          {rules.length} {rules.length === 1 ? 'artigo' : 'artigos'} · visíveis em /regras
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-card border border-hairline bg-card-sunken px-4 py-3 mb-6 flex items-start gap-3">
        <BookOpen size={15} strokeWidth={1.5} className="text-ink-faint flex-shrink-0 mt-0.5" />
        <p className="text-xs text-ink-soft leading-relaxed">
          Alterações aqui refletem imediatamente na página de{' '}
          <strong>Regras</strong> para os jogadores. Use ↑↓ para reordenar.
        </p>
      </div>

      {/* Articles list */}
      {rules.length === 0 ? (
        <div className="rounded-card border border-hairline bg-card card-shadow-sm px-5 py-12 text-center mb-4">
          <BookOpen size={28} strokeWidth={1.5} className="text-ink-faint/50 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink">Nenhum artigo cadastrado</p>
          <p className="text-xs text-ink-soft mt-1">
            Use o formulário abaixo para adicionar artigos ao regulamento.
          </p>
        </div>
      ) : (
        <motion.div
          className="flex flex-col gap-2.5 mb-4"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          {rules.map((rule, idx) => {
            const isFirst = idx === 0
            const isLast = idx === rules.length - 1
            const movePending = pendingSet.has(`${rule.id}_move`)
            const deletePending = pendingSet.has(`${rule.id}_delete`)
            const error = errors[rule.id]
            const isConfirmingDelete = confirmDeleteId === rule.id

            return (
              <motion.div
                key={rule.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { type: 'spring' as const, stiffness: 320, damping: 28 },
                  },
                }}
                className="rounded-card bg-card border border-hairline card-shadow-sm overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-start gap-3 px-4 pt-3.5 pb-3 border-b border-hairline/60">
                  {/* Order badge */}
                  <div className="w-6 h-6 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-brand leading-none nums">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Title */}
                  <p className="flex-1 font-display text-sm font-semibold text-ink leading-snug min-w-0">
                    {rule.title}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Move buttons */}
                    <div className="flex">
                      <button
                        onClick={() => handleMove(rule.id, 'up')}
                        disabled={isFirst || movePending}
                        className="p-1 rounded-l-[6px] border border-r-0 border-hairline text-ink-faint hover:bg-hairline hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        title="Mover para cima"
                      >
                        <ChevronUp size={13} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => handleMove(rule.id, 'down')}
                        disabled={isLast || movePending}
                        className="p-1 rounded-r-[6px] border border-hairline text-ink-faint hover:bg-hairline hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        title="Mover para baixo"
                      >
                        <ChevronDown size={13} strokeWidth={2} />
                      </button>
                    </div>

                    {/* Edit */}
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-1.5 rounded-[8px] text-ink-faint hover:bg-hairline hover:text-ink transition-colors"
                      title="Editar"
                    >
                      <Pencil size={13} strokeWidth={1.5} />
                    </button>

                    {/* Delete / Confirm inline */}
                    <AnimatePresence mode="wait">
                      {isConfirmingDelete ? (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex items-center gap-1"
                        >
                          <button
                            onClick={() => handleDelete(rule.id)}
                            disabled={deletePending}
                            className="px-2 py-0.5 rounded-[6px] bg-loss/10 text-loss text-[11px] font-semibold hover:bg-loss/20 transition-colors disabled:opacity-40"
                          >
                            {deletePending ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              'Excluir'
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 rounded-[6px] bg-card-sunken text-ink-soft text-[11px] hover:bg-hairline transition-colors"
                          >
                            Não
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="trash"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setConfirmDeleteId(rule.id)}
                          className="p-1.5 rounded-[8px] text-ink-faint hover:bg-hairline hover:text-loss transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Content preview */}
                <div className="px-4 py-3">
                  <p className="text-xs text-ink-soft leading-relaxed line-clamp-2">
                    {rule.content}
                  </p>
                </div>

                {/* Per-card error */}
                {error && (
                  <div className="px-4 pb-3 -mt-1">
                    <p className="flex items-center gap-1.5 text-[11px] text-loss">
                      <AlertCircle size={10} strokeWidth={2} />
                      {error}
                    </p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Add form */}
      <AddForm />

      {/* Edit modal */}
      <Modal
        open={editingRule !== null}
        onClose={closeEdit}
        title="Editar artigo"
      >
        {editingRule && (
          <EditForm key={editingRule.id} rule={editingRule} onClose={closeEdit} />
        )}
      </Modal>
    </div>
  )
}
