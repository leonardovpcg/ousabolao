import { AdminSidebar } from './AdminSidebar'

type Props = {
  children: React.ReactNode
  currentPhase: string | null
}

export function AdminShell({ children, currentPhase }: Props) {
  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar currentPhase={currentPhase} />

      {/*
        pt-14  = clears the 56px fixed mobile header
        lg:pt-0 lg:pl-64 = desktop: sidebar takes the left space
        min-w-0 = prevent flex overflow (fixes narrow-column text wrapping)
      */}
      <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0 lg:pl-64">
        <main className="flex-1 min-w-0">
          <div className="w-full min-w-0 max-w-[960px] mx-auto px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
