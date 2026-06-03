export default function PalpiteLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="h-8 w-28 rounded-card bg-hairline mb-1.5" />
      <div className="h-4 w-40 rounded-card bg-hairline mb-5" />

      {/* Date nav */}
      <div className="flex gap-2 mb-5">
        <div className="w-8 h-8 rounded-full bg-hairline" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-16 h-12 rounded-xl bg-card border border-hairline" />
        ))}
        <div className="w-8 h-8 rounded-full bg-hairline" />
      </div>

      {/* Match cards */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-card bg-card border border-hairline p-4">
            {/* Card header */}
            <div className="flex justify-between mb-5">
              <div className="h-3 w-36 rounded-pill bg-hairline" />
              <div className="h-3 w-12 rounded-pill bg-hairline" />
            </div>
            {/* Teams + steppers */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-sm bg-card-sunken" />
                <div className="h-3 w-12 rounded-pill bg-hairline" />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-9 rounded bg-hairline/50" />
                  <div className="w-14 h-14 rounded bg-hairline/30" />
                  <div className="w-10 h-9 rounded bg-hairline/50" />
                </div>
                <div className="w-4 h-14 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-hairline mx-auto" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-9 rounded bg-hairline/50" />
                  <div className="w-14 h-14 rounded bg-hairline/30" />
                  <div className="w-10 h-9 rounded bg-hairline/50" />
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-sm bg-card-sunken" />
                <div className="h-3 w-12 rounded-pill bg-hairline" />
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between mt-4">
              <div className="h-3 w-28 rounded-pill bg-hairline" />
              <div className="h-9 w-24 rounded-btn bg-hairline" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
