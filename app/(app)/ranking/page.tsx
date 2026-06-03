import { Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Podium, type PodiumEntry } from './_components/Podium'
import { RankList, type RankEntry } from './_components/RankList'

type RankingRow = PodiumEntry & RankEntry & { id: string }

async function getData(): Promise<{ entries: RankingRow[]; currentUserId: string | null }> {
  const supabase = await createClient()

  const [
    { data: { user } },
    { data: rankings, error: rankErr },
    { data: profiles, error: profErr },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('ranking')
      .select('id, user_id, position, total_points, exact_scores, correct_results')
      .order('total_points', { ascending: false })
      .order('exact_scores', { ascending: false })
      .order('correct_results', { ascending: false }),
    supabase.from('profiles').select('id, name, avatar_url'),
  ])

  if (rankErr || profErr) throw new Error('DB error')

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  const entries: RankingRow[] = (rankings ?? []).map((r, idx) => {
    const profile = profileMap.get(r.user_id)
    return {
      ...r,
      position: r.position ?? idx + 1,
      name: profile?.name ?? 'Participante',
      avatar_url: profile?.avatar_url ?? null,
    }
  })

  return { entries, currentUserId: user?.id ?? null }
}

export default async function RankingPage() {
  let entries: RankingRow[]
  let currentUserId: string | null

  try {
    ;({ entries, currentUserId } = await getData())
  } catch {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <Trophy size={36} className="text-ink-faint/50" strokeWidth={1.5} />
        <div>
          <p className="font-semibold text-ink">Não foi possível carregar</p>
          <p className="text-sm text-ink-soft mt-1">Tente novamente em instantes.</p>
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <Trophy size={36} className="text-ink-faint/50" strokeWidth={1.5} />
        <div>
          <p className="font-semibold text-ink">O bolão ainda não começou</p>
          <p className="text-sm text-ink-soft mt-1">O ranking aparece após o primeiro resultado.</p>
        </div>
      </div>
    )
  }

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div>
      {/* Page header */}
      <div className="mb-2">
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
          Ranking
        </h1>
        <p className="text-ink-soft text-sm mt-1">Copa do Mundo 2026</p>
      </div>

      {/* Podium */}
      <Podium entries={top3} />

      {/* List */}
      {rest.length > 0 && (
        <RankList entries={rest} currentUserId={currentUserId} startPosition={4} />
      )}
    </div>
  )
}
