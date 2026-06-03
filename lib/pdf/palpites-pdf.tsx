import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { formatDateTime } from '@/lib/utils/datetime'

// ── Shared data type (imported by API route) ──────────────────

export type PalpitesPdfMatch = {
  id: string
  home_abbr: string
  away_abbr: string
  home_emblem: string | null
  away_emblem: string | null
  date_label: string
  score: string | null   // "2–1" if concluded, null otherwise
}

export type PalpitesPdfRow = {
  player_name: string
  is_paid: boolean
  bets: Array<{
    prediction: string | null  // "2×1" or null
    points: number | null
  }>
}

export type PalpitesPdfData = {
  filter_label: string
  matches: PalpitesPdfMatch[]
  rows: PalpitesPdfRow[]
  generated_at: string
  total_bets: number
}

// ── Design tokens ─────────────────────────────────────────────
const BRAND   = '#C8881E'
const INK     = '#16151A'
const INK_SOFT = '#5C5A63'
const INK_FAINT = '#9A98A1'
const PAPER   = '#F6F5F1'
const CARD    = '#FFFFFF'
const HAIRLINE = '#E4E2DA'
const SUNKEN  = '#EFEEE8'
const WIN     = '#1E7A4D'
const LOSS    = '#B23A2E'

// ── Column widths ─────────────────────────────────────────────
const PAGE_USABLE_W = 769.89  // A4 landscape − 72pt margins
const PLAYER_COL_W  = 120
const MIN_MATCH_COL = 44

function matchColW(n: number): number {
  return Math.max(MIN_MATCH_COL, Math.floor((PAGE_USABLE_W - PLAYER_COL_W) / Math.max(n, 1)))
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    paddingHorizontal: 36,
    paddingVertical: 30,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND, marginRight: 6 },
  brandName: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: INK },
  subtitle:  { fontSize: 8, color: INK_SOFT, marginLeft: 14 },
  metaText:  { fontSize: 7, color: INK_FAINT, textAlign: 'right' },

  statsRow:  { flexDirection: 'row', marginBottom: 10 },
  statBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, borderWidth: 1, borderColor: HAIRLINE,
    borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, marginRight: 8,
  },
  statDot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: BRAND, marginRight: 4 },
  statText: { fontSize: 7, color: INK_SOFT },

  table:          { borderWidth: 1, borderColor: HAIRLINE, borderRadius: 6, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: INK },
  tableRow:       { flexDirection: 'row', borderTopWidth: 1, borderTopColor: HAIRLINE },
  tableRowAlt:    { backgroundColor: SUNKEN },

  cell: { paddingHorizontal: 5, paddingVertical: 4, justifyContent: 'center' },

  // Header cells
  hdrPlayerText: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: CARD, textTransform: 'uppercase', letterSpacing: 0.4 },
  hdrMatchAbbrRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
  hdrMatchAbbr:  { fontSize: 6, color: CARD, textAlign: 'center' },
  hdrMatchDate:  { fontSize: 5.5, color: '#9A98A1', textAlign: 'center' },
  hdrMatchScore: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: BRAND, textAlign: 'center', marginTop: 1 },

  // Body cells
  playerText:   { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: INK },
  pendingBadge: { fontSize: 5.5, color: LOSS, marginTop: 1 },
  predText:     { fontFamily: 'Helvetica-Bold', fontSize: 8, color: INK, textAlign: 'center' },
  ptsExact:     { fontSize: 6.5, color: BRAND, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  ptsResult:    { fontSize: 6.5, color: WIN, textAlign: 'center' },
  ptsZero:      { fontSize: 6.5, color: INK_FAINT, textAlign: 'center' },
  emptyCell:    { fontSize: 7, color: INK_FAINT, textAlign: 'center' },

  footer:     { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: HAIRLINE },
  footerBrand: { fontSize: 6.5, color: BRAND, fontFamily: 'Helvetica-Bold' },
  footerText:  { fontSize: 6.5, color: INK_FAINT },
})

// ── PDF document ──────────────────────────────────────────────

export function PalpitesPdf({ data }: { data: PalpitesPdfData }) {
  const { matches, rows, filter_label, generated_at, total_bets } = data
  const cW = matchColW(matches.length)
  const respondents = rows.filter(r => r.bets.some(b => b.prediction !== null)).length

  return (
    <Document title={`OusaBolão · Palpites · ${filter_label}`} author="OusaBolão">
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <View style={s.brandRow}>
              <View style={s.brandDot} />
              <Text style={s.brandName}>OusaBolão</Text>
            </View>
            <Text style={s.subtitle}>Palpites · {filter_label} · Copa 2026</Text>
          </View>
          <View>
            <Text style={s.metaText}>Gerado em {formatDateTime(generated_at)}</Text>
            <Text style={[s.metaText, { marginTop: 2 }]}>(horário de Campo Grande)</Text>
          </View>
        </View>

        {/* ── Stats ──────────────────────────────────────────── */}
        <View style={s.statsRow}>
          {[
            `${rows.length} participantes`,
            `${respondents} com palpites`,
            `${total_bets} palpites registrados`,
            `${matches.length} jogos`,
          ].map((label, i) => (
            <View key={i} style={s.statBadge}>
              <View style={s.statDot} />
              <Text style={s.statText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Table ──────────────────────────────────────────── */}
        <View style={s.table}>

          {/* Header row */}
          <View style={s.tableHeaderRow}>
            <View style={[s.cell, { width: PLAYER_COL_W }]}>
              <Text style={s.hdrPlayerText}>Participante</Text>
            </View>
            {matches.map((m, i) => (
              <View key={i} style={[s.cell, { width: cW, alignItems: 'center' }]}>
                <View style={s.hdrMatchAbbrRow}>
                  {m.home_emblem ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image src={m.home_emblem} style={{ width: 10, height: 7, marginRight: 2 }} />
                  ) : null}
                  <Text style={s.hdrMatchAbbr}>{m.home_abbr}</Text>
                  <Text style={[s.hdrMatchAbbr, { marginHorizontal: 2 }]}>×</Text>
                  {m.away_emblem ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image src={m.away_emblem} style={{ width: 10, height: 7, marginLeft: 2 }} />
                  ) : null}
                  <Text style={s.hdrMatchAbbr}>{m.away_abbr}</Text>
                </View>
                <Text style={s.hdrMatchDate}>{m.date_label}</Text>
                {m.score && <Text style={s.hdrMatchScore}>{m.score}</Text>}
              </View>
            ))}
          </View>

          {/* Data rows */}
          {rows.length === 0 ? (
            <View style={[s.tableRow, { paddingVertical: 12, justifyContent: 'center' }]}>
              <Text style={s.emptyCell}>Nenhum participante.</Text>
            </View>
          ) : rows.map((row, i) => (
            <View
              key={i}
              style={i % 2 === 1 ? [s.tableRow, s.tableRowAlt] : s.tableRow}
              wrap={false}
            >
              {/* Player */}
              <View style={[s.cell, { width: PLAYER_COL_W, justifyContent: 'flex-start' }]}>
                <Text style={s.playerText}>{row.player_name}</Text>
                {!row.is_paid && <Text style={s.pendingBadge}>Pgto pendente</Text>}
              </View>

              {/* Bets */}
              {row.bets.map((bet, j) => (
                <View key={j} style={[s.cell, { width: cW, alignItems: 'center' }]}>
                  {bet.prediction ? (
                    <>
                      <Text style={s.predText}>{bet.prediction}</Text>
                      {bet.points !== null && (
                        <Text style={
                          bet.points === 15 ? s.ptsExact :
                          bet.points === 5  ? s.ptsResult :
                          s.ptsZero
                        }>
                          {bet.points}pts
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={s.emptyCell}>—</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* ── Footer ─────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerBrand}>OusaBolão</Text>
          <Text style={s.footerText}>
            {filter_label} · {rows.length} participantes · {matches.length} jogos · Copa do Mundo 2026
          </Text>
        </View>

      </Page>
    </Document>
  )
}
