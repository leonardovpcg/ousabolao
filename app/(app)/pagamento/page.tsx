import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, QrCode, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CopyButton } from './_components/CopyButton'

export default async function PagamentoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('payment_status').eq('id', user.id).single(),
    supabase.from('pool_settings').select('quota_value, payment_instructions').maybeSingle(),
  ])

  const isPaid = profile?.payment_status === 'paid'
  const quotaValue = settings?.quota_value ?? 100
  const instructions = settings?.payment_instructions?.trim() ?? null

  const quotaFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(quotaValue)

  return (
    <div className="max-w-[560px] mx-auto">

      {/* Back */}
      <Link
        href="/perfil"
        className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink transition-colors mb-8 -ml-0.5"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
        Perfil
      </Link>

      {/* Page header */}
      <div className="flex items-start gap-4 mb-8 pb-8 border-b border-hairline">
        <div className="w-11 h-11 rounded-[12px] bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <QrCode size={19} strokeWidth={1.5} className="text-brand" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-none">
            Pagamento
          </h1>
          <p className="text-ink-faint text-sm mt-2 leading-snug">
            Informações de inscrição · OusaBolão 2026
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">

        {/* ── Status da inscrição ───────────────────────── */}
        <div
          className="rounded-card border p-5 flex items-center gap-4"
          style={
            isPaid
              ? { background: 'rgba(30,122,77,.05)', borderColor: 'rgba(30,122,77,.22)' }
              : { background: 'rgba(200,136,30,.05)', borderColor: 'rgba(200,136,30,.22)' }
          }
        >
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
            style={
              isPaid
                ? { background: 'rgba(30,122,77,.12)' }
                : { background: 'rgba(200,136,30,.14)' }
            }
          >
            {isPaid ? (
              <CheckCircle2 size={20} strokeWidth={1.75} className="text-win" />
            ) : (
              <Clock size={20} strokeWidth={1.75} className="text-brand" />
            )}
          </div>
          <div>
            <p
              className="text-sm font-bold leading-none mb-0.5"
              style={{ color: isPaid ? '#1E7A4D' : '#9A6614' }}
            >
              {isPaid ? 'Inscrição confirmada' : 'Aguardando pagamento'}
            </p>
            <p className="text-xs text-ink-soft leading-snug">
              {isPaid
                ? 'Seu pagamento foi confirmado. Bons palpites!'
                : 'Efetue o pagamento abaixo e aguarde a confirmação do admin.'}
            </p>
          </div>
        </div>

        {/* ── Valor da inscrição ────────────────────────── */}
        <div className="rounded-card bg-card border border-hairline card-shadow-sm p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-1.5">
              Valor da inscrição
            </p>
            <p className="font-display text-4xl font-bold text-ink nums leading-none">
              {quotaFormatted}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(200,136,30,.10)' }}
          >
            <QrCode size={17} strokeWidth={1.5} className="text-brand" />
          </div>
        </div>

        {/* ── Instruções / chave PIX ───────────────────── */}
        <div className="rounded-card bg-card border border-hairline card-shadow-sm p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-4">
            Como pagar
          </p>

          {instructions ? (
            <div className="flex flex-col gap-3">
              {/* Chave / instruções */}
              <div className="rounded-xl bg-card-sunken border border-hairline px-4 py-3">
                <p className="text-sm text-ink leading-relaxed whitespace-pre-line break-all">
                  {instructions}
                </p>
              </div>

              {/* Copy button */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-ink-faint leading-snug">
                  Copie a chave e faça o pagamento via PIX no valor acima.
                </p>
                <CopyButton text={instructions} />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 py-2">
              <AlertCircle size={15} strokeWidth={1.75} className="text-ink-faint flex-shrink-0 mt-px" />
              <p className="text-sm text-ink-soft">
                As instruções de pagamento ainda não foram configuradas. Entre em contato com o admin.
              </p>
            </div>
          )}
        </div>

        {/* ── Nota de rodapé ───────────────────────────── */}
        {!isPaid && (
          <p className="text-xs text-ink-faint text-center px-2 leading-relaxed">
            Após o pagamento, o admin confirma sua inscrição manualmente e seus palpites são liberados.
          </p>
        )}

      </div>

      <div className="h-8" />
    </div>
  )
}
