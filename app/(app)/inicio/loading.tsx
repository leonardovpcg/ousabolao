export default function InicioLoading() {
  return (
    <div className="animate-pulse">
      {/* Greeting */}
      <div className="mb-6">
        <div className="h-3.5 w-16 rounded-pill bg-hairline mb-1.5" />
        <div className="h-8 w-36 rounded-card bg-hairline" />
      </div>

      {/* Timer skeleton */}
      <div className="rounded-card bg-card border border-hairline card-shadow p-6 lg:p-8">
        {/* Top row */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-3 w-36 rounded-pill bg-hairline" />
          <div className="h-3 w-24 rounded-pill bg-hairline hidden sm:block" />
        </div>
        {/* Blocks */}
        <div className="flex items-center gap-2 justify-center mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1 max-w-[80px]">
              <div className="w-full aspect-square rounded-xl bg-card-sunken" />
              <div className="h-2 w-8 rounded-pill bg-hairline" />
            </div>
          ))}
        </div>
        {/* Window label */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-4 w-48 rounded-pill bg-hairline" />
        </div>
      </div>

      {/* Prize + metrics */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr]">
        {/* Prize */}
        <div className="rounded-card bg-card border border-hairline card-shadow-sm p-5 lg:p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="h-2.5 w-28 rounded-pill bg-hairline" />
            <div className="w-8 h-8 rounded-full bg-hairline" />
          </div>
          <div>
            <div className="h-10 w-32 rounded-card bg-hairline mb-2" />
            <div className="h-2.5 w-40 rounded-pill bg-hairline" />
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-card bg-card border border-hairline card-shadow-sm p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-14 rounded-pill bg-hairline" />
                <div className="w-3.5 h-3.5 rounded bg-hairline" />
              </div>
              <div className="h-8 w-12 rounded-card bg-hairline" />
              <div className="h-2.5 w-20 rounded-pill bg-hairline" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
