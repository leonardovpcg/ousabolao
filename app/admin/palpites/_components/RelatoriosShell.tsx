'use client'

import { useState } from 'react'
import { PalpitesClient } from './PalpitesClient'
import { ResultadosClient } from './ResultadosClient'
import { PerguntasClient } from './PerguntasClient'
import type { BetEntry, MatchForBets, ProfileRow, TiebreakerQuestion, TiebreakerResponse } from '../page'

type Tab = 'palpites' | 'resultados' | 'perguntas'

const TABS: { id: Tab; label: string; desc: string }[] = [
  { id: 'palpites',   label: 'Palpites',   desc: 'Todos os palpites por participante' },
  { id: 'resultados', label: 'Resultados', desc: 'Pontuação por jogos encerrados'     },
  { id: 'perguntas',  label: 'Perguntas',  desc: 'Critérios de desempate'              },
]

type Props = {
  bets: BetEntry[]
  matches: MatchForBets[]
  profiles: ProfileRow[]
  questions: TiebreakerQuestion[]
  responses: TiebreakerResponse[]
}

export function RelatoriosShell({ bets, matches, profiles, questions, responses }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('palpites')

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-tight">
          Relatórios
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          Palpites, resultados e critérios de desempate
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-end gap-0 mb-6 border-b border-hairline">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'relative px-4 py-2.5 text-sm font-medium transition-colors select-none',
              activeTab === tab.id
                ? 'text-ink'
                : 'text-ink-faint hover:text-ink-soft',
            ].join(' ')}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
            {activeTab === tab.id && (
              <span
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-brand"
                style={{ marginBottom: '-1px' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'palpites' && (
        <PalpitesClient bets={bets} matches={matches} profiles={profiles} />
      )}
      {activeTab === 'resultados' && (
        <ResultadosClient bets={bets} matches={matches} profiles={profiles} />
      )}
      {activeTab === 'perguntas' && (
        <PerguntasClient questions={questions} responses={responses} profiles={profiles} />
      )}
    </div>
  )
}
