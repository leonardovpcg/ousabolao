export default function AdminLoading() {
  return (
    <div>
      {/* Page title */}
      <div className="mb-6">
        <div className="h-8 w-44 rounded-[10px] skeleton" />
        <div className="h-3.5 w-60 rounded skeleton mt-2.5" />
      </div>

      {/* Content cards fading out */}
      <div className="flex flex-col gap-3">
        {[1, 0.75, 0.5, 0.25].map((opacity, i) => (
          <div
            key={i}
            style={{ opacity }}
            className="rounded-card skeleton h-[72px]"
          />
        ))}
      </div>
    </div>
  )
}
