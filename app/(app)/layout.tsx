import { AppShell } from '@/components/ui/AppShell'
import { PageTransition } from '@/components/ui/PageTransition'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <PageTransition>{children}</PageTransition>
    </AppShell>
  )
}
