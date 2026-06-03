import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatDateTime } from '@/lib/utils/datetime'
import type { ExportData } from '@/app/admin/desempate/actions'

// ── Design tokens ─────────────────────────────────────────────
const BRAND = '#C8881E'
const INK = '#16151A'
const INK_SOFT = '#5C5A63'
const INK_FAINT = '#9A98A1'
const PAPER = '#F6F5F1'
const CARD = '#FFFFFF'
const HAIRLINE = '#E4E2DA'
const SUNKEN = '#EFEEE8'

// ── Column layout ─────────────────────────────────────────────
// A4 landscape: 841.89pt − 72pt margins = 769.89pt usable
const PAGE_USABLE_W = 769.89
const PLAYER_COL_W = 155

function questionColW(n: number) {
  return Math.floor((PAGE_USABLE_W - PLAYER_COL_W) / Math.max(n, 1))
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    paddingHorizontal: 36,
    paddingVertical: 32,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  headerLeft: {},
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND,
    marginRight: 6,
  },
  brandName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: INK,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 8,
    color: INK_SOFT,
    marginLeft: 14,
  },
  metaText: {
    fontSize: 7,
    color: INK_FAINT,
    textAlign: 'right',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginRight: 8,
  },
  statDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: BRAND,
    marginRight: 4,
  },
  statText: {
    fontSize: 7,
    color: INK_SOFT,
  },

  // Table
  table: {
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: INK,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
  },
  tableRowAlt: {
    backgroundColor: SUNKEN,
  },
  cell: {
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  headerCellText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    color: CARD,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  playerCellText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: INK,
  },
  answerCellText: {
    fontSize: 7.5,
    color: INK_SOFT,
  },
  emptyText: {
    fontSize: 7.5,
    color: INK_FAINT,
  },

  // Footer
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
  },
  footerText: {
    fontSize: 6.5,
    color: INK_FAINT,
  },
  footerBrand: {
    fontSize: 6.5,
    color: BRAND,
    fontFamily: 'Helvetica-Bold',
  },
})

// ── Document component ────────────────────────────────────────

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

export function DesempatePdf({ data }: { data: ExportData }) {
  const { questions, rows, generated_at } = data
  const qW = questionColW(questions.length)
  const respondents = rows.filter(r => r.answers.some(a => a !== null)).length

  return (
    <Document
      title="OusaBolão · Desempate"
      author="OusaBolão"
      subject="Perguntas de Desempate — Copa 2026"
    >
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* ── Header ───────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.brandRow}>
              <View style={s.brandDot} />
              <Text style={s.brandName}>OusaBolão</Text>
            </View>
            <Text style={s.subtitle}>Perguntas de Desempate · Copa 2026</Text>
          </View>
          <View>
            <Text style={s.metaText}>
              Gerado em {formatDateTime(generated_at)}
            </Text>
            <Text style={[s.metaText, { marginTop: 2 }]}>
              (horário de Campo Grande)
            </Text>
          </View>
        </View>

        {/* ── Stats ─────────────────────────────────────────── */}
        <View style={s.statsRow}>
          <View style={s.statBadge}>
            <View style={s.statDot} />
            <Text style={s.statText}>{rows.length} jogadores</Text>
          </View>
          <View style={s.statBadge}>
            <View style={s.statDot} />
            <Text style={s.statText}>{respondents} responderam</Text>
          </View>
          <View style={s.statBadge}>
            <View style={s.statDot} />
            <Text style={s.statText}>{questions.length} perguntas</Text>
          </View>
        </View>

        {/* ── Table ─────────────────────────────────────────── */}
        <View style={s.table}>

          {/* Header row */}
          <View style={s.tableHeaderRow}>
            <View style={[s.cell, { width: PLAYER_COL_W }]}>
              <Text style={s.headerCellText}>Jogador</Text>
            </View>
            {questions.map((q, i) => (
              <View key={i} style={[s.cell, { width: qW }]}>
                <Text style={s.headerCellText}>{truncate(q, 55)}</Text>
              </View>
            ))}
          </View>

          {/* Data rows */}
          {rows.length === 0 ? (
            <View style={{ ...s.tableRow, paddingVertical: 12, justifyContent: 'center' }}>
              <Text style={s.emptyText}>Nenhuma resposta registrada.</Text>
            </View>
          ) : rows.map((row, i) => (
            <View
              key={i}
              style={i % 2 === 1 ? [s.tableRow, s.tableRowAlt] : s.tableRow}
              wrap={false}
            >
              <View style={[s.cell, { width: PLAYER_COL_W }]}>
                <Text style={s.playerCellText}>{row.player_name}</Text>
              </View>
              {row.answers.map((answer, j) => (
                <View key={j} style={[s.cell, { width: qW }]}>
                  {answer ? (
                    <Text style={s.answerCellText}>{truncate(answer, 60)}</Text>
                  ) : (
                    <Text style={s.emptyText}>—</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* ── Footer ───────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerBrand}>OusaBolão</Text>
          <Text style={s.footerText}>
            {rows.length} jogadores · {questions.length} perguntas · Copa do Mundo 2026
          </Text>
        </View>

      </Page>
    </Document>
  )
}
