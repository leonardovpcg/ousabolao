'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-ink/15 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Sheet on mobile, dialog on desktop */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className={[
              'fixed inset-x-0 bottom-0 z-50',
              'max-h-[90dvh] overflow-y-auto',
              'rounded-t-[20px] bg-card border border-hairline',
              'card-shadow px-5 pt-5 pb-[env(safe-area-inset-bottom,20px)]',
              // Desktop: centered dialog
              'lg:inset-x-auto lg:left-1/2 lg:bottom-auto lg:top-1/2',
              'lg:-translate-x-1/2 lg:-translate-y-1/2',
              'lg:w-full lg:max-w-md lg:rounded-card lg:max-h-[85vh]',
            ].join(' ')}
          >
            {/* Drag handle (mobile) */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-hairline lg:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-ink leading-tight">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="rounded-pill p-1.5 text-ink-faint hover:bg-hairline hover:text-ink transition-colors"
                aria-label="Fechar"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
