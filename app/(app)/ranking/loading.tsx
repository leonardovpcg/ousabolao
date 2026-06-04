export default function RankingLoading() {
  return (
    <div>
      {/* Header */}
      <div className="h-8 w-28 rounded-card skeleton mb-1.5" />
      <div className="h-4 w-44 rounded-card skeleton mb-5" />

      {/* Podium — 2º | 1º | 3º */}
      <div className="flex items-end justify-center gap-2.5 pt-4 pb-3">
        {/* 2nd */}
        <div className="flex-1 flex flex-col items-center rounded-card bg-card border border-hairline overflow-hidden">
          <div className="flex flex-col items-center pt-4 pb-0 px-2 w-full">
            <div className="h-2.5 w-5 rounded-pill skeleton mb-2.5" />
            <div className="w-[64px] h-[64px] rounded-full skeleton" />
            <div className="h-2.5 w-14 rounded-pill skeleton mt-2.5 mb-1" />
            <div className="h-5 w-12 rounded-pill skeleton mb-3" />
          </div>
          <div className="w-full skeleton" style={{ height: 62 }} />
        </div>

        {/* 1st */}
        <div className="flex-1 flex flex-col items-center rounded-card bg-card border border-hairline overflow-hidden">
          <div className="flex flex-col items-center pt-4 pb-0 px-2 w-full">
            <div className="h-3 w-3 rounded-full skeleton mb-1" />
            <div className="h-2.5 w-5 rounded-pill skeleton mb-2.5" />
            <div className="w-[80px] h-[80px] rounded-full skeleton" />
            <div className="h-2.5 w-16 rounded-pill skeleton mt-2.5 mb-1" />
            <div className="h-5 w-14 rounded-pill skeleton mb-3" />
          </div>
          <div className="w-full skeleton" style={{ height: 88 }} />
        </div>

        {/* 3rd */}
        <div className="flex-1 flex flex-col items-center rounded-card bg-card border border-hairline overflow-hidden">
          <div className="flex flex-col items-center pt-4 pb-0 px-2 w-full">
            <div className="h-2.5 w-5 rounded-pill skeleton mb-2.5" />
            <div className="w-[58px] h-[58px] rounded-full skeleton" />
            <div className="h-2.5 w-14 rounded-pill skeleton mt-2.5 mb-1" />
            <div className="h-5 w-12 rounded-pill skeleton mb-3" />
          </div>
          <div className="w-full skeleton" style={{ height: 44 }} />
        </div>
      </div>

      {/* Ranking list */}
      <div className="flex flex-col gap-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[64px] rounded-card skeleton"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    </div>
  )
}
