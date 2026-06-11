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

  // Players with identical points/exacts/results share the same position number.
  // The next distinct group skips ahead by the size of the tied group.
  for (let i = 0; i < entries.length; i++) {
    if (i === 0) {
      entries[i].position = 1
    } else {
      const prev = entries[i - 1]
      const curr = entries[i]
      const tied =
        curr.total_points === prev.total_points &&
        curr.exact_scores === prev.exact_scores &&
        curr.correct_results === prev.correct_results
      entries[i].position = tied ? prev.position : i + 1
    }
  }

  return entries
}
