# CLAUDE.md — OusaBolão · O Bolão dos Parças

> Fonte da verdade do projeto. Leia este arquivo inteiro antes de gerar ou alterar código.
> Em caso de conflito entre uma instrução pontual no chat e este documento, **pergunte** antes de quebrar um padrão definido aqui.

---

## 1. O que é o OusaBolão

App de bolão entre amigos para a **Copa do Mundo 2026**. Os participantes ("os parças") dão palpites nos placares dos jogos, ganham pontos conforme a precisão do palpite e disputam um ranking ao longo do torneio.

**Princípio inegociável:** é uma experiência **mobile-first de primeira classe**. Não pode parecer "app de IA barato". Cada tela precisa ter intenção de design, contraste correto e fluidez. Quando houver dúvida entre "fácil de codar" e "bom de usar no celular", escolha o segundo.

**Público:** grupo fechado de amigos. Volume baixo (dezenas de usuários, não milhares). Otimize para clareza e prazer de uso, não para escala massiva.

---

## 2. Stack

- **Framework:** Next.js (App Router) + React + TypeScript (strict)
- **Estilo:** Tailwind CSS + shadcn/ui (componentes customizados, **nunca** shadcn default cru)
- **Backend / DB:** Supabase (Postgres + Auth + RLS + Storage)
- **Animações:** Framer Motion (com parcimônia — micro-interações, não firula)
- **Ícones:** lucide-react
- **Deploy:** Vercel (front) + Supabase (dados)
- **Gerenciador de pacotes:** pnpm (ajuste se preferir npm/yarn)

### Padrões de dados
- Prefira **Server Components** + **Server Actions** para leitura/escrita. Client Components só quando houver interatividade real (forms de palpite, toggles, animações).
- Use o cliente Supabase server-side (`@supabase/ssr`) com cookies. **Nunca** use a `service_role key` no client — ela só existe em código server-only / rotas admin protegidas.
- Toda leitura sensível passa por **RLS**. Não confie em filtro feito só no front.

---

## 3. Estrutura de pastas (alvo)

```
/app
  /(auth)/login                 # email + senha apenas
  /(app)
    /inicio
    /palpite
    /ranking
    /desempate
    /perfil
    /pagamento                  # quota + chave PIX (read-only p/ jogador)
    /regras                     # regulamento (conteúdo editável pelo admin)
    /admin                      # protegido por role=admin (dashboard)
      /fases                    # config de fases + deadlines de trava
      /jogos                    # seleções, partidas, resultados, backups
      /participantes            # marcar pago/pendente, ver/gerar PDF de palpites
      /desempate                # configurar perguntas + respostas oficiais
      /pagamento                # editar quota e chave PIX
      /regras                   # editar artigos do regulamento
    layout.tsx                  # bottom nav + theme provider (dark)
  /api                          # rotas server-only (ex.: geração de PDF)
/components
  /ui                           # primitivos (button, card, sheet...) customizados
  /features                     # componentes de domínio (MatchCard, GuessForm, RankRow...)
/lib
  /supabase                     # clients (server/client/admin)
  /scoring                      # regra de pontuação e desempate, isolada e testável
  /pdf                          # geração do PDF de palpites p/ WhatsApp
  /utils
/types                          # tipos gerados do Supabase + domínio
```

**Regra:** a lógica de pontuação fica **isolada em `/lib/scoring`**, pura e testável, sem acoplar com UI nem com Supabase.

---

## 4. Design System (tema DARK)

Tema padrão **dark**. (Light off-white pode entrar depois como toggle — projete tokens pensando nisso, mas entregue dark primeiro.)

### Tokens base (ajuste fino livre, mantenha a lógica)
```
--bg            #0A0B0D   /* fundo negro, NÃO preto puro #000 */
--surface       #131519   /* cards nível 1 */
--surface-2     #1C1F26   /* cards elevados / hover */
--border        #262A33   /* bordas sutis, 1px */
--text          #F2F4F7   /* texto primário (off-white, não branco puro) */
--text-muted    #8A909C   /* texto secundário */
--accent        #00E07A   /* verde vibrante — energia de app esportivo */
--accent-press  #00B864
--danger        #FF4D4D
--gold          #FFC34D   /* destaques de pódio/ranking */
```
> Cor de destaque (`--accent`) está como verde esportivo por padrão. Se você definir uma cor de marca, troca só aqui.

### Regras visuais
- **Contraste alto e proposital.** Card (`--surface`) sempre destacado do fundo (`--bg`) por elevação + borda sutil de 1px. Nada de cinza-sobre-cinza sem leitura.
- **Cantos:** radius generoso (16px nos cards, 12px nos botões). Nada pontiagudo.
- **Espaçamento:** respira. Padding interno de card ≥ 16px. Use escala 4/8/12/16/24/32.
- **Tipografia:** uma fonte com personalidade (ex.: *Geist*, *Inter Tight* ou *Sora*). Pesos: 600/700 em números e títulos (placares são protagonistas), 400/500 em corpo. Números de placar grandes e tabulares (`font-variant-numeric: tabular-nums`).
- **Profundidade:** sombras suaves e coloridas (glow discreto do accent em elementos ativos), nunca `box-shadow` cinza padrão de template.
- **Movimento:** transições de 150–250ms, `ease-out`. Animar entrada de cards (stagger leve), feedback de palpite enviado, mudança de posição no ranking. Sem nada que atrapalhe o uso.

### Mobile-first obrigatório
- **Bottom navigation** fixa com as seções principais. Ícone + label.
- Áreas de toque ≥ 44×44px. Respeite `safe-area-inset` (notch/home bar).
- Ações primárias na **zona do polegar** (parte de baixo).
- Inputs de palpite: teclado numérico (`inputMode="numeric"`), stepper +/- como alternativa ao digitar.
- Testar sempre em viewport ~390px antes de considerar pronto.

### ❌ Anti-padrões (o "cheiro de IA barata") — EVITAR
- Gradiente roxo/azul genérico de fundo.
- shadcn/Tailwind default sem customização nenhuma.
- Tudo centralizado, emojis no lugar de ícones, bordas grossas coloridas.
- Cards brancos no dark mode. Texto branco puro `#FFF` em fundo preto puro `#000` (cansa a vista).
- Sombras cinza padrão e espaçamento apertado.

---

## 5. Banco de dados (Supabase) — SCHEMA REAL

> ### 🚨 DOIS AMBIENTES — LEIA ANTES DE CODAR
> - **DEV (onde você constrói):** projeto Supabase **separado**, com a estrutura base copiada do original **+ as 5 migrations já aplicadas**. Ou seja, o dev tem o **schema-alvo completo**. **Construa contra ele normalmente** — pode usar `tournament_phases`, `tiebreaker_questions`, `tiebreaker_responses`, `rules` e a trava de prazo no banco. Os tipos em `types/database.ts` são gerados deste projeto.
> - **PRODUÇÃO (projeto original):** app antigo ainda rodando, schema **legado**, migrations **não aplicadas**. As 5 migrations só rodam aqui no dia da virada (cutover).
> - **Implicação:** desenvolva o app **inteiro** (incluindo CRUD de perguntas, edição de regras, ciclo de fases) contra o dev. No cutover: rodar as migrations no original, apontar o app para lá, validar a migração de dados.
> - Mesmo com a trava no banco (trigger), **mantenha também a validação de prazo na server action** — defesa em profundidade e melhor UX (mensagem clara antes de tentar gravar).

Schema reaproveitado do banco existente. **Os nomes são em inglês** → código e queries em inglês; UI em PT-BR.
Schema `public`. RLS habilitado em todas as tabelas.

### Tabelas

**`profiles`** — perfil do jogador (1:1 com `auth.users`)
`id` (uuid, = auth.users.id), `name` (text), `email` (text), `payment_status` (text, default `'pending'`), `avatar_url` (text), `created_at`, `updated_at`.

**`user_roles`** — papéis (fonte de verdade do admin)
`id` (uuid), `user_id` (uuid), `role` (enum **`app_role`**, default `'user'`), `created_at`.
→ Admin é definido AQUI, **não** em `profiles`. Verificação via funções SQL `is_admin()` e `has_role(uid, 'admin')`.

**`teams`** — clubes (legado; provavelmente não usado na Copa)
`id`, `name`, `country`, `emblem_url`, `created_at`.

**`national_teams`** — seleções (USAR ESTA para a Copa 2026)
`id`, `name`, `country`, `emblem_url`, `created_at`.

**`matches`** — partidas
`id`, `home_team_id`→teams, `away_team_id`→teams, `match_date` (timestamptz), `phase` (text), `match_group` (text), `round` (text), `home_score` (int, null até resultado), `away_score` (int, null), `status` (text, default `'scheduled'`), `category` (text, default `'club'`), `home_team_national_id`→national_teams, `away_team_national_id`→national_teams, `created_at`, `updated_at`.
→ ⚠️ Partida tem DOIS pares de times (clubes E seleções). **Para a Copa, usar `*_national_id` e `category='national'`.** Deixar explícito em toda query qual par está sendo lido.

**`bets`** — palpites
`id`, `user_id` (uuid), `match_id`→matches, `home_prediction` (int), `away_prediction` (int), `points` (int, default 0), `created_at`, `updated_at`.

**`bets_with_profiles`** — VIEW (não é tabela)
Junta `bets` + `profiles`: adiciona `user_name`, `user_email`, `payment_status`. **Usar esta view no dashboard admin** para listar palpites com nome e gerar o PDF.

**`ranking`** — classificação materializada
`id`, `user_id`, `total_points` (int), `exact_scores` (int), `correct_results` (int), `position` (int), `points` (numeric), `created_at`, `updated_at`.
→ ⚠️ Existem DOIS campos de pontos: `total_points` (int) e `points` (numeric). Resíduo do app antigo. **Definir `total_points` como fonte única e ignorar/remover `points`** (confirmar com Léo antes de dropar coluna).

**`pool_settings`** — configurações globais do bolão (1 linha)
`id`, `quota_value` (numeric, default 50 → **mudar para 100**), `payment_instructions` (text = **chave PIX / instruções**, editável pelo admin), `current_phase` (text, default `'group_stage'`), `phase_deadlines` (**jsonb** = horário de trava por fase), `created_at`, `updated_at`.
→ Esta tabela cobre: quota, PIX e deadlines de fase. Não criar tabelas novas pra isso.

**`tiebreaker_answers`** — ⚠️ LEGADO. Perguntas eram colunas fixas. **Substituída** pelas tabelas dinâmicas abaixo (mantida até validar a migração; não usar em código novo).

**`tiebreaker_questions`** — perguntas de desempate (admin faz CRUD)
`id`, `display_order` (int), `question` (text), `official_answer` (text, preenchida pelo admin no fim), `is_active` (bool), `created_at`, `updated_at`. **Respostas são texto livre.**

**`tiebreaker_responses`** — resposta do jogador por pergunta
`id`, `user_id`→auth.users, `question_id`→tiebreaker_questions, `answer` (text), `is_correct` (bool, calculado quando há `official_answer`), unique(`user_id`,`question_id`).

**`tournament_phases`** — ciclo de vida das fases (fonte da verdade de prazo)
`id`, `phase` (text único, chave canônica = `matches.phase`), `label` (PT-BR), `display_order`, `status` (`upcoming`|`open`|`locked`|`concluded`), `betting_locks_at` (timestamptz, horário que o admin trava), `created_at`, `updated_at`.
→ Fases canônicas: `group_stage`, `round_of_32`, `round_of_16`, `quarter_finals`, `semi_finals`, `third_place`, `final`. **`matches.phase` deve usar exatamente essas chaves.**

**`rules`** — regulamento editável pelo admin
`id`, `display_order`, `title`, `content`, `created_at`, `updated_at`. A página `/regras` lê daqui (nada hardcoded).

### Funções e trigger existentes (schema base)
- **`is_admin()`** → bool, checa se `auth.uid()` tem role admin. Usar nas policies e checagens server-side.
- **`has_role(uid, app_role)`** → bool, checa um papel específico. Enum `app_role` = `admin` | `moderator` | `user`.
- **`recalculate_complete_ranking()`** → recalcula a tabela `ranking` inteira a partir de `bets.points`. Chamar após lançar resultados.
- **`handle_new_user()`** + trigger `on_auth_user_created` em `auth.users` → no signup, cria automaticamente a linha em `profiles` E em `user_roles` (role default `user`). **A server action de signup NÃO precisa criar perfil manualmente** — o trigger já faz.

### Chaves estrangeiras confirmadas
- `bets.match_id` → `matches.id`
- `matches.home_team_id` / `away_team_id` → `teams.id`
- `matches.home_team_national_id` / `away_team_national_id` → `national_teams.id`
- ⚠️ **Não há FK** de `bets.user_id`, `ranking.user_id`, `tiebreaker_answers.user_id`, `user_roles.user_id` para `profiles`/`auth.users`. As relações existem por convenção, não por constraint. Não assumir integridade referencial garantida nesses joins; considerar adicionar as FKs.

### RLS — como está hoje (resumo)
- **Leitura geral:** `matches`, `teams`, `national_teams`, `pool_settings`, `ranking`, `profiles`, `bets`, `tiebreaker_answers` → visíveis para **qualquer usuário autenticado**.
- **Escrita do jogador:** `bets` e `tiebreaker_answers` → só as próprias (`auth.uid() = user_id`). `profiles` → só o próprio (`auth.uid() = id`).
- **Admin:** gerencia tudo (`is_admin()` / `has_role`) — matches, teams, national_teams, ranking, pool_settings, bets, tiebreaker_answers, profiles, user_roles.

### ✅ Furos de segurança do app antigo — CORRIGIDOS (migrations em `/migrations`)
1. **`national_teams` editável por qualquer autenticado** → corrigido na migration 04 (removidas as policies `*authenticated users only`; só admin gerencia).
2. **Deadline de palpite só no front** → corrigido na migration 05: trigger `enforce_bet_deadline` em `bets` que bloqueia insert/update quando a fase não está `open` ou `betting_locks_at` já passou (admin isento).
3. **Policies duplicadas de `matches`** → consolidadas na migration 04 em `is_admin()`.

### Regras de acesso alvo (o que o app novo deve garantir)
- Jogador: lê tudo o que é público; escreve só o próprio `bets`/`tiebreaker_answers`/`profile`, **e só dentro do prazo**.
- Transparência (Art. 7º): no banco os palpites já são legíveis por todos; **a UI esconde os palpites alheios até o início do jogo** (regra de apresentação, não de RLS).
- Admin: tudo, via `is_admin()`.

---

## 6. Lógica de domínio (REGRAS OFICIAIS — confirmadas)

### Pontuação (Art. 4º)
- **Placar exato:** 15 pts (acertou gols do mandante E do visitante)
- **Resultado correto:** 5 pts (acertou só quem venceu / empate, mas não o placar exato)
- **Errou o resultado:** 0 pts

> Ex.: palpite 2×1, jogo termina 2×1 → 15 pts. Palpite 2×1, termina 3×1 → 5 pts (acertou o vencedor). Palpite 2×1, termina 1×2 → 0 pts.

Implementar como função pura em `/lib/scoring/calcularPontos.ts`:
```ts
(palpite: {casa: number, fora: number}, oficial: {casa: number, fora: number}) => 15 | 5 | 0
// exato → 15
// mesmo sinal de (casa - fora) → 5   (cobre vitória mandante, visitante e empate)
// senão → 0
```
Cobrir com testes os casos de borda (empates, 0×0, vitórias por placares diferentes).

### Jogos de mata-mata (Art. 5º)
A pontuação considera **apenas os 90 minutos regulamentares**. Prorrogação e pênaltis são **desconsiderados** no cálculo. O placar oficial lançado pelo admin para fins de bolão é o do tempo normal.

### Desempate (Art. 9º) — ordem estrita
1. **Perguntas de desempate:** quem acertou mais das **5 perguntas especiais**. Avaliadas **uma de cada vez, na ordem 1 → 5**, até que um competidor acerte e o outro não (critério sequencial, não soma).
2. **Mais placares exatos** (`ranking.exact_scores`).
3. **Mais resultados corretos** (`ranking.correct_results`).

As 5 perguntas são respondidas **antes do início da Copa** (mesmo prazo da Fase de Grupos), ficam em `tiebreaker_answers` e aparecem na seção Desempate. A seção deve deixar **transparente** qual critério decidiu cada empate.

**Perguntas (dinâmicas, texto livre — tabelas `tiebreaker_questions` / `tiebreaker_responses`):**
O admin faz CRUD das perguntas em `/admin/desempate` e cadastra a `official_answer` de cada uma no fim. O jogador responde em texto livre (uma resposta por pergunta). O critério 1 do desempate compara, na ordem de `display_order`, quem acertou cada pergunta (`is_correct`), sequencialmente.

As 5 perguntas migradas do app antigo: campeão, artilheiro, mais gols na fase de grupos, mais cartões na fase de grupos, até onde o Brasil chega. O admin pode editar/remover/adicionar livremente.

### Prazos de palpite e ciclo de fases (Art. 6º)
O admin controla cada fase via `tournament_phases` (`status` + `betting_locks_at`):
- **`upcoming`** → fase ainda não liberada; ninguém palpita.
- **`open`** → admin liberou; jogadores palpitam até `betting_locks_at`.
- **`locked`** → prazo passou (ou admin travou); sem novos palpites, admin lança resultados.
- **`concluded`** → resultados oficiais lançados, pontuação exibida; admin libera a próxima fase.

Fluxo real: ex.: 1º jogo da fase de grupos 11/06 às 15:00 → admin define `betting_locks_at = 11/06 14:45`. Passou o horário, palpites travam. Admin lança os resultados, marca a fase como `concluded`, a pontuação aparece, e então abre (`open`) a fase seguinte. **A trava é garantida no banco** (trigger `enforce_bet_deadline`, migration 05), não só no front.

### Transparência (Art. 7º)
Após o **início de cada jogo**, os palpites de todos os participantes para aquela partida ficam visíveis para todos. Antes do início: cada um só vê o próprio.

### Classificação (Art. 8º)
Ranking recalculado **automaticamente** quando o admin lança o placar oficial. **O banco já tem a função `recalculate_complete_ranking()`** (criada no schema base): ela limpa e regrava `ranking` para todos os usuários, somando `bets.points`, contando placares exatos (points=15) e resultados certos (points=5). **Usar essa função** em vez de reimplementar a lógica.

Fluxo do lançamento de resultado pelo admin (server action): (1) grava `home_score`/`away_score` e `status` na `matches`; (2) percorre os `bets` da partida aplicando `calcularPontos` e grava `bets.points`; (3) chama `recalculate_complete_ranking()`; (4) atualiza `ranking.position` ordenando por `total_points` + critérios de desempate. **Fonte única de pontos = `ranking.total_points`** (ignorar `ranking.points` legado).
> Nota: a função existente preenche `total_points` (soma direta de `points`) e `points` (recálculo padrão) com o mesmo valor. Mantemos `total_points` como fonte. A ordenação por desempate (perguntas → exatos → resultados) é aplicada na server action ao definir `position`.

### Premiação e financeiro (Art. 10º e 11º)
- Inscrição: **R$ 100** por participante.
- Premiação proporcional ao total arrecadado, limitada a: **1º = 70%, 2º = 20%, 3º = 10%**.
- **Ousa Churras:** os **2 últimos colocados** pagam **R$ 50** cada para a confraternização da final, independentemente de presença.
- O status de pagamento (`pago`) aparece no app (badge no header/perfil).

---

## 7. Seções (rotas)

| Seção | Rota | O que faz |
|---|---|---|
| **Início** | `/inicio` | Resumo do jogador: posição no ranking, próximos jogos a palpitar, palpites pendentes, destaques. Dashboard pessoal. |
| **Palpite** | `/palpite` | Lista de partidas. Abertas = editável; encerradas = palpite + resultado + pontos ganhos. Foco no fluxo rápido de palpitar. |
| **Ranking** | `/ranking` | Classificação geral. Pódio destacado (gold), linha do usuário fixada/realçada. Animar mudança de posição. |
| **Desempate** | `/desempate` | Explica os critérios de desempate e mostra os números que definem empates. Transparência. |
| **Meu Perfil** | `/perfil` | Dados do jogador, avatar, `payment_status`, histórico de palpites, estatísticas (% de acerto, placares exatos), logout. |
| **Pagamento** | `/pagamento` | **Read-only p/ jogador.** Mostra a quota (`pool_settings.quota_value` = R$ 100), a chave PIX e instruções (`pool_settings.payment_instructions`, editadas pelo admin), e o status da própria inscrição. |
| **Regras** | `/regras` | Regulamento (Arts. 1º–12º). Conteúdo **editável pelo admin** (não hardcoded). |
| **Admin** | `/admin` | Dashboard completo, só `role=admin`. Ver §7.1. |

> Confirmado: login **email + senha** apenas. As 6 seções principais do jogador + Pagamento + Regras + Admin compõem o app. Bottom nav mostra as principais do jogador; Pagamento/Regras podem ficar no menu/perfil.

### 7.1 Dashboard Admin — controle total do app

Não é uma página de formulários soltos: é um **painel de controle**. Visão geral no topo (status do bolão, fase atual, nº de pagos/pendentes, próximos jogos sem resultado) e seções de gestão:

**a) Configuração de fases** (`pool_settings.current_phase` + `phase_deadlines` jsonb)
Definir a fase atual do torneio e, para **cada fase**, o horário em que os palpites travam. Editar `phase_deadlines` (ex.: `{ "group_stage": "2026-06-11T13:00:00-03:00", "round_of_16": "...", ... }`). Esse deadline é a fonte da trava — front e banco leem daqui.

**b) Administração de jogos** (`matches`, `national_teams`)
Gerenciar seleções (CRUD de `national_teams`: nome, país, emblema/bandeira via Storage). Criar/editar partidas (usar `*_national_id`, `category='national'`, `phase`, `match_group`, `round`, `match_date`). **Lançar resultado** (`home_score`/`away_score` + `status`) → dispara o recálculo do ranking (§6 Classificação). **Backup:** exportar dados (jogos, palpites, ranking) em JSON/CSV.

**c) Gerenciar participantes** (`profiles`, `bets_with_profiles`)
Listar jogadores, marcar `payment_status` como **pago/pendente**. Ver **todos os palpites** de todos (via view `bets_with_profiles`). **Gerar PDF bonito** dos palpites de uma rodada/fase para enviar no grupo do WhatsApp (ver §7.2).

**d) Perguntas de desempate**
Configurar as perguntas exibidas na seção Desempate e cadastrar as **respostas oficiais** (para o cálculo do critério 1). Depende da decisão de arquitetura do §6 (dinâmico vs. fixo).

**e) Pagamento** (`pool_settings`)
Editar `quota_value` e `payment_instructions` (a **chave PIX** que aparece para os jogadores em `/pagamento`).

**f) Regras** (`/admin/regras`)
Adicionar, editar e remover artigos do regulamento exibido em `/regras`. Lê/grava na tabela `rules` (já criada, migration 03, com o regulamento populado).

> Todas as tabelas necessárias já existem após as migrations em `/migrations`.

### 7.2 PDF de palpites (para o WhatsApp)
Recurso do admin para gerar um **PDF caprichado** com os palpites de uma rodada/fase e mandar no grupo.
- Gerar **server-side** (rota em `/api` ou server action) — ler de `bets_with_profiles` filtrando por partida/fase.
- Visual alinhado ao design system (§4): cabeçalho com identidade OusaBolão, tabela legível (jogador × jogos × palpite), destaque para placares/pontuação. **Não** pode parecer relatório genérico.
- Biblioteca: `@react-pdf/renderer` ou HTML→PDF (Playwright/puppeteer numa rota). Preferir solução que renderize bonito e seja fácil de manter.

---

## 8. Autenticação e papéis

- **Login: email + senha** (Supabase Auth). Sem magic link, sem OAuth/Google.
- **Admin** é definido pela tabela **`user_roles`** (`role = 'admin'`, enum `app_role`), verificado pelas funções SQL **`is_admin()`** / **`has_role(uid, 'admin')`** — **não** por coluna em `profiles`.
- `/admin` e subpáginas protegidos em **duas camadas**: (1) middleware/layout no Next que checa o papel antes de renderizar; (2) RLS no banco (`is_admin()`). Nunca confiar só no front.
- Sessão via `@supabase/ssr` com cookies httpOnly. No signup, criar a linha em `profiles` (trigger `handle_new_user` ou na server action) com `payment_status='pending'`.

---

## 9. Convenções de código

- **TypeScript strict.** Sem `any` solto — tipar a partir dos tipos gerados do Supabase (`supabase gen types`).
- Componentes pequenos e nomeados em PascalCase; arquivos de feature em PascalCase, utils em camelCase.
- Server Actions para mutações; validar input com **Zod** antes de tocar o banco.
- Nada de lógica de negócio dentro de componente de UI — extrair para `/lib`.
- Comentários só onde a intenção não é óbvia. Código em inglês; textos de UI em **PT-BR**.
- Tratamento de erro explícito em toda chamada de dados (estado de loading, erro e vazio em TODA lista/tela).
- Acessibilidade: labels em inputs, foco visível, contraste AA.

---

## 10. Comandos

```bash
pnpm dev            # ambiente local
pnpm build          # build de produção
pnpm lint           # checagem
pnpm typecheck      # tsc --noEmit
npx supabase gen types typescript --linked > types/database.ts   # regenerar tipos
```

---

## 11. Guardrails (resumo do que NUNCA fazer)

1. **Nunca** expor a `service_role key` no client.
2. **Nunca** confiar em filtro de segurança feito só no front — RLS sempre.
3. **Nunca** deixar o usuário criar/editar palpite após o deadline da fase. **A trava precisa estar no banco** (policy/trigger em `bets`), não só no front — hoje é um furo (ver §5).
4. **Nunca** deixar `national_teams` (ou matches/pool_settings/ranking) graváveis por jogador comum — só admin. Remover as policies `*authenticated users only` de `national_teams` (ver §5).
5. **Nunca** entregar tela sem estados de loading/erro/vazio.
6. **Nunca** usar visual default genérico (ver §4 anti-padrões).
7. **Sempre** usar `national_teams` + `category='national'` nas partidas da Copa (não os campos de `teams`/clubes).
8. **Fonte única de pontos = `ranking.total_points`**; não usar `ranking.points` (legado). Não dropar coluna sem confirmar com Léo.
9. Antes de criar tabela nova (`rules`, perguntas dinâmicas) ou dropar coluna/policy, **confirmar a migration com Léo**.
10. Mudou regra de pontuação, schema ou RLS? Atualize **este arquivo** junto.

---

## 12. Pendências de decisão

**Resolvido (migrations em `/migrations`):**
- [x] Perguntas de desempate dinâmicas (texto livre) → `tiebreaker_questions`/`tiebreaker_responses`.
- [x] Tabela `rules` para regulamento editável (criada + populada).
- [x] Trava de deadline no banco → trigger via `tournament_phases`.
- [x] Limpeza de RLS (furo de `national_teams`, duplicatas de `matches`).
- [x] Ciclo de fases controlado pelo admin (`upcoming/open/locked/concluded`).

**Mantido por segurança (não dropar sem nova decisão):**
- `tiebreaker_answers` (legado), `pool_settings.phase_deadlines` (jsonb), `ranking.points` (numeric), `teams` (clubes).

**Ainda em aberto:**
- [ ] Após rodar as migrations: configurar `betting_locks_at` da fase de grupos (11/06/2026, horário exato) e a chave PIX em `pool_settings.payment_instructions`.
- [ ] Validar a migração de `tiebreaker_answers` → `tiebreaker_responses` antes de arquivar a tabela antiga.
- [ ] Cor de marca definitiva (§4) e logo do OusaBolão.
- [ ] Revisar texto da 5ª pergunta de desempate (Brasil) se quiser.