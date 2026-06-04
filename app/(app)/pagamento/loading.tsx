export default function PagamentoLoading() {
  return (
    <div className="max-w-[560px] mx-auto">

      {/* Back link */}
      <div className="h-5 w-16 rounded-pill skeleton mb-8" />

      {/* Header */}
      <div className="flex items-start gap-4 mb-8 pb-8 border-b border-hairline">
        <div className="w-11 h-11 rounded-[12px] skeleton flex-shrink-0" />
        <div>
          <div className="h-8 w-40 rounded-card skeleton" />
          <div className="h-3.5 w-56 rounded-pill skeleton mt-2.5" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Status card */}
        <div className="rounded-card border border-hairline p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-4 w-36 rounded-pill skeleton" />
            <div className="h-3 w-56 rounded-pill skeleton" />
          </div>
        </div>

        {/* Quota card */}
        <div className="rounded-card bg-card border border-hairline card-shadow-sm p-5 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-2.5 w-28 rounded-pill skeleton" />
            <div className="h-10 w-24 rounded-card skeleton" />
          </div>
          <div className="w-10 h-10 rounded-full skeleton" />
        </div>

        {/* Instructions card */}
        <div className="rounded-card bg-card border border-hairline card-shadow-sm p-5">
          <div className="h-2.5 w-20 rounded-pill skeleton mb-4" />
          <div className="rounded-xl border border-hairline p-3 flex flex-col gap-2 mb-3">
            <div className="h-4 w-full rounded-pill skeleton" />
            <div className="h-4 w-3/4 rounded-pill skeleton" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="h-3 w-48 rounded-pill skeleton" />
            <div className="h-8 w-28 rounded-lg skeleton" />
          </div>
        </div>
      </div>
    </div>
  )
}
