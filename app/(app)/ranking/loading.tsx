export default function RankingLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="h-8 w-32 rounded-card bg-hairline mb-1.5" />
      <div className="h-4 w-48 rounded-card bg-hairline mb-6" />

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 px-4 mb-4">
        {([56, 80, 40] as const).map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center rounded-card bg-card border border-hairline overflow-hidden pt-4 pb-0">
            <div className="h-3 w-6 rounded-pill bg-hairline mb-3" />
            <div className={`rounded-full bg-card-sunken ${i === 1 ? 'w-16 h-16' : 'w-12 h-12'}`} />
            <div className="h-3 w-14 rounded-pill bg-hairline mt-2.5 mb-1" />
            <div className="h-3 w-10 rounded-pill bg-hairline mb-3" />
            <div className="w-full bg-card-sunken" style={{ height: h }} />
          </div>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[62px] rounded-card bg-card border border-hairline" />
        ))}
      </div>
    </div>
  )
}
