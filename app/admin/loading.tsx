export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* Page title skeleton */}
      <div className="mb-6">
        <div className="h-8 w-44 rounded-[10px] bg-hairline" />
        <div className="h-3.5 w-60 rounded bg-hairline mt-2.5" />
      </div>

      {/* Content skeletons — 4 cards fading out */}
      <div className="flex flex-col gap-3">
        {[1, 0.7, 0.45, 0.2].map((opacity, i) => (
          <div
            key={i}
            style={{ opacity }}
            className="rounded-card bg-hairline h-[72px]"
          />
        ))}
      </div>
    </div>
  )
}
