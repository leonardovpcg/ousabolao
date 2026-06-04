export default function PalpiteLoading() {
  return (
    <div>
      {/* Header */}
      <div className="h-8 w-28 rounded-card skeleton mb-1.5" />
      <div className="h-4 w-40 rounded-card skeleton mb-5" />

      {/* Date nav strip */}
      <div className="flex gap-2 mb-5">
        <div className="w-8 h-8 rounded-full skeleton" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-16 h-12 rounded-xl skeleton" />
        ))}
        <div className="w-8 h-8 rounded-full skeleton" />
      </div>

      {/* Match cards */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-card bg-card border border-hairline p-4">
            {/* Card header */}
            <div className="flex justify-between mb-5">
              <div className="h-3 w-36 rounded-pill skeleton" />
              <div className="h-3 w-12 rounded-pill skeleton" />
            </div>
            {/* Teams + steppers */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-sm skeleton" />
                <div className="h-3 w-12 rounded-pill skeleton" />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-9 rounded skeleton" />
                  <div className="w-14 h-14 rounded skeleton" />
                  <div className="w-10 h-9 rounded skeleton" />
                </div>
                <div className="w-4 h-14 flex items-center">
                  <div className="w-2 h-2 rounded-full skeleton mx-auto" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-9 rounded skeleton" />
                  <div className="w-14 h-14 rounded skeleton" />
                  <div className="w-10 h-9 rounded skeleton" />
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-sm skeleton" />
                <div className="h-3 w-12 rounded-pill skeleton" />
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between mt-4">
              <div className="h-3 w-28 rounded-pill skeleton" />
              <div className="h-9 w-24 rounded-btn skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
