'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { House, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function AdminMobileActions() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex items-center gap-0.5">
      <Link
        href="/inicio"
        aria-label="Voltar ao app"
        className="p-2 -mr-0.5 rounded-[10px] text-ink-soft hover:text-ink hover:bg-hairline transition-colors"
      >
        <House size={18} strokeWidth={1.5} />
      </Link>
      <button
        onClick={handleLogout}
        aria-label="Sair"
        className="p-2 rounded-[10px] text-ink-faint hover:text-loss hover:bg-loss/6 transition-colors"
      >
        <LogOut size={18} strokeWidth={1.5} />
      </button>
    </div>
  )
}
