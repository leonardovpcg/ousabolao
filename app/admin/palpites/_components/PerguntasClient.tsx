'use client'

import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, FileText, Loader2, AlertCircle, HelpCircle } from 'lucide-react'
import type { ProfileRow, TiebreakerQuestion, TiebreakerResponse } from '../page'

// ── Helpers ───────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

// ── CorrectnessLabel ──────────────────────────────────────────

function CorrectnessLabel({ is_correct }: { is_correct: boolean | null }) {
  if (is_correct === true) {
    return (
      <span className="inline-block text-[9px] font-bold text-win bg-win/10 border border-win/25 rounded-pill px-1.5 py-0.5 leading-none">
        ✓
      </span>
    )
  }
  if (is_correct === false) {
    return (
      <span className="inline-block text-[9px] font-bold text-loss bg-loss/10 border border-loss/25 rounded-pill px-1.5 py-0.5 leading-none">
        ✗
      </span>
    )
  }
  return null
}

// ── Main ──────────────────────────────────────────────────────

type Props = {
  questions: TiebreakerQuestion[]
  responses: TiebreakerResponse[]
  profiles: ProfileRow[]
}

export function PerguntasClient({ questions, responses, profiles }: Props) {
  const [csvLoading, setCsvLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const activeQuestions = useMemo(
    () => questions.filter(q => q.is_active).sort((a, b) => a.display_order - b.display_order),
    [questions]
  )

  // Build response map: userId → questionId → response
  const respMap = useMemo(() => {
    const map = new Map<string, Map<string, TiebreakerResponse>>()
    for (const r of responses) {
      if (!r.user_id || !r.question_id) continue
      if (!map.has(r.user_id)) map.set(r.user_id, new Map())
      map.get(r.user_id)!.set(r.question_id, r)
    }
    return map
  }, [responses])

  // Count correct answers per player (for summary)
  const correctCounts = useMemo<Map<string, number>>(() => {
    const counts = new Map<string, number>()
    for (const profile of profiles) {
      const playerResp = respMap.get(profile.id)
      let count = 0
      for (const q of activeQuestions) {
        const r = playerResp?.get(q.id)
        if (r?.is_correct === true) count++
      }
      counts.set(profile.id, count)
    }
    return counts
  }, [profiles, respMap, activeQuestions])

  const hasOfficialAnswers = activeQuestions.some(q => q.official_answer !== null)
  const respondentCount = useMemo(() =>
    profiles.filter(p => {
      const playerResp = respMap.get(p.id)
      return activeQuestions.some(q => playerResp?.get(q.id)?.answer)
    }).length,
    [profiles, respMap, activeQuestions]
  )

  // ── CSV export ──────────────────────────────────────────────

  const handleExportCsv = useCallback(() => {
    setCsvLoading(true)
    setExportError(null)
    try {
      const playerHeaders = profiles.map(p => `"${p.name ?? ''}"`).join(',')
      const header = `"Pergunta","Resposta Oficial",${playerHeaders}`

      const rows = activeQuestions.map(q => {
        const officialCell = `"${q.official_answer ?? ''}"`
        const playerCells = profiles.map(p => {
          const r = respMap.get(p.id)?.get(q.id)
          if (!r?.answer) return '""'
          const correct = r.is_correct === true ? ' ✓' : r.is_correct === false ? ' ✗' : ''
          return `"${r.answer}${correct}"`
        }).join(',')
        return [`"${q.question}"`, officialCell, playerCells].join(',')
      })

      const csv = '﻿' + [header, ...rows].join('\n')
      triggerDownload(csv, 'perguntas-desempate.csv', 'text/csv;charset=utf-8')
    } finally {
      setCsvLoading(false)
    }
  }, [activeQuestions, profiles, respMap])

  // ── PDF export ──────────────────────────────────────────────

  const handleExportPdf = useCallback(async () => {
    setPdfLoading(true)
    setExportError(null)
    try {
      const res = await fetch('/api/admin/perguntas/pdf')
      if (!res.ok) { setExportError('Erro ao gerar PDF.'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = 'perguntas-desempate.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportError('Erro ao gerar PDF.')
    } finally {
      setPdfLoading(false)
    }
  }, [])

  // ── Empty state ─────────────────────────────────────────────

  if (activeQuestions.length === 0) {
    return (
      <div className="rounded-card border border-hairline bg-card card-shadow-sm px-5 py-14 text-center">
        <HelpCircle size={28} strokeWidth={1.5} className="text-ink-faint/50 mx-auto mb-3" />
        <p className="text-sm font-medium text-ink">Nenhuma pergunta de desempate ativa</p>
        <p className="text-xs text-ink-soft mt-1">
          Cadastre as perguntas em <span className="font-semibold">Admin → Desempate</span>.
        </p>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div>
      {/* Export + stats bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        {/* Stats */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft bg-card border border-hairline rounded-pill px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
            <span className="nums font-semibold">{activeQuestions.length}</span>{' '}
            {activeQuestions.length === 1 ? 'pergunta' : 'perguntas'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft bg-card border border-hairline rounded-pill px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
            <span className="nums font-semibold">{respondentCount}</span>{' '}
            {respondentCount === 1 ? 'respondeu' : 'responderam'}
          </span>
          {hasOfficialAnswers && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-win bg-win/8 border border-win/20 rounded-pill px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-win flex-shrink-0" />
              Respostas oficiais disponíveis
            </span>
          )}
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleExportCsv}
            disabled={csvLoading}
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
            disabled={pdfLoading}
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

      {/* Table: rows = questions, columns = participants */}
      <div className="rounded-card border border-hairline card-shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">

            {/* Head */}
            <thead>
              <tr className="border-b border-hairline bg-paper">
                <th
                  scope="col"
                  className="sticky left-0 z-20 bg-paper border-r border-hairline px-4 py-3 text-left min-w-[220px] max-w-[280px]"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                    Pergunta
                  </span>
                </th>
                {profiles.map(p => (
                  <th
                    key={p.id}
                    scope="col"
                    className="px-2 py-2 text-center min-w-[96px] max-w-[140px] border-r border-hairline/60 last:border-r-0"
                  >
                    <div className="text-[10px] font-semibold text-ink-soft truncate max-w-[120px] mx-auto">
                      {p.name ?? '—'}
                    </div>
                    {hasOfficialAnswers && (
                      <div className="text-[9px] font-bold text-brand nums mt-0.5">
                        {correctCounts.get(p.id) ?? 0} acerto{(correctCounts.get(p.id) ?? 0) !== 1 ? 's' : ''}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {activeQuestions.map((q, qIdx) => (
                <tr
                  key={q.id}
                  className={[
                    'border-b border-hairline/60 last:border-b-0',
                    qIdx % 2 === 1 ? 'bg-paper/40' : 'bg-card',
                  ].join(' ')}
                >
                  {/* Question cell */}
                  <td className="sticky left-0 z-10 bg-inherit border-r border-hairline px-4 py-3">
                    <div className="min-w-[200px] max-w-[260px]">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[9px] font-bold text-ink-faint flex-shrink-0">
                          {q.display_order}.
                        </span>
                        <p className="text-sm font-medium text-ink leading-snug">
                          {q.question}
                        </p>
                      </div>
                      {q.official_answer && (
                        <p className="text-[11px] font-semibold text-win mt-1 ml-4">
                          ✓ {truncate(q.official_answer, 50)}
                        </p>
                      )}
                      {!q.official_answer && (
                        <p className="text-[10px] italic text-ink-faint mt-1 ml-4">
                          Sem resposta oficial
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Player answer cells */}
                  {profiles.map(p => {
                    const r = respMap.get(p.id)?.get(q.id)
                    return (
                      <td
                        key={p.id}
                        className="px-2 py-3 text-center border-r border-hairline/40 last:border-r-0 align-top"
                      >
                        {r?.answer ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-ink-soft leading-snug text-center break-words max-w-[120px]">
                              {r.answer}
                            </span>
                            <CorrectnessLabel is_correct={r.is_correct ?? null} />
                          </div>
                        ) : (
                          <span className="text-ink-faint/50 text-xs select-none">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
