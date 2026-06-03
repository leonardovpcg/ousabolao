import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Fraunces } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OusaBolão',
  description: 'O bolão dos parças — Copa do Mundo 2026',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F6F5F1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={[
        geistSans.variable,
        geistMono.variable,
        fraunces.variable,
        'h-full antialiased',
      ].join(' ')}
    >
      <body className="h-full bg-paper text-ink">{children}</body>
    </html>
  )
}
