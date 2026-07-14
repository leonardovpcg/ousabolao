// PostgREST caps every response at 1000 rows (server max-rows) regardless of
// .limit(). Any query that can exceed that (e.g. bets: users × matches) must
// paginate until exhausted — a fixed number of pages silently drops the newest
// rows once the table grows past it.

const PAGE_SIZE = 1000

type PageResult<T> = { data: T[] | null; error: { message: string } | null }

/**
 * Fetches every row of a query by paging until a short page is returned.
 * `buildPage` must create a FRESH query with `.range(from, to)` applied and a
 * deterministic order (include a unique tiebreak column, e.g. `.order('id')`),
 * otherwise rows can repeat or be skipped across page boundaries.
 */
export async function fetchAllRows<T>(
  buildPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildPage(from, from + PAGE_SIZE - 1)
    if (error) return { data: rows, error }
    const page = data ?? []
    rows.push(...page)
    if (page.length < PAGE_SIZE) return { data: rows, error: null }
  }
}
