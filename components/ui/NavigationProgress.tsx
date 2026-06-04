'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

// ── Context ───────────────────────────────────────────────────────

type Ctx = { startNavigation: () => void }
const NavCtx = createContext<Ctx>({ startNavigation: () => {} })
export const useNavigation = () => useContext(NavCtx)

// ── Progress bar ──────────────────────────────────────────────────

function ProgressBar({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (active) {
      setVisible(true)
    } else if (visible) {
      // Small delay so the "complete" animation shows before disappearing
      const t = setTimeout(() => setVisible(false), 500)
      return () => clearTimeout(t)
    }
  }, [active, visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[200] h-[2px] pointer-events-none"
          style={{
            background: 'var(--color-brand)',
            boxShadow: '0 0 10px rgba(200,136,30,.5)',
          }}
          // Active: grow slowly to ~82% (fake progress feel)
          // Complete: snap to 100% then fade out
          initial={{ scaleX: 0, transformOrigin: 'left' }}
          animate={
            active
              ? { scaleX: 0.82, transition: { duration: 2.5, ease: [0.1, 0.05, 0, 1] } }
              : { scaleX: 1,    transition: { duration: 0.18, ease: 'easeIn' } }
          }
          exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.05 } }}
        />
      )}
    </AnimatePresence>
  )
}

// ── Provider ──────────────────────────────────────────────────────

export function NavigationProgress({ children }: { children: React.ReactNode }) {
  const [navigating, setNavigating] = useState(false)
  const pathname = usePathname()

  // Pathname changed = navigation finished
  useEffect(() => {
    setNavigating(false)
  }, [pathname])

  return (
    <NavCtx.Provider value={{ startNavigation: () => setNavigating(true) }}>
      <ProgressBar active={navigating} />
      {children}
    </NavCtx.Provider>
  )
}
