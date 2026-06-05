import { AdminShellLayout } from './AdminShellLayout'

type Props = {
  children: React.ReactNode
  currentPhase: string | null
}

export function AdminShell({ children, currentPhase }: Props) {
  return (
    <AdminShellLayout currentPhase={currentPhase}>
      {children}
    </AdminShellLayout>
  )
}
