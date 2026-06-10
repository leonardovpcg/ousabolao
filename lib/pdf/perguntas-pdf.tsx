import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatDateTime } from '@/lib/utils/datetime'

// ── Types ─────────────────────────────────────────────────────

export type PerguntasPdfQuestion = {
  question: string
  official_answer: string | null
}

export type PerguntasPdfPlayer = {
  player_name: string
  answers: Array<{
    text: string | null
    is_correct: boolean | null
  }>
}

export type PerguntasPdfData = {
  questions: PerguntasPdfQuestion[]
  players: PerguntasPdfPlayer[]  // sorted by name
  generated_at: string
}

// ── Layout — A4 landscape ─────────────────────────────────────

const MARGIN_H    = 36
const USABLE_W    = 841.89 - MARGIN_H * 2
const QUESTION_COL_W = 160
const AVAIL_W     = USABLE_W - QUESTION_COL_W
const MIN_COL     = 50

function calcPlayerCol(n: number): number {
  return Math.min(90, Math.max(MIN_COL, Math.floor(AVAIL_W / Math.max(n, 1))))
}

function shortName(full: string): string {
  const first = full.split(' ')[0] ?? full
  return first.length > 10 ? first.slice(0, 9) + '.' : first
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

// ── Design tokens ─────────────────────────────────────────────

const BRAND     = '#C8881E'
const INK       = '#16151A'
const INK_SOFT  = '#5C5A63'
const INK_FAINT = '#9A98A1'
const PAPER     = '#F6F5F1'
const CARD      = '#FFFFFF'
const HAIRLINE  = '#E4E2DA'
const SUNKEN    = '#EFEEE8'
const WIN       = '#1E7A4D'
const LOSS      = '#B23A2E'

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    paddingHorizontal: MARGIN_H,
    paddingVertical: 20,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  brandRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  brandDot:  { width: 7, height: 7, borderRadius: 3.5, backgroundColor: BRAND, marginRight: 5 },
  brandName: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: INK },
  subtitle:  { fontSize: 7, color: INK_SOFT, marginLeft: 12 },
  metaText:  { fontSize: 6, color: INK_FAINT, textAlign: 'right' },

  statsRow:  { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 7 },
  statBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, borderWidth: 1, borderColor: HAIRLINE,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2.5, marginRight: 6, marginBottom: 3,
  },
  statDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: BRAND, marginRight: 4 },
  statText: { fontSize: 6.5, color: INK_SOFT },

  table:          { borderWidth: 1, borderColor: HAIRLINE, borderRadius: 5, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: INK },
  tableRow:       { flexDirection: 'row', borderTopWidth: 1, borderTopColor: HAIRLINE },
  tableRowAlt:    { backgroundColor: SUNKEN },
  totalsRow:      { flexDirection: 'row', borderTopWidth: 2, borderTopColor: BRAND, backgroundColor: '#FDF8F0' },

  cell: { paddingHorizontal: 5, paddingVertical: 5 },

  hdrLabel:   { fontSize: 6, color: CARD, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.4 },
  hdrPlayer:  { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: CARD, textAlign: 'center' },

  questionText:    { fontSize: 7, fontFamily: 'Helvetica-Bold', color: INK, marginBottom: 2 },
  officialAnswer:  { fontSize: 6, color: BRAND, fontFamily: 'Helvetica-Bold' },
  noAnswer:        { fontSize: 6, color: INK_FAINT, fontStyle: 'italic' },

  answerText:  { fontSize: 7, color: INK_SOFT, textAlign: 'center' },
  correctBadge: {
    marginTop: 2, alignSelf: 'center',
    backgroundColor: WIN, borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1,
  },
  incorrectBadge: {
    marginTop: 2, alignSelf: 'center',
    backgroundColor: LOSS, borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1,
  },
  badgeText: { fontSize: 5.5, color: CARD, fontFamily: 'Helvetica-Bold' },
  emptyCell: { fontSize: 9, color: '#CCCCCC', textAlign: 'center' },

  totalCell: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: BRAND, textAlign: 'center' },
  totalLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: BRAND },

  footer:      { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderTopColor: HAIRLINE },
  footerBrand: { fontSize: 6.5, color: BRAND, fontFamily: 'Helvetica-Bold' },
  footerText:  { fontSize: 6, color: INK_FAINT },
})

// ── Document ──────────────────────────────────────────────────

export function PerguntasPdf({ data }: { data: PerguntasPdfData }) {
  const { questions, players, generated_at } = data
  const colW = calcPlayerCol(players.length)
  const respondents = players.filter(p => p.answers.some(a => a.text !== null)).length

  return (
    <Document
      title="OusaBolão · Desempate · Respostas"
      author="OusaBolão"
    >
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* Header */}
        <View style={s.pageHeader} fixed>
          <View>
            <View style={s.brandRow}>
              <View style={s.brandDot} />
              <Text style={s.brandName}>OusaBolão</Text>
            </View>
            <Text style={s.subtitle}>
              Perguntas de Desempate · Respostas dos participantes · Copa 2026
            </Text>
          </View>
          <View>
            <Text style={s.metaText}>Gerado em {formatDateTime(generated_at)} (Campo Grande)</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            `${players.length} participante${players.length !== 1 ? 's' : ''}`,
            `${respondents} responderam`,
            `${questions.length} pergunta${questions.length !== 1 ? 's' : ''}`,
          ].map((label, i) => (
            <View key={i} style={s.statBadge}>
              <View style={s.statDot} />
              <Text style={s.statText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Table */}
        <View style={s.table}>

          {/* Column header row */}
          <View style={s.tableHeaderRow} fixed>
            <View style={[s.cell, { width: QUESTION_COL_W }]}>
              <Text style={s.hdrLabel}>Pergunta</Text>
            </View>
            {players.map((p, i) => (
              <View key={i} style={[s.cell, { width: colW, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={s.hdrPlayer}>{shortName(p.player_name)}</Text>
              </View>
            ))}
          </View>

          {/* Question rows */}
          {questions.length === 0 ? (
            <View style={[s.tableRow, { paddingVertical: 12 }]}>
              <Text style={[s.emptyCell, { flex: 1 }]}>Nenhuma pergunta cadastrada.</Text>
            </View>
          ) : questions.map((q, qIdx) => {
            const rowStyle = qIdx % 2 === 1 ? [s.tableRow, s.tableRowAlt] : [s.tableRow]
            return (
              <View key={qIdx} style={rowStyle} wrap={false}>
                {/* Question + official answer */}
                <View style={[s.cell, { width: QUESTION_COL_W }]}>
                  <Text style={s.questionText}>{truncate(q.question, 70)}</Text>
                  {q.official_answer ? (
                    <Text style={s.officialAnswer}>✓ {truncate(q.official_answer, 40)}</Text>
                  ) : (
                    <Text style={s.noAnswer}>Sem resposta oficial</Text>
                  )}
                </View>
                {/* Player answer cells */}
                {players.map((player, j) => {
                  const ans = player.answers[qIdx]
                  return (
                    <View key={j} style={[s.cell, { width: colW, alignItems: 'center', justifyContent: 'center' }]}>
                      {ans?.text ? (
                        <>
                          <Text style={s.answerText}>{truncate(ans.text, 22)}</Text>
                          {ans.is_correct === true && (
                            <View style={s.correctBadge}>
                              <Text style={s.badgeText}>✓ Acerto</Text>
                            </View>
                          )}
                          {ans.is_correct === false && (
                            <View style={s.incorrectBadge}>
                              <Text style={s.badgeText}>✗ Errou</Text>
                            </View>
                          )}
                        </>
                      ) : (
                        <Text style={s.emptyCell}>—</Text>
                      )}
                    </View>
                  )
                })}
              </View>
            )
          })}

          {/* Totals row — acertos por participante */}
          {questions.some(q => q.official_answer !== null) && (
            <View style={s.totalsRow} wrap={false}>
              <View style={[s.cell, { width: QUESTION_COL_W, justifyContent: 'center' }]}>
                <Text style={s.totalLabel}>Total de acertos</Text>
              </View>
              {players.map((player, j) => {
                const correct = player.answers.filter(a => a.is_correct === true).length
                return (
                  <View key={j} style={[s.cell, { width: colW, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={s.totalCell}>{correct}</Text>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerBrand}>OusaBolão</Text>
          <Text style={s.footerText}>
            {players.length} participantes · {questions.length} perguntas · Copa do Mundo 2026
          </Text>
        </View>

      </Page>
    </Document>
  )
}
