'use client'

import { useState, useEffect, useRef, useActionState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, BookOpen, LogOut, ShieldCheck, ChevronRight,
  CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react'
import { updateName, updateAvatarUrl } from '../actions'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '../page'

// ── Avatar with photo support ─────────────────────────────────

function AvatarDisplay({
  name, imageUrl, size,
}: { name: string; imageUrl: string | null; size: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('')

  const hue = ((name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 80) + 10

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className="rounded-full object-cover flex-shrink-0 border-2 border-hairline"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold select-none flex-shrink-0 border-2 border-hairline font-sans"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundColor: `hsl(${hue}, 55%, 72%)`,
        color: `hsl(${hue}, 55%, 22%)`,
      }}
    >
      {initials || '?'}
    </div>
  )
}

// ── Payment badge ─────────────────────────────────────────────

function PaymentBadge({ status }: { status: string }) {
  const isPaid = status === 'paid'
  return (
    <span className={[
      'inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-pill px-3 py-1 border',
      isPaid
        ? 'bg-win/8 text-win border-win/20'
        : 'bg-brand/8 text-brand-deep border-brand/20',
    ].join(' ')}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPaid ? 'bg-win' : 'bg-brand'}`} />
      {isPaid ? 'Inscrição paga' : 'Pagamento pendente'}
    </span>
  )
}

// ── Shared styles ─────────────────────────────────────────────

const inputCls = [
  'w-full rounded-input border border-hairline bg-card-sunken',
  'px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card transition-all',
].join(' ')

const labelCls = 'block text-xs font-semibold uppercase tracking-widest text-ink-faint mb-1.5'

// ── Main ──────────────────────────────────────────────────────

type Props = { profile: Profile; isAdmin: boolean }

export function PerfilClient({ profile, isAdmin }: Props) {
  const router = useRouter()

  // ── Name edit ───────────────────────────────────────────────
  const [nameInput, setNameInput] = useState(profile.name ?? '')
  const [nameState, nameAction, namePending] = useActionState(updateName, null)
  const [showNameSuccess, setShowNameSuccess] = useState(false)
  const nameDirty = nameInput.trim() !== (profile.name ?? '').trim()

  useEffect(() => {
    if (nameState && 'ok' in nameState) {
      setShowNameSuccess(true)
      router.refresh()
      const t = setTimeout(() => setShowNameSuccess(false), 3000)
      return () => clearTimeout(t)
    }
  }, [nameState, router])

  // ── Avatar upload ───────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (!file.type.startsWith('image/')) {
      setUploadError('Apenas imagens são aceitas.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Imagem muito grande — máximo 2 MB.')
      return
    }

    setUploadLoading(true)

    const supabase = createClient()
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
    const path = `${profile.id}/${Date.now()}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (storageError) {
      setUploadError(`Erro no upload: ${storageError.message}`)
      setUploadLoading(false)
      e.target.value = ''
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

    const result = await updateAvatarUrl(publicUrl)
    setUploadLoading(false)
    e.target.value = ''

    if (result && 'error' in result) {
      setUploadError(result.error)
    } else {
      setAvatarUrl(publicUrl)
      router.refresh()
    }
  }, [profile.id, router])

  // ── Logout ──────────────────────────────────────────────────
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  const displayName = profile.name || 'Jogador'

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 pb-4">

      {/* ── Identity card ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="rounded-card bg-card border border-hairline card-shadow-sm overflow-hidden"
      >
        {/* Avatar + info row */}
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-center lg:text-left gap-5 px-6 py-8 lg:py-7">

          {/* Clickable avatar */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
              className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              aria-label="Alterar foto de perfil"
            >
              <AvatarDisplay name={displayName} imageUrl={avatarUrl} size={88} />

              {/* Hover / loading overlay */}
              <div className="absolute inset-0 rounded-full bg-ink/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 flex items-center justify-center transition-opacity">
                {uploadLoading
                  ? <Loader2 size={24} strokeWidth={1.5} className="text-card animate-spin" />
                  : <Camera size={24} strokeWidth={1.5} className="text-card" />
                }
              </div>
            </button>

            {/* Camera badge */}
            <div
              aria-hidden
              className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-brand border-[2.5px] border-card flex items-center justify-center pointer-events-none"
            >
              <Camera size={12} strokeWidth={2} className="text-card" />
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Name / email / badge */}
          <div className="flex flex-col items-center lg:items-start gap-2 min-w-0">
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight leading-tight break-words">
              {displayName}
            </h1>
            <p className="text-sm text-ink-faint truncate max-w-full">
              {profile.email ?? '—'}
            </p>
            <PaymentBadge status={profile.payment_status} />
          </div>
        </div>

        {/* Upload error strip */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-hairline px-5 py-3 flex items-center gap-2 text-sm text-loss bg-loss/4"
            >
              <AlertCircle size={14} strokeWidth={2} className="flex-shrink-0" />
              {uploadError}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Edit profile card ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.05 }}
        className="rounded-card bg-card border border-hairline card-shadow-sm p-5"
      >
        <p className={labelCls + ' mb-4'}>Editar perfil</p>

        <form action={nameAction} className="flex flex-col gap-4">

          {/* Server error */}
          {nameState && 'error' in nameState && (
            <div className="flex items-center gap-2 rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss">
              <AlertCircle size={13} strokeWidth={2} className="flex-shrink-0" />
              {nameState.error}
            </div>
          )}

          {/* Success flash */}
          <AnimatePresence>
            {showNameSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-input border border-win/25 bg-win/6 px-4 py-2.5 text-sm text-win"
              >
                <CheckCircle2 size={14} strokeWidth={2} className="flex-shrink-0" />
                Nome atualizado com sucesso.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Name field */}
          <div>
            <label htmlFor="name" className={labelCls}>Nome</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Seu nome"
              className={inputCls}
            />
          </div>

          {/* Email field — read-only */}
          <div>
            <label className={labelCls}>E-mail</label>
            <input
              type="email"
              value={profile.email ?? ''}
              readOnly
              tabIndex={-1}
              className={inputCls + ' opacity-55 cursor-not-allowed'}
            />
            <p className="text-xs text-ink-faint mt-1.5">
              Definido pelo login — não pode ser alterado aqui.
            </p>
          </div>

          {/* Save button — appears when dirty */}
          <AnimatePresence>
            {nameDirty && (
              <motion.button
                key="save-name"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                type="submit"
                disabled={namePending}
                className="flex items-center justify-center gap-2 rounded-btn bg-ink py-2.5 text-sm font-semibold text-card hover:bg-ink/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {namePending && <Loader2 size={13} className="animate-spin" />}
                Salvar nome
              </motion.button>
            )}
          </AnimatePresence>
        </form>
      </motion.div>

      {/* ── Admin block — mobile only, conditional ─────────── */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.10 }}
        >
          <Link
            href="/admin"
            className="lg:hidden flex items-center justify-between rounded-card px-5 py-4 group active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(135deg, #C8881E 0%, #B07318 100%)',
              boxShadow: '0 2px 20px rgba(200,136,30,.30)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-white/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={20} strokeWidth={1.75} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">
                  Painel do Admin
                </p>
                <p className="text-[11px] text-white/70 mt-0.5">
                  Jogos, resultados, participantes
                </p>
              </div>
            </div>
            <ChevronRight
              size={18}
              strokeWidth={1.5}
              className="text-white/60 group-hover:text-white transition-colors flex-shrink-0"
            />
          </Link>
        </motion.div>
      )}

      {/* ── Actions card ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28, delay: isAdmin ? 0.15 : 0.10 }}
        className="rounded-card bg-card border border-hairline card-shadow-sm overflow-hidden"
      >
        {/* Regulamento */}
        <Link
          href="/regras"
          className="flex items-center gap-3 px-5 py-4 hover:bg-hairline/50 active:bg-hairline transition-colors border-b border-hairline"
        >
          <BookOpen size={17} strokeWidth={1.5} className="text-ink-faint flex-shrink-0" />
          <span className="flex-1 text-sm text-ink">Regulamento</span>
          <ChevronRight size={15} strokeWidth={1.5} className="text-ink-faint flex-shrink-0" />
        </Link>

        {/* Sair */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-loss/5 active:bg-loss/8 transition-colors text-left disabled:opacity-60"
        >
          {loggingOut
            ? <Loader2 size={17} strokeWidth={1.5} className="text-ink-faint flex-shrink-0 animate-spin" />
            : <LogOut size={17} strokeWidth={1.5} className="text-ink-faint flex-shrink-0" />
          }
          <span className="text-sm text-ink-soft">Sair</span>
        </button>
      </motion.div>

    </div>
  )
}
