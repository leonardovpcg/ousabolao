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
  match_group: string | null
  round: string | null
}

export type PalpitesPdfRow = {
  player_name: string
  is_paid: boolean
  // bets[j] maps to matches[j]
  bets: Array<{ prediction: string | null; points: number | null }>
}

export type PalpitesPdfData = {
  filter_label: string
  matches: PalpitesPdfMatch[]
  rows: PalpitesPdfRow[]
  generated_at: string
  total_bets: number
}

// ── Layout ────────────────────────────────────────────────────
//
// Layout: MATCHES as rows (vertical, auto-paginated)
//         PLAYERS as columns (horizontal, chunked if many)
//
// A4 landscape: 841.89 × 595.28 pt

const MARGIN_H       = 32
const USABLE_W       = 841.89 - MARGIN_H * 2   // 777.89 pt
const MATCH_COL_W    = 106                       // fixed left column: match info
const AVAIL_PLAYER_W = USABLE_W - MATCH_COL_W   // 671.89 pt for player columns
const MIN_PLAYER_COL = 40                        // minimum readable column width
const MAX_CHUNK      = Math.floor(AVAIL_PLAYER_W / MIN_PLAYER_COL)  // ≈ 16

function calcPlayerCol(totalPlayers: number): { chunkSize: number; colW: number } {
  const chunkSize = Math.min(totalPlayers, MAX_CHUNK)
  const colW = Math.min(72, Math.floor(AVAIL_PLAYER_W / Math.max(chunkSize, 1)))
  return { chunkSize, colW }
}

// Shorten player name to first name (≤ 10 chars)
function shortName(full: string): string {
  const first = full.split(' ')[0] ?? full
  return first.length > 10 ? first.slice(0, 9) + '.' : first
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
    paddingVertical: 26,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },

  // Page header
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
  metaRight: { alignItems: 'flex-end' },
  pageBadge: { fontSize: 7, color: BRAND, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  metaText:  { fontSize: 6, color: INK_FAINT },

  // Stats row
  statsRow:  { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 7 },
  statBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, borderWidth: 1, borderColor: HAIRLINE,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2.5, marginRight: 6, marginBottom: 3,
  },
  statDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: BRAND, marginRight: 4 },
  statText: { fontSize: 6.5, color: INK_SOFT },

  // Table
  table:          { borderWidth: 1, borderColor: HAIRLINE, borderRadius: 5, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: INK },
  tableRow:       { flexDirection: 'row', borderTopWidth: 1, borderTopColor: HAIRLINE },
  tableRowAlt:    { backgroundColor: SUNKEN },
  tableRowDone:   { borderLeftWidth: 2, borderLeftColor: BRAND },

  // Cells — common
  cell: { paddingHorizontal: 5, paddingVertical: 5 },

  // Match column (left) — header
  hdrMatchLabel: { fontSize: 6, color: CARD, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.4 },

  // Match column (left) — body
  matchTeamRow:  { flexDirection: 'row', alignItems: 'center' },
  matchFlag:     { width: 10, height: 7, marginRight: 3 },
  matchAbbrs:    { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: INK, flex: 1 },
  matchMeta:     { fontSize: 5.5, color: INK_FAINT, marginTop: 2 },
  matchScore:    { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BRAND, marginTop: 2 },

  // Player column — header
  hdrPlayerName: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: CARD, textAlign: 'center' },
  hdrPending:    { fontSize: 5, color: LOSS, textAlign: 'center', marginTop: 1 },

  // Player column — body (bet cell)
  predText:   { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: INK, textAlign: 'center' },
  ptsExact:   { fontSize: 6, fontFamily: 'Helvetica-Bold', color: BRAND, textAlign: 'center', marginTop: 1 },
  ptsResult:  { fontSize: 6, color: WIN, textAlign: 'center', marginTop: 1 },
  ptsZero:    { fontSize: 6, color: INK_FAINT, textAlign: 'center', marginTop: 1 },
  emptyCell:  { fontSize: 9, color: '#CCCCCC', textAlign: 'center' },

  // Footer
  footer:      { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderTopColor: HAIRLINE },
  footerBrand: { fontSize: 6.5, color: BRAND, fontFamily: 'Helvetica-Bold' },
  footerText:  { fontSize: 6, color: INK_FAINT },
})

// ── Points style helper ───────────────────────────────────────

function ptsStyle(pts: number) {
  if (pts === 15) return s.ptsExact
  if (pts === 5)  return s.ptsResult
  return s.ptsZero
}

// ── Single page (one player chunk) ───────────────────────────

interface ChunkPageProps {
  data: PalpitesPdfData
  chunkRows: PalpitesPdfRow[]   // player columns for this page
  pageNum: number
  totalPages: number
  colW: number
}

function ChunkPage({ data, chunkRows, pageNum, totalPages, colW }: ChunkPageProps) {
  const { matches, rows, filter_label, generated_at, total_bets } = data
  const isFirst     = pageNum === 1
  const respondents = rows.filter(r => r.bets.some(b => b.prediction !== null)).length

  return (
    <Page size="A4" orientation="landscape" style={s.page}>

      {/* ── Page header (repeats on vertical overflow pages) ── */}
      <View style={s.pageHeader} fixed>
        <View>
          <View style={s.brandRow}>
            <View style={s.brandDot} />
            <Text style={s.brandName}>OusaBolão</Text>
          </View>
          <Text style={s.subtitle}>
            Palpites Gerais · {filter_label} · Copa do Mundo 2026
          </Text>
        </View>
        <View style={s.metaRight}>
          {totalPages > 1 && (
            <Text style={s.pageBadge}>Página {pageNum} de {totalPages}</Text>
          )}
          <Text style={s.metaText}>Gerado em {formatDateTime(generated_at)} (Campo Grande)</Text>
        </View>
      </View>

      {/* ── Stats (first page only) ── */}
      {isFirst && (
        <View style={s.statsRow}>
          {[
            `${rows.length} participante${rows.length !== 1 ? 's' : ''}`,
            `${respondents} com palpites`,
            `${total_bets} palpites registrados`,
            `${matches.length} jogo${matches.length !== 1 ? 's' : ''}`,
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

        {/* Column header row: match label + player names */}
        <View style={s.tableHeaderRow} fixed>
          {/* Match column label */}
          <View style={[s.cell, { width: MATCH_COL_W, justifyContent: 'center' }]}>
            <Text style={s.hdrMatchLabel}>Jogo</Text>
          </View>

          {/* Player name headers */}
          {chunkRows.map((row, i) => (
            <View key={i} style={[s.cell, { width: colW, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={s.hdrPlayerName}>{shortName(row.player_name)}</Text>
              {!row.is_paid && <Text style={s.hdrPending}>Pend.</Text>}
            </View>
          ))}
        </View>

        {/* Match rows */}
        {matches.length === 0 ? (
          <View style={[s.tableRow, { paddingVertical: 12 }]}>
            <Text style={[s.emptyCell, { flex: 1 }]}>Nenhum jogo neste filtro.</Text>
          </View>
        ) : matches.map((match, matchIdx) => {
          const isFinished = match.score !== null
          const rowBase    = matchIdx % 2 === 1 ? [s.tableRow, s.tableRowAlt] : [s.tableRow]
          const rowStyle   = isFinished ? [...rowBase, s.tableRowDone] : rowBase

          // Build subtitle: group + round info
          const parts: string[] = []
          if (match.match_group) parts.push(`Gr. ${match.match_group}`)
          if (match.round)       parts.push(`R${match.round}`)
          parts.push(match.date_label)
          const metaLine = parts.join(' · ')

          return (
            <View key={matchIdx} style={rowStyle} wrap={false}>

              {/* Match info cell */}
              <View style={[s.cell, { width: MATCH_COL_W }]}>
                <View style={s.matchTeamRow}>
                  {match.home_emblem ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image src={match.home_emblem} style={s.matchFlag} />
                  ) : null}
                  <Text style={s.matchAbbrs}>
                    {match.home_abbr} × {match.away_abbr}
                  </Text>
                  {match.away_emblem ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image src={match.away_emblem} style={[s.matchFlag, { marginRight: 0, marginLeft: 3 }]} />
                  ) : null}
                </View>
                <Text style={s.matchMeta}>{metaLine}</Text>
                {isFinished && <Text style={s.matchScore}>{match.score}</Text>}
              </View>

              {/* Bet cells — one per player in this chunk */}
              {chunkRows.map((row, j) => {
                const bet = row.bets[matchIdx]
                return (
                  <View key={j} style={[s.cell, { width: colW, alignItems: 'center', justifyContent: 'center' }]}>
                    {bet?.prediction ? (
                      <>
                        <Text style={s.predText}>{bet.prediction}</Text>
                        {isFinished && bet.points !== null && (
                          <Text style={ptsStyle(bet.points)}>{bet.points}pts</Text>
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
      </View>

      {/* ── Footer ── */}
      <View style={s.footer} fixed>
        <Text style={s.footerBrand}>OusaBolão</Text>
        <Text style={s.footerText}>
          {filter_label} · {rows.length} participantes · {matches.length} jogos · Copa do Mundo 2026
        </Text>
      </View>

    </Page>
  )
}

// ── Document ──────────────────────────────────────────────────

export function PalpitesPdf({ data }: { data: PalpitesPdfData }) {
  const { rows } = data
  const { chunkSize, colW } = calcPlayerCol(rows.length)

  // Chunk players into column groups
  const chunks: PalpitesPdfRow[][] = []
  for (let i = 0; i < rows.length; i += chunkSize) {
    chunks.push(rows.slice(i, i + chunkSize))
  }
  if (chunks.length === 0) chunks.push([])

  return (
    <Document
      title={`OusaBolão · Palpites · ${data.filter_label}`}
      author="OusaBolão"
    >
      {chunks.map((chunkRows, idx) => (
        <ChunkPage
          key={idx}
          data={data}
          chunkRows={chunkRows}
          pageNum={idx + 1}
          totalPages={chunks.length}
          colW={colW}
        />
      ))}
    </Document>
  )
}
