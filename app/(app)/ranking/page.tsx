import { Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RankingClient, type RankingEntry } from './_components/RankingClient'

async function getData(): Promise<{ entries: RankingEntry[]; currentUserId: string | null }> {
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

  const entries: RankingEntry[] = (rankings ?? []).map((r, idx) => {
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
  let entries: RankingEntry[]
  let currentUserId: string | null

  try {
    ;({ entries, currentUserId } = await getData())
  } catch {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-center px-6">
        <Trophy size={36} className="text-ink-faint/50" strokeWidth={1.5} />
        <div>
          <p className="font-semibold text-ink">Não foi possível carregar</p>
          <p className="text-sm text-ink-soft mt-1">Tente novamente em instantes.</p>
        </div>
      </div>
    )
  }

  return <RankingClient initialEntries={entries} currentUserId={currentUserId} />
}
