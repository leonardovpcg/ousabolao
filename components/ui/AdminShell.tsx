import { AdminSidebar } from './AdminSidebar'

type Props = {
  children: React.ReactNode
  currentPhase: string | null
}

export function AdminShell({ children, currentPhase }: Props) {
  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar currentPhase={currentPhase} />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[960px] px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
