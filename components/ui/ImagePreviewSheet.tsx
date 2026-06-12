'use client'

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share2 } from 'lucide-react'

type Props = {
  dataUrl:  string | null
  filename: string
  onClose:  () => void
}

export function ImagePreviewSheet({ dataUrl, filename, onClose }: Props) {
  const handleDownload = useCallback(() => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    a.click()
  }, [dataUrl, filename])

  const handleShare = useCallback(async () => {
    if (!dataUrl) return
    try {
      const res  = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], filename, { type: 'image/png' })
      await navigator.share({ files: [file], title: 'OusaBolão' })
    } catch {
      handleDownload()
    }
  }, [dataUrl, filename, handleDownload])

  const canShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'

  return (
    <AnimatePresence>
      {dataUrl && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet — mobile: full-width bottom; desktop: centred with max-width */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className={[
              'fixed bottom-0 inset-x-0 z-50',
              'bg-card rounded-t-[24px]',
              'flex flex-col',
              'max-h-[92dvh]',
              'lg:left-1/2 lg:right-auto lg:bottom-8',
              'lg:-translate-x-1/2 lg:w-[500px]',
              'lg:rounded-[24px]',
              'lg:max-h-[88dvh]',
              'shadow-[0_-4px_40px_rgba(20,18,25,.18)]',
            ].join(' ')}
          >
            {/* Handle + close */}
            <div className="flex-shrink-0">
              <div className="flex justify-center pt-3 pb-1 lg:hidden">
                <div className="w-10 h-1 rounded-full bg-hairline" />
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-semibold text-ink">Pré-visualização</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-card-sunken active:scale-90 transition-all text-ink-soft"
                  aria-label="Fechar"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
              <div className="h-px bg-hairline mx-5" />
            </div>

            {/* Image preview — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dataUrl}
                alt="Pré-visualização"
                className="w-full rounded-xl border border-hairline"
                draggable={false}
              />
            </div>

            {/* Actions */}
            <div
              className="flex gap-3 px-4 pt-3 pb-4 flex-shrink-0 border-t border-hairline"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
              {canShare && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 h-12 flex items-center justify-center gap-2 rounded-btn bg-ink text-card text-sm font-semibold hover:opacity-90 active:scale-[.98] transition-all"
                >
                  <Share2 size={16} strokeWidth={2} />
                  Compartilhar
                </button>
              )}
              <button
                type="button"
                onClick={handleDownload}
                className={[
                  'h-12 flex items-center justify-center gap-2 rounded-btn text-sm font-semibold transition-all active:scale-[.98]',
                  canShare
                    ? 'px-5 border border-hairline bg-card text-ink hover:bg-card-sunken'
                    : 'flex-1 bg-ink text-card hover:opacity-90',
                ].join(' ')}
              >
                <Download size={16} strokeWidth={2} />
                Baixar PNG
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
