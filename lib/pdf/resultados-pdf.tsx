import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { formatDateTime } from '@/lib/utils/datetime'

// ── Types ─────────────────────────────────────────────────────

export type ResultadosPdfMatch = {
  id: string
  home_abbr: string
  away_abbr: string
  home_emblem: string | null
  away_emblem: string | null
  date_label: string
  score: string            // always set (only finished matches)
  match_group: string | null
  round: string | null
}

export type ResultadosPdfPlayer = {
  player_name: string
  window_points: number    // total pts in the filtered window — used for sort
  bets: Array<{ prediction: string | null; points: number | null }>
}

export type ResultadosPdfData = {
  filter_label: string
  matches: ResultadosPdfMatch[]
  players: ResultadosPdfPlayer[] // sorted desc by window_points before passing
  generated_at: string
}

// ── Layout — A3 landscape (same usable space as palpites-pdf) ─

const MARGIN_H       = 36
const USABLE_W       = 1190.55 - MARGIN_H * 2
const MATCH_COL_W    = 116
const TOTAL_COL_W    = 48
const AVAIL_PLAYER_W = USABLE_W - MATCH_COL_W - TOTAL_COL_W
const MIN_PLAYER_COL = 40
const MAX_CHUNK      = Math.floor(AVAIL_PLAYER_W / MIN_PLAYER_COL)

function calcPlayerCol(totalPlayers: number): { chunkSize: number; colW: number } {
  const chunkSize = Math.min(totalPlayers, MAX_CHUNK)
  const colW = Math.min(70, Math.floor(AVAIL_PLAYER_W / Math.max(chunkSize, 1)))
  return { chunkSize, colW }
}

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
  metaRight: { alignItems: 'flex-end' },
  pageBadge: { fontSize: 7, color: BRAND, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  metaText:  { fontSize: 6, color: INK_FAINT },

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

  cell: { paddingHorizontal: 5, paddingVertical: 4 },

  hdrMatchLabel:  { fontSize: 6, color: CARD, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.4 },
  hdrPlayerName:  { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: CARD, textAlign: 'center' },
  hdrTotalLabel:  { fontSize: 6, fontFamily: 'Helvetica-Bold', color: BRAND, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.4 },

  matchTeamRow:   { flexDirection: 'row', alignItems: 'center' },
  matchFlag:      { width: 12, height: 8.5, marginRight: 2 },
  matchAbbr:      { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: INK },
  matchVs:        { fontSize: 6.5, color: INK_FAINT, marginHorizontal: 3 },
  matchMeta:      { fontSize: 5.5, color: INK_FAINT, marginTop: 2 },
  matchScore:     { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BRAND, marginTop: 2 },

  predText:     { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: INK, textAlign: 'center' },
  ptsExact:     { fontSize: 6, fontFamily: 'Helvetica-Bold', color: BRAND, textAlign: 'center', marginTop: 1 },
  ptsResult:    { fontSize: 6, color: WIN, textAlign: 'center', marginTop: 1 },
  ptsZero:      { fontSize: 6, color: INK_FAINT, textAlign: 'center', marginTop: 1 },
  emptyCell:    { fontSize: 9, color: '#CCCCCC', textAlign: 'center' },

  totalCell:    { fontSize: 9, fontFamily: 'Helvetica-Bold', color: BRAND, textAlign: 'center' },
  totalHeader:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: INK_SOFT, textAlign: 'center' },

  footer:       { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderTopColor: HAIRLINE },
  footerBrand:  { fontSize: 6.5, color: BRAND, fontFamily: 'Helvetica-Bold' },
  footerText:   { fontSize: 6, color: INK_FAINT },
})

function ptsStyle(pts: number) {
  if (pts === 15) return s.ptsExact
  if (pts === 5)  return s.ptsResult
  return s.ptsZero
}

// ── Chunk page ────────────────────────────────────────────────

interface ChunkPageProps {
  data: ResultadosPdfData
  chunkPlayers: ResultadosPdfPlayer[]
  pageNum: number
  totalPages: number
  colW: number
}

function ChunkPage({ data, chunkPlayers, pageNum, totalPages, colW }: ChunkPageProps) {
  const { matches, players, filter_label, generated_at } = data
  const isFirst = pageNum === 1

  return (
    <Page size="A3" orientation="landscape" style={s.page}>

      {/* Header */}
      <View style={s.pageHeader} fixed>
        <View>
          <View style={s.brandRow}>
            <View style={s.brandDot} />
            <Text style={s.brandName}>OusaBolão</Text>
          </View>
          <Text style={s.subtitle}>
            Resultados · {filter_label} · Copa do Mundo 2026
          </Text>
        </View>
        <View style={s.metaRight}>
          {totalPages > 1 && (
            <Text style={s.pageBadge}>Página {pageNum} de {totalPages}</Text>
          )}
          <Text style={s.metaText}>Gerado em {formatDateTime(generated_at)} (Campo Grande)</Text>
        </View>
      </View>

      {/* Stats (first page only) */}
      {isFirst && (
        <View style={s.statsRow}>
          {[
            `${players.length} participante${players.length !== 1 ? 's' : ''}`,
            `${matches.length} jogo${matches.length !== 1 ? 's' : ''} encerrado${matches.length !== 1 ? 's' : ''}`,
            `Ordenado por pontos na janela`,
          ].map((label, i) => (
            <View key={i} style={s.statBadge}>
              <View style={s.statDot} />
              <Text style={s.statText}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Table */}
      <View style={s.table}>

        {/* Column header */}
        <View style={s.tableHeaderRow} fixed>
          <View style={[s.cell, { width: MATCH_COL_W, justifyContent: 'center' }]}>
            <Text style={s.hdrMatchLabel}>Jogo · Resultado</Text>
          </View>
          {chunkPlayers.map((p, i) => (
            <View key={i} style={[s.cell, { width: colW, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={s.hdrPlayerName}>{shortName(p.player_name)}</Text>
            </View>
          ))}
          <View style={[s.cell, { width: TOTAL_COL_W, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={s.hdrTotalLabel}>Pts</Text>
          </View>
        </View>

        {/* Match rows */}
        {matches.length === 0 ? (
          <View style={[s.tableRow, { paddingVertical: 12 }]}>
            <Text style={[s.emptyCell, { flex: 1 }]}>Nenhum jogo encerrado neste filtro.</Text>
          </View>
        ) : matches.map((match, matchIdx) => {
          const rowStyle = matchIdx % 2 === 1 ? [s.tableRow, s.tableRowAlt] : [s.tableRow]
          const parts: string[] = []
          if (match.match_group) parts.push(`Gr. ${match.match_group}`)
          if (match.round)       parts.push(`R${match.round}`)
          parts.push(match.date_label)

          return (
            <View key={matchIdx} style={rowStyle} wrap={false}>
              {/* Match info */}
              <View style={[s.cell, { width: MATCH_COL_W }]}>
                <View style={s.matchTeamRow}>
                  {match.home_emblem
                    // eslint-disable-next-line jsx-a11y/alt-text
                    ? <Image src={match.home_emblem} style={s.matchFlag} />
                    : <View style={[s.matchFlag, { backgroundColor: HAIRLINE }]} />
                  }
                  <Text style={s.matchAbbr}>{match.home_abbr}</Text>
                  <Text style={s.matchVs}>×</Text>
                  <Text style={s.matchAbbr}>{match.away_abbr}</Text>
                  {match.away_emblem
                    // eslint-disable-next-line jsx-a11y/alt-text
                    ? <Image src={match.away_emblem} style={[s.matchFlag, { marginRight: 0, marginLeft: 2 }]} />
                    : <View style={[s.matchFlag, { backgroundColor: HAIRLINE, marginRight: 0, marginLeft: 2 }]} />
                  }
                </View>
                <Text style={s.matchMeta}>{parts.join(' · ')}</Text>
                <Text style={s.matchScore}>{match.score}</Text>
              </View>

              {/* Bet cells */}
              {chunkPlayers.map((player, j) => {
                const bet = player.bets[matchIdx]
                return (
                  <View key={j} style={[s.cell, { width: colW, alignItems: 'center', justifyContent: 'center' }]}>
                    {bet?.prediction ? (
                      <>
                        <Text style={s.predText}>{bet.prediction}</Text>
                        {bet.points !== null && (
                          <Text style={ptsStyle(bet.points)}>{bet.points}pts</Text>
                        )}
                      </>
                    ) : (
                      <Text style={s.emptyCell}>—</Text>
                    )}
                  </View>
                )
              })}

              {/* Total placeholder (only visible in totals row) */}
              <View style={[s.cell, { width: TOTAL_COL_W }]} />
            </View>
          )
        })}

        {/* Totals row */}
        {matches.length > 0 && (
          <View style={s.totalsRow} wrap={false}>
            <View style={[s.cell, { width: MATCH_COL_W, justifyContent: 'center' }]}>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: BRAND }}>
                Total na janela
              </Text>
            </View>
            {chunkPlayers.map((player, j) => (
              <View key={j} style={[s.cell, { width: colW, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={s.totalCell}>{player.window_points}</Text>
              </View>
            ))}
            <View style={[s.cell, { width: TOTAL_COL_W }]} />
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={s.footer} fixed>
        <Text style={s.footerBrand}>OusaBolão</Text>
        <Text style={s.footerText}>
          {filter_label} · {players.length} participantes · {matches.length} jogos · Copa do Mundo 2026
        </Text>
      </View>

    </Page>
  )
}

// ── Document ──────────────────────────────────────────────────

export function ResultadosPdf({ data }: { data: ResultadosPdfData }) {
  const { players } = data
  const { chunkSize, colW } = calcPlayerCol(players.length)

  const chunks: ResultadosPdfPlayer[][] = []
  for (let i = 0; i < players.length; i += chunkSize) {
    chunks.push(players.slice(i, i + chunkSize))
  }
  if (chunks.length === 0) chunks.push([])

  return (
    <Document
      title={`OusaBolão · Resultados · ${data.filter_label}`}
      author="OusaBolão"
    >
      {chunks.map((chunkPlayers, idx) => (
        <ChunkPage
          key={idx}
          data={data}
          chunkPlayers={chunkPlayers}
          pageNum={idx + 1}
          totalPages={chunks.length}
          colW={colW}
        />
      ))}
    </Document>
  )
}
