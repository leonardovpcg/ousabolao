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

type RawRankRow = {
  id: string
  user_id: string
  total_points: number | null
  exact_scores: number | null
  correct_results: number | null
}

type ProfileRow = {
  id: string
  name: string | null
  avatar_url: string | null
}

export function buildRankingEntries(
  rankings: RawRankRow[],
  profiles: ProfileRow[],
): RankingEntry[] {
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  const entries: RankingEntry[] = rankings.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    total_points: r.total_points ?? 0,
    exact_scores: r.exact_scores ?? 0,
    correct_results: r.correct_results ?? 0,
    position: 0,
    name: profileMap.get(r.user_id)?.name ?? 'Participante',
    avatar_url: profileMap.get(r.user_id)?.avatar_url ?? null,
  }))

  entries.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores
    if (b.correct_results !== a.correct_results) return b.correct_results - a.correct_results
    return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  })

  entries.forEach((e, i) => { e.position = i + 1 })

  return entries
}
