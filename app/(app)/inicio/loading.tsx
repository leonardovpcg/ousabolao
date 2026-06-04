export default function InicioLoading() {
  return (
    <div>
      {/* Greeting — inline (matches new page layout) */}
      <div className="mb-6 flex items-baseline gap-2">
        <div className="h-5 w-20 rounded-pill skeleton" />
        <div className="h-8 w-28 rounded-card skeleton" />
      </div>

      {/* Timer skeleton */}
      <div
        className="rounded-card bg-card border card-shadow p-6 lg:p-8"
        style={{ borderColor: 'rgba(200,136,30,.22)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1.5 h-1.5 rounded-full skeleton" />
          <div className="h-3 w-36 rounded-pill skeleton" />
        </div>
        {/* Blocks */}
        <div className="flex items-center gap-2 justify-center mb-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1 max-w-[80px]">
              <div className="w-full aspect-square rounded-xl skeleton" />
              <div className="h-2 w-8 rounded-pill skeleton" />
            </div>
          ))}
        </div>
        {/* Bottom */}
        <div className="border-t border-hairline pt-4 flex flex-col items-center gap-2">
          <div className="h-5 w-44 rounded-pill skeleton" />
          <div className="h-3.5 w-64 rounded-pill skeleton" />
          <div className="h-3 w-28 rounded-pill skeleton" />
        </div>
      </div>

      {/* Prize + metrics */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr]">
        {/* Prize card */}
        <div className="rounded-card bg-card border border-hairline card-shadow-sm p-5 lg:p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="h-2.5 w-28 rounded-pill skeleton" />
            <div className="w-8 h-8 rounded-full skeleton" />
          </div>
          <div>
            <div className="h-10 w-32 rounded-card skeleton mb-2" />
            <div className="h-2.5 w-40 rounded-pill skeleton" />
          </div>
        </div>

        {/* 4 metric cards */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-card bg-card border border-hairline card-shadow-sm p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-14 rounded-pill skeleton" />
                <div className="w-3.5 h-3.5 rounded skeleton" />
              </div>
              <div className="h-8 w-12 rounded-card skeleton" />
              <div className="h-2.5 w-20 rounded-pill skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
