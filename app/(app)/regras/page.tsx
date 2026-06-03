import Link from 'next/link'
import { ChevronLeft, BookOpen, FileWarning } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function RegrasPage() {
  const supabase = await createClient()

  const { data: rules, error } = await supabase
    .from('rules')
    .select('id, display_order, title, content')
    .order('display_order', { ascending: true })

  return (
    // Reading column — narrower than shell max-w for comfortable line length
    <div className="max-w-[660px] mx-auto">

      {/* Back */}
      <Link
        href="/perfil"
        className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink transition-colors mb-8 -ml-0.5"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
        Perfil
      </Link>

      {/* Page header */}
      <div className="flex items-start gap-4 mb-10 pb-8 border-b border-hairline">
        <div className="w-11 h-11 rounded-[12px] bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <BookOpen size={19} strokeWidth={1.5} className="text-brand" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-none">
            Regulamento
          </h1>
          <p className="text-ink-faint text-sm mt-2 leading-snug">
            Regulamento oficial · OusaBolão · Copa do Mundo 2026
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-card bg-card border border-hairline card-shadow-sm p-5 flex items-start gap-3">
          <FileWarning size={18} strokeWidth={1.5} className="text-loss flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink">Erro ao carregar regulamento</p>
            <p className="text-sm text-ink-soft mt-0.5">{error.message}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!error && (!rules || rules.length === 0) && (
        <div className="py-16 text-center">
          <BookOpen size={32} strokeWidth={1.25} className="text-ink-faint/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink">Nenhum artigo publicado ainda.</p>
          <p className="text-xs text-ink-faint mt-1">O regulamento será adicionado em breve.</p>
        </div>
      )}

      {/* Articles */}
      {!error && rules && rules.length > 0 && (
        <div>
          {rules.map((rule, idx) => (
            <article
              key={rule.id}
              className={[
                'py-8',
                idx < rules.length - 1 ? 'border-b border-hairline' : '',
              ].join(' ')}
            >
              {/* Art. number — small brand label */}
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand mb-2.5">
                Art. {rule.display_order}º
              </p>

              {/* Article title in serifada de display */}
              <h2 className="font-display text-[1.125rem] font-bold text-ink leading-snug mb-3.5">
                {rule.title}
              </h2>

              {/* Content — whitespace-pre-line preserves intentional line breaks */}
              <p className="text-[0.9375rem] text-ink-soft leading-[1.75] whitespace-pre-line">
                {rule.content}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* Bottom spacer — clears mobile bottom nav */}
      <div className="h-8" />
    </div>
  )
}
