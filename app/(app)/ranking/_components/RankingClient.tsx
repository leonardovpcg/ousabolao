'use client'

import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Podium } from './Podium'
import { RankList } from './RankList'

export type RankingEntry = {
  id: string
  user_id: string
  position: number
  total_points: number
  exact_scores: number
  correct_results: number
  name: string
  avatar_url: string | null
}

type Props = {
  initialEntries: RankingEntry[]
  currentUserId: string | null
}

export function RankingClient({ initialEntries, currentUserId }: Props) {
  const [entries, setEntries] = useState<RankingEntry[]>(initialEntries)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function fetchRanking() {
      const [{ data: rankings }, { data: profiles }] = await Promise.all([
        supabase
          .from('ranking')
          .select('id, user_id, position, total_points, exact_scores, correct_results')
          .order('total_points', { ascending: false })
          .order('exact_scores', { ascending: false })
          .order('correct_results', { ascending: false }),
        supabase.from('profiles').select('id, name, avatar_url'),
      ])

      if (cancelled || !rankings || !profiles) return

      const profileMap = new Map(profiles.map((p) => [p.id, p]))
      setEntries(
        rankings.map((r, idx) => {
          const profile = profileMap.get(r.user_id)
          return {
            ...r,
            position: r.position ?? idx + 1,
            name: profile?.name ?? 'Participante',
            avatar_url: profile?.avatar_url ?? null,
          }
        })
      )
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
      <div className="mb-5">
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
          Ranking
        </h1>
        <p className="text-ink-soft text-sm mt-1">Copa do Mundo 2026</p>
      </div>

      <Podium entries={top3} currentUserId={currentUserId} />

      {rest.length > 0 && (
        <RankList
          entries={rest}
          currentUserId={currentUserId}
          picanhaUserIds={picanhaUserIds}
          showPicanha={showPicanha}
        />
      )}
    </div>
  )
}
