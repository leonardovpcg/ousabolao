export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-paper">
      {/* Brand wordmark */}
      <div className="mb-8 text-center">
        <p className="font-display text-3xl font-semibold text-ink tracking-tight leading-none">
          Ousa<span className="text-brand">Bolão</span>
        </p>
        <p className="text-ink-faint text-sm mt-2 font-sans">Copa do Mundo 2026</p>
      </div>

      {/* Form card */}
      <div
        className="w-full max-w-sm rounded-card bg-card border border-hairline card-shadow p-8"
      >
        {children}
      </div>
    </div>
  )
}
