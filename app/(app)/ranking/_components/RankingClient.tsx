'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Trophy, Share2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buildRankingEntries } from '../rankingUtils'
import type { RankingEntry } from '../rankingUtils'
import { Podium } from './Podium'
import { RankList } from './RankList'
import { PlayerBetsSheet } from './PlayerBetsSheet'

export type { RankingEntry }

type Props = {
  initialEntries: RankingEntry[]
  currentUserId: string | null
}

export function RankingClient({ initialEntries, currentUserId }: Props) {
  const [entries, setEntries] = useState<RankingEntry[]>(initialEntries)
  const [selectedEntry, setSelectedEntry] = useState<RankingEntry | null>(null)
  const [imgLoading, setImgLoading] = useState(false)
  const rankingRef = useRef<HTMLDivElement>(null)

  const handleShare = useCallback(async () => {
    if (!rankingRef.current || imgLoading) return
    setImgLoading(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(rankingRef.current, { pixelRatio: 2, backgroundColor: '#F6F5F1' })
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], 'ranking-ousabolao.png', { type: 'image/png' })
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'OusaBolão' })
      } else {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = 'ranking-ousabolao.png'
        a.click()
      }
    } catch (e) {
      console.error('Erro ao compartilhar imagem:', e)
    } finally {
      setImgLoading(false)
    }
  }, [imgLoading])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function fetchRanking() {
      const [{ data: rankings }, { data: profiles }] = await Promise.all([
        supabase
          .from('ranking')
          .select('id, user_id, total_points, exact_scores, correct_results'),
        supabase.from('profiles').select('id, name, avatar_url'),
      ])

      if (cancelled || !rankings || !profiles) return

      setEntries(buildRankingEntries(rankings, profiles))
    }

    const channel = supabase
      .channel('ranking_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ranking' }, fetchRanking)
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-5 text-center px-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(200,136,30,.10), rgba(200,136,30,.04))' }}
        >
          <Trophy size={28} className="text-brand/60" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-display text-xl font-semibold text-ink">A competição ainda não começou</p>
          <p className="text-sm text-ink-soft mt-2 max-w-xs mx-auto leading-relaxed">
            O ranking aparece assim que o primeiro resultado for lançado.
          </p>
        </div>
      </div>
    )
  }

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)
  const showPicanha = entries.length >= 4
  const picanhaUserIds = showPicanha
    ? new Set(entries.slice(-2).map((e) => e.user_id))
    : new Set<string>()

  return (
    <div>
      {/* Captured area — excludes the sheet overlay */}
      <div ref={rankingRef}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
              Ranking
            </h1>
            <p className="text-ink-soft text-sm mt-1">Copa do Mundo 2026</p>
          </div>
          <button
            type="button"
            onClick={handleShare}
            disabled={imgLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-hairline bg-card text-ink-faint text-[11px] font-semibold hover:text-ink hover:border-ink-faint active:scale-[.98] transition-all disabled:opacity-40 mt-1"
            title="Compartilhar ranking"
          >
            {imgLoading
              ? <Loader2 size={12} className="animate-spin" />
              : <Share2 size={12} strokeWidth={2} />
            }
            Compartilhar
          </button>
        </div>

        <Podium entries={top3} currentUserId={currentUserId} onSelect={setSelectedEntry} />

        {rest.length > 0 && (
          <RankList
            entries={rest}
            currentUserId={currentUserId}
            picanhaUserIds={picanhaUserIds}
            showPicanha={showPicanha}
            onSelect={setSelectedEntry}
          />
        )}
      </div>

      <PlayerBetsSheet entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  )
}
