import Image from 'next/image'
import logo from '../logo.png'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-14 bg-paper">

      {/* ── Brand header ─────────────────────────────── */}
      <div className="mb-8 flex flex-col items-center text-center">

        {/* Logo mark */}
        <div
          className="mb-5 rounded-[18px] overflow-hidden"
          style={{
            boxShadow:
              '0 1px 2px rgba(20,18,25,.06), 0 8px 24px rgba(20,18,25,.08), 0 0 0 1px rgba(200,136,30,.18)',
          }}
        >
          <Image
            src={logo}
            alt="OusaBolão"
            width={88}
            height={88}
            priority
          />
        </div>

        {/* Wordmark */}
        <h1 className="font-display text-[2.25rem] font-bold text-ink tracking-tight leading-none">
          Ousa<span className="text-brand">Bolão</span>
        </h1>

        {/* Slogan */}
        <p className="text-ink-soft text-[0.9375rem] font-medium mt-2">
          O Bolão dos Parças
        </p>

        {/* Edition — decorative hairlines */}
        <div className="flex items-center gap-3 mt-4">
          <div className="h-px w-6 bg-hairline" />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-faint">
            Edição Copa do Mundo 2026
          </p>
          <div className="h-px w-6 bg-hairline" />
        </div>
      </div>

      {/* ── Form card ────────────────────────────────── */}
      <div
        className="w-full max-w-sm rounded-card bg-card card-shadow p-8"
        style={{
          border: '1px solid rgba(200,136,30,.16)',
        }}
      >
        {children}
      </div>

      {/* Bottom breathing room */}
      <div className="h-8" />
    </div>
  )
}
