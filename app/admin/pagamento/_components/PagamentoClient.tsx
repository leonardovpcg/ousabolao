'use client'

import { useState, useEffect, useActionState } from 'react'
import { Loader2, CheckCircle2, CreditCard, QrCode, Info } from 'lucide-react'
import { updatePaymentSettings } from '../actions'
import type { PoolSettings } from '../page'

// ── Helpers ───────────────────────────────────────────────────

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// ── Preview ───────────────────────────────────────────────────

function PaymentPreview({
  quota,
  instructions,
}: {
  quota: number
  instructions: string
}) {
  const hasInstructions = instructions.trim().length > 0

  return (
    <div className="rounded-card bg-card-sunken border border-hairline px-5 py-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-4 flex items-center gap-2">
        <Info size={11} strokeWidth={2} />
        Prévia — como o jogador vê em /pagamento
      </p>

      {/* Quota */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-[10px] bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
          <CreditCard size={15} strokeWidth={1.5} className="text-brand" />
        </div>
        <div>
          <p className="text-xs text-ink-faint mb-0.5">Valor da inscrição</p>
          <p className="font-display text-xl font-bold text-ink nums">
            {quota > 0 ? formatBRL(quota) : <span className="text-ink-faint">—</span>}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-[10px] bg-card border border-hairline flex items-center justify-center flex-shrink-0">
          <QrCode size={15} strokeWidth={1.5} className="text-ink-faint" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-ink-faint mb-1">Chave PIX / Instruções</p>
          {hasInstructions ? (
            <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed break-words">
              {instructions}
            </p>
          ) : (
            <p className="text-sm text-ink-faint italic">
              Nenhuma instrução configurada.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

type Props = { settings: PoolSettings }

const inputCls = [
  'w-full rounded-input border border-hairline bg-card-sunken',
  'px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-card transition-all',
].join(' ')
const labelCls = 'block text-xs font-semibold uppercase tracking-widest text-ink-faint mb-1.5'

export function PagamentoClient({ settings }: Props) {
  const [state, formAction, pending] = useActionState(updatePaymentSettings, null)

  // Live preview state — mirrors form inputs
  const [previewQuota, setPreviewQuota] = useState(settings.quota_value)
  const [previewInstructions, setPreviewInstructions] = useState(
    settings.payment_instructions ?? ''
  )

  // Success flash
  const [showSuccess, setShowSuccess] = useState(false)
  useEffect(() => {
    if (state && 'ok' in state) {
      setShowSuccess(true)
      const t = setTimeout(() => setShowSuccess(false), 3000)
      return () => clearTimeout(t)
    }
  }, [state])

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
          Pagamento
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          Quota e instruções de pagamento exibidas aos jogadores
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Form ─────────────────────────────────────────── */}
        <div className="rounded-card bg-card border border-hairline card-shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-5">
            Configurações
          </p>

          <form action={formAction} className="flex flex-col gap-5">
            <input type="hidden" name="id" value={settings.id} />

            {/* Error */}
            {state && 'error' in state && (
              <div className="rounded-input border border-loss/25 bg-loss/6 px-4 py-3 text-sm text-loss">
                {state.error}
              </div>
            )}

            {/* Success */}
            {showSuccess && (
              <div className="flex items-center gap-2 rounded-input border border-win/25 bg-win/6 px-4 py-2.5 text-sm text-win">
                <CheckCircle2 size={14} strokeWidth={2} />
                Configurações salvas com sucesso.
              </div>
            )}

            {/* Quota */}
            <div>
              <label htmlFor="quota" className={labelCls}>
                Valor da inscrição (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-soft pointer-events-none">
                  R$
                </span>
                <input
                  id="quota"
                  name="quota_value"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={settings.quota_value}
                  onChange={e => setPreviewQuota(Number(e.target.value) || 0)}
                  className={inputCls + ' pl-9 nums'}
                />
              </div>
              <p className="text-xs text-ink-faint mt-1.5">
                Atualmente R$ {settings.quota_value.toFixed(2).replace('.', ',')}
              </p>
            </div>

            {/* Instructions */}
            <div>
              <label htmlFor="instructions" className={labelCls}>
                Chave PIX e instruções
              </label>
              <textarea
                id="instructions"
                name="payment_instructions"
                rows={5}
                defaultValue={settings.payment_instructions ?? ''}
                onChange={e => setPreviewInstructions(e.target.value)}
                placeholder={'Exemplo:\nChave PIX: 99999-9999\nNome: João Silva\nEnvie o comprovante por WhatsApp após o pagamento.'}
                className={inputCls + ' resize-none leading-relaxed'}
              />
              <p className="text-xs text-ink-faint mt-1.5">
                Texto livre — cole a chave PIX, instruções e qualquer detalhe relevante.
              </p>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="flex items-center justify-center gap-2 rounded-btn bg-ink py-2.5 text-sm font-semibold text-card hover:bg-ink/90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {pending && <Loader2 size={14} className="animate-spin" />}
              Salvar configurações
            </button>
          </form>
        </div>

        {/* ── Live preview ──────────────────────────────────── */}
        <div>
          <PaymentPreview quota={previewQuota} instructions={previewInstructions} />
          <p className="text-xs text-ink-faint text-center mt-2.5">
            Preview atualiza enquanto você digita
          </p>
        </div>
      </div>
    </div>
  )
}
