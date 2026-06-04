import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { formatDateTime } from '@/lib/utils/datetime'

// ── Exported types ────────────────────────────────────────────

export type PalpitesPdfMatch = {
  id: string
  home_abbr: string
  away_abbr: string
  home_emblem: string | null
  away_emblem: string | null
  date_label: string
  score: string | null
}

export type PalpitesPdfRow = {
  player_name: string
  is_paid: boolean
  // bets[j] maps to matches[j] in the filtered match list
  bets: Array<{ prediction: string | null; points: number | null }>
}

export type PalpitesPdfData = {
  filter_label: string
  matches: PalpitesPdfMatch[]
  rows: PalpitesPdfRow[]
  generated_at: string
  total_bets: number
}

// ── Layout constants ──────────────────────────────────────────

const MARGIN_H      = 36                          // horizontal page margin (pt)
const USABLE_W      = 841.89 - MARGIN_H * 2       // A4 landscape usable width = 769.89
const PLAYER_COL_W  = 132                          // fixed player name column
const AVAIL_W       = USABLE_W - PLAYER_COL_W     // width for match columns = 637.89
const COLS_PER_PAGE = 10                           // max match columns per page
const MAX_COL_W     = 82                           // cap: avoid overly-wide columns for few matches

function colWidth(totalMatches: number): number {
  const cols = Math.min(totalMatches, COLS_PER_PAGE)
  return Math.min(MAX_COL_W, Math.floor(AVAIL_W / Math.max(cols, 1)))
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
    paddingVertical: 28,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },

  // ── Page header ──
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 9,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  brandRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  brandDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND, marginRight: 6 },
  brandName: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: INK },
  subtitle:  { fontSize: 7.5, color: INK_SOFT, marginLeft: 14 },
  metaRight: { alignItems: 'flex-end' },
  pageBadge: { fontSize: 7, color: BRAND, fontFamily: 'Helvetica-Bold', textAlign: 'right', marginBottom: 1 },
  metaText:  { fontSize: 6.5, color: INK_FAINT, textAlign: 'right' },

  // ── Stats row (first page only) ──
  statsRow:  { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  statBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, borderWidth: 1, borderColor: HAIRLINE,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2.5, marginRight: 6, marginBottom: 4,
  },
  statDot:  { width: 4.5, height: 4.5, borderRadius: 2.25, backgroundColor: BRAND, marginRight: 4 },
  statText: { fontSize: 6.5, color: INK_SOFT },

  // ── Table ──
  table:          { borderWidth: 1, borderColor: HAIRLINE, borderRadius: 5, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: INK },
  tableRow:       { flexDirection: 'row', borderTopWidth: 1, borderTopColor: HAIRLINE },
  tableRowAlt:    { backgroundColor: SUNKEN },

  // Cells
  cell: { paddingHorizontal: 4, paddingVertical: 4, justifyContent: 'center' },

  // Header cell content
  hdrPlayerLabel: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: CARD, textTransform: 'uppercase', letterSpacing: 0.4 },
  hdrFlagRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
  hdrAbbr:        { fontSize: 5.5, color: CARD, textAlign: 'center' },
  hdrDate:        { fontSize: 5, color: '#9A98A1', textAlign: 'center', marginTop: 1 },
  hdrScore:       { fontSize: 6, fontFamily: 'Helvetica-Bold', color: BRAND, textAlign: 'center', marginTop: 1 },

  // Body cell content
  playerName:  { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: INK },
  pendingText: { fontSize: 5.5, color: LOSS, marginTop: 1 },
  predText:    { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: INK, textAlign: 'center' },
  ptsExact:    { fontSize: 6, fontFamily: 'Helvetica-Bold', color: BRAND, textAlign: 'center' },
  ptsResult:   { fontSize: 6, color: WIN, textAlign: 'center' },
  ptsZero:     { fontSize: 6, color: INK_FAINT, textAlign: 'center' },
  emptyCell:   { fontSize: 8, color: '#CCCCCC', textAlign: 'center' },

  // ── Footer ──
  footer:      { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderTopColor: HAIRLINE },
  footerBrand: { fontSize: 6.5, color: BRAND, fontFamily: 'Helvetica-Bold' },
  footerText:  { fontSize: 6, color: INK_FAINT },
})

// ── Single chunk page ─────────────────────────────────────────

interface ChunkPageProps {
  data: PalpitesPdfData
  chunkMatches: PalpitesPdfMatch[]
  matchStartIdx: number
  pageNum: number
  totalPages: number
  cW: number
}

function ChunkPage({
  data,
  chunkMatches,
  matchStartIdx,
  pageNum,
  totalPages,
  cW,
}: ChunkPageProps) {
  const { rows, filter_label, generated_at, total_bets } = data
  const isFirstPage  = pageNum === 1
  const respondents  = rows.filter(r => r.bets.some(b => b.prediction !== null)).length

  return (
    <Page size="A4" orientation="landscape" style={s.page}>

      {/* ── Page header (repeats on vertical overflow pages) ── */}
      <View style={s.pageHeader} fixed>
        <View>
          <View style={s.brandRow}>
            <View style={s.brandDot} />
            <Text style={s.brandName}>OusaBolão</Text>
          </View>
          <Text style={s.subtitle}>Palpites · {filter_label} · Copa do Mundo 2026</Text>
        </View>
        <View style={s.metaRight}>
          {totalPages > 1 && (
            <Text style={s.pageBadge}>Página {pageNum} de {totalPages}</Text>
          )}
          <Text style={s.metaText}>Gerado em {formatDateTime(generated_at)}</Text>
          <Text style={[s.metaText, { marginTop: 1 }]}>(Campo Grande, MS)</Text>
        </View>
      </View>

      {/* ── Stats (first page only) ── */}
      {isFirstPage && (
        <View style={s.statsRow}>
          {[
            `${rows.length} participante${rows.length !== 1 ? 's' : ''}`,
            `${respondents} com palpites`,
            `${total_bets} palpites registrados`,
            `${data.matches.length} jogo${data.matches.length !== 1 ? 's' : ''} no total`,
          ].map((label, i) => (
            <View key={i} style={s.statBadge}>
              <View style={s.statDot} />
              <Text style={s.statText}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Table ── */}
      <View style={s.table}>

        {/* Table header row (repeats on vertical overflow) */}
        <View style={s.tableHeaderRow} fixed>
          {/* Player column */}
          <View style={[s.cell, { width: PLAYER_COL_W }]}>
            <Text style={s.hdrPlayerLabel}>Participante</Text>
          </View>
          {/* Match columns */}
          {chunkMatches.map((m, i) => (
            <View key={i} style={[s.cell, { width: cW, alignItems: 'center' }]}>
              <View style={s.hdrFlagRow}>
                {m.home_emblem ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image src={m.home_emblem} style={{ width: 10, height: 7, marginRight: 2 }} />
                ) : null}
                <Text style={s.hdrAbbr}>{m.home_abbr}</Text>
                <Text style={[s.hdrAbbr, { marginHorizontal: 2 }]}>×</Text>
                {m.away_emblem ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image src={m.away_emblem} style={{ width: 10, height: 7, marginLeft: 2 }} />
                ) : null}
                <Text style={s.hdrAbbr}>{m.away_abbr}</Text>
              </View>
              <Text style={s.hdrDate}>{m.date_label}</Text>
              {m.score && <Text style={s.hdrScore}>{m.score}</Text>}
            </View>
          ))}
        </View>

        {/* Data rows */}
        {rows.length === 0 ? (
          <View style={[s.tableRow, { paddingVertical: 12, justifyContent: 'center' }]}>
            <Text style={s.emptyCell}>Nenhum participante encontrado.</Text>
          </View>
        ) : rows.map((row, rowIdx) => {
          // Slice only the bets that correspond to this chunk's matches
          const betsSlice = row.bets.slice(matchStartIdx, matchStartIdx + chunkMatches.length)
          return (
            <View
              key={rowIdx}
              style={rowIdx % 2 === 1 ? [s.tableRow, s.tableRowAlt] : s.tableRow}
              wrap={false}
            >
              {/* Player name */}
              <View style={[s.cell, { width: PLAYER_COL_W }]}>
                <Text style={s.playerName}>{row.player_name}</Text>
                {!row.is_paid && <Text style={s.pendingText}>Pgto pendente</Text>}
              </View>

              {/* Bet cells */}
              {betsSlice.map((bet, j) => (
                <View key={j} style={[s.cell, { width: cW, alignItems: 'center' }]}>
                  {bet.prediction ? (
                    <>
                      <Text style={s.predText}>{bet.prediction}</Text>
                      {bet.points !== null && (
                        <Text
                          style={
                            bet.points === 15 ? s.ptsExact :
                            bet.points === 5  ? s.ptsResult :
                            s.ptsZero
                          }
                        >
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
          )
        })}
      </View>

      {/* ── Footer ── */}
      <View style={s.footer} fixed>
        <Text style={s.footerBrand}>OusaBolão</Text>
        <Text style={s.footerText}>
          {filter_label} · {rows.length} participantes · {data.matches.length} jogos · Copa do Mundo 2026
        </Text>
      </View>

    </Page>
  )
}

// ── Document ──────────────────────────────────────────────────

export function PalpitesPdf({ data }: { data: PalpitesPdfData }) {
  const { matches } = data
  const cW = colWidth(matches.length)

  // Split matches into chunks of COLS_PER_PAGE each
  const chunks: Array<{ chunkMatches: PalpitesPdfMatch[]; startIdx: number }> = []
  for (let i = 0; i < matches.length; i += COLS_PER_PAGE) {
    chunks.push({
      chunkMatches: matches.slice(i, i + COLS_PER_PAGE),
      startIdx: i,
    })
  }
  // Edge case: no matches
  if (chunks.length === 0) chunks.push({ chunkMatches: [], startIdx: 0 })

  return (
    <Document
      title={`OusaBolão · Palpites · ${data.filter_label}`}
      author="OusaBolão"
    >
      {chunks.map(({ chunkMatches, startIdx }, idx) => (
        <ChunkPage
          key={idx}
          data={data}
          chunkMatches={chunkMatches}
          matchStartIdx={startIdx}
          pageNum={idx + 1}
          totalPages={chunks.length}
          cW={cW}
        />
      ))}
    </Document>
  )
}
