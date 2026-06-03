# CLAUDE.md — OusaBolão · O Bolão dos Parças

> Fonte da verdade do projeto. Leia este arquivo inteiro antes de gerar ou alterar código.
> Em caso de conflito entre uma instrução pontual no chat e este documento, **pergunte** antes de quebrar um padrão definido aqui.

---

## 1. O que é o OusaBolão

App de bolão entre amigos para a **Copa do Mundo 2026**. Os participantes ("os parças") dão palpites nos placares dos jogos, ganham pontos conforme a precisão do palpite e disputam um ranking ao longo do torneio.

**Princípio inegociável:** experiência **mobile-first de primeira classe, com visual premium editorial** (ver §4, sistema "Almanaque" — tema light, tipografia com caráter, profundidade real). Não pode parecer "app de IA barato": cada tela tem intenção de design, contraste de superfícies e micro-detalhes. **No desktop, comportamento próprio** (sidebar + coluna central), nunca uma coluna mobile esticada. Na dúvida entre "fácil de codar" e "bom/bonito de usar", escolha o segundo.

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

## 4. Design System — "Almanaque" (premium editorial, tema LIGHT)

> **Norte:** o app deve parecer um produto editorial-esportivo caro (pensa em almanaque de Copa premium / app de aposta sofisticado), **não** um template. A diferença premium vem de quatro coisas: **tipografia com caráter, contraste de superfícies, profundidade real e micro-detalhes**. Cor saturada em excesso é o que entrega "IA barata" — aqui a cor é usada com restrição.

### Princípios não-negociáveis
1. **Tipografia faz o trabalho pesado.** Pareamos uma **serifada de display com personalidade** (títulos, números de placar, posições do ranking) com uma **grotesk limpa** para UI. Isso sozinho já tira a cara de "sans genérico de IA". Fonte de display: **Fraunces** (variável, opsz alto) ou **Instrument Serif**. UI: **Geist** (já carregada). Placares e posições SEMPRE na serifada, grandes, `tabular-nums`.
2. **Fundo de papel, não branco puro.** O fundo é um off-white quente (papel). Os cards são branco puro, "flutuando" sobre o papel via hairline + sombra em camadas. Esse contraste papel↔branco é o que dá sofisticação. **Nunca** branco puro de fundo (#FFF chapado é genérico e cansa).
3. **Ação primária em tinta (quase-preto), não em cor.** Botões primários pretos/tinta = editorial e caro. A cor de marca é reservada para identidade, pódio e destaques — não para encher botão.
4. **Restrição.** Uma cor de destaque, usada pouco. Hierarquia por tamanho/peso/espaço, não por encher de cor.

### Tokens (Tailwind v4 — `@theme` no globals.css)
```
/* superfícies */
--color-paper       #F6F5F1   /* fundo (off-white quente, levemente texturizado) */
--color-card        #FFFFFF   /* cards — flutuam sobre o paper */
--color-card-sunken #EFEEE8   /* áreas rebaixadas / inputs */
--color-hairline    #E4E2DA   /* bordas 1px finíssimas */

/* tinta (texto + ações) */
--color-ink         #16151A   /* texto primário e botões primários (quase-preto) */
--color-ink-soft    #5C5A63   /* texto secundário */
--color-ink-faint   #9A98A1   /* legendas, placeholders */

/* marca + destaques (USAR COM RESTRIÇÃO) */
--color-brand       #C8881E   /* OURO/âmbar — identidade, pódio, destaque. Recomendado */
--color-brand-deep  #9A6614
--color-gold        #C8881E   /* 1º lugar */
--color-silver      #8E8E96   /* 2º */
--color-bronze      #B07A4B   /* 3º */

/* semânticos (funcionais, não decorativos) */
--color-win   #1E7A4D   /* só em rótulo de "vitória" no palpite */
--color-draw  #8A8A8A
--color-loss  #B23A2E

/* raio e elevação */
--radius-card  18px
--radius-btn   12px
--radius-pill  999px
```
> **A cor de marca é uma variável só.** Default = OURO/âmbar (energia de troféu, premium, foge do verde genérico). Alternativas prontas se quiser trocar: **Claret** `#9B1B30` (vinho, intenso) ou **Cobalto** `#1B49C4` (elétrico, moderno). Troca em `--color-brand`/`--color-brand-deep` e pronto.

### Detalhes de craft (o que separa premium de genérico)
- **Textura de papel:** ruído/grain sutilíssimo no fundo (`background-image` com noise SVG em ~3% de opacidade). Quase imperceptível, mas tira o "chapado digital".
- **Hairlines:** bordas de 1px em `--color-hairline`, nunca bordas grossas coloridas.
- **Sombras em camadas:** card usa 2 sombras combinadas (uma difusa baixa + uma de contato curta), tom neutro-quente — `0 1px 2px rgba(20,18,25,.04), 0 8px 24px rgba(20,18,25,.06)`. **Nunca** a `shadow-md` default.
- **Números editoriais:** placares e posições grandes, na serifada, `tabular-nums`, com peso. São os protagonistas visuais.
- **Cantos generosos** (18px nos cards) e **espaço pra respirar** (padding de card ≥ 20px; escala 4/8/12/16/20/32/48).
- **Micro-interações com mola:** Framer Motion com spring suave (não linear). Entrada de listas em stagger (~60ms), feedback tátil ao enviar palpite, transição de posição no ranking. Sutil, nunca espalhafatoso.
- **Estados de toque/hover:** no mobile, `active:` com leve scale-down (0.98). No desktop, `hover:` real (eleva card, sublinha link). Foco visível sempre (ring na cor de marca).

### Ícones — fugir do "lucide num círculo"
- Lucide está ok como base, mas: stroke uniforme **1.5px**, tamanho consistente, **sem círculo/badge decorativo atrás**.
- **Estado ativo da nav** = ícone preenchido/realçado + rótulo em tinta + um indicador fino (barrinha ou ponto) na cor de marca. Inativo = outline em `--color-ink-faint`. A diferença ativo/inativo tem que ser nítida.
- Onde fizer sentido (ex.: troféu do ranking, escudos), usar elementos mais ricos que um ícone de traço — bandeiras reais das seleções (`national_teams.emblem_url`), medalhas com profundidade.

### Mobile-first (base)
- **Bottom navigation** fixa, 5 itens (Início, Palpite, Ranking, Desempate, Perfil), ícone + label, toque ≥ 44×44px, `padding-bottom: env(safe-area-inset-bottom)`.
- Ações primárias na zona do polegar. Inputs de placar com `inputMode="numeric"` + stepper +/−.
- Coluna única, cards largura total com margem lateral de 16px.
- Validar SEMPRE em ~390px.

### Comportamento DESKTOP (≥ 1024px) — não é mobile esticado
O erro a evitar: uma coluna de 390px perdida no meio de uma tela branca gigante. No desktop o app vira um shell de produto real:
- **Sai o bottom nav, entra uma sidebar lateral esquerda** fixa (~240px): logo no topo, navegação vertical (ícone + label), bloco do usuário embaixo. Item ativo com o mesmo tratamento (marca + indicador).
- **Conteúdo em coluna central** com `max-width` (~720–840px), centralizado, respirando nas laterais — não largura total.
- **Rail direito opcional** (~300px) em telas largas (≥1280px) para contexto: próximos jogos, mini-ranking, status de pagamento. Em telas médias, esconde o rail.
- **Escala tipográfica maior** no desktop (títulos e placares crescem). **Hover states** ativos (não existem no mobile).
- Breakpoints: `< 768` mobile (bottom nav) · `768–1023` tablet (coluna central mais larga, bottom nav ou sidebar compacta) · `≥ 1024` desktop (sidebar + coluna + rail opcional).
- Implementar com um `AppShell` responsivo: o mesmo conteúdo, navegação e densidade adaptadas por breakpoint.

### Shell do ADMIN — responsivo (regra própria)
O admin tem navegação própria (8 seções) e **não** pode reaproveitar uma fila horizontal de abas no mobile (vaza da tela). Tratar por breakpoint:
- **Desktop (≥1024px):** sidebar lateral do admin (lista vertical das seções) + conteúdo numa coluna confortável (não estreita). Pode ter rail/topo de visão geral.
- **Mobile (<1024px):** **header fixo** com título da seção atual + **menu hambúrguer** que abre um drawer/sheet lateral com as 8 seções (Jogos, Resultados, Fases, Participantes, Desempate, Pagamento, Palpites Gerais, Regras). Selecionou → fecha o drawer e navega. **Nunca** uma régua horizontal de abas com scroll.
- **Conteúdo das seções:** cards e formulários **fluidos** (largura total no mobile, grid no desktop). Texto nunca pode quebrar palavra-a-palavra numa coluna estreita (bug atual) — o conteúdo ocupa a largura disponível. Tabelas largas (palpites, participantes) usam scroll horizontal com 1ª coluna fixa.
- O drawer e o header seguem o design "Almanaque" (papel, tinta, hairlines), não componentes default.

### ❌ Anti-padrões (o "cheiro de IA barata") — PROIBIDO
- Verde/roxo/azul neon saturado como cor dominante; cor enchendo botões e fundos.
- Fundo branco puro chapado; cards sem elevação real (cinza-sobre-cinza).
- shadcn/Tailwind default sem customização; `shadow-md`/`shadow-lg` padrão.
- Sans genérico em tudo (sem a serifada de display); números de placar pequenos e sem destaque.
- Ícone de traço dentro de bolinha colorida repetido em todo título.
- Tudo centralizado e largura-total no desktop; emojis no lugar de ícones; bordas grossas coloridas.
- Espaçamento apertado e uniforme (tudo com o mesmo peso visual).

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

**`teams`** — clubes (uso futuro)
`id`, `name`, `country`, `emblem_url`, `created_at`.
→ **Não é legado.** Design intencional: o app é multi-categoria por `matches.category` (`'national'` p/ seleções, `'club'` p/ clubes), pensado para reaproveitar em bolões de clubes no futuro (Brasileirão, Champions, etc.). `teams` é a tabela de clubes; `national_teams` a de seleções.

**`national_teams`** — seleções (USAR ESTA para a Copa 2026)
`id`, `name`, `country`, `emblem_url`, `created_at`.

**`matches`** — partidas
`id`, `home_team_id`→teams, `away_team_id`→teams, `match_date` (timestamptz), `phase` (text), `match_group` (text), `round` (text), `home_score` (int, null até resultado), `away_score` (int, null), `status` (text, default `'scheduled'`), `category` (text, default `'club'`), `home_team_national_id`→national_teams, `away_team_national_id`→national_teams, `created_at`, `updated_at`.
→ **Design multi-categoria (intencional, não legado).** Partida tem DOIS pares de times via `category`: `'national'` usa `home_team_national_id`/`away_team_national_id` → `national_teams`; `'club'` usa `home_team_id`/`away_team_id` → `teams`. Permite reaproveitar o app em bolões de clubes no futuro. **Para a Copa 2026, usar SEMPRE `*_national_id` + `category='national'`.** Toda query deve ser explícita sobre qual par lê, conforme a `category`.

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

**`phase_rounds`** — status por rodada da fase de grupos (modo `per_round`)
`id`, `phase` (=`group_stage`), `round` (`'1'`/`'2'`/`'3'`), `status` (`upcoming`/`open`/`locked`/`concluded`), unique(`phase`,`round`). Usada só quando `tournament_phases.bet_mode='per_round'`: cada rodada abre/encerra separada. No modo `whole_phase`, o status que vale é o da fase.

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

### ⏰ Fuso horário — REGRA GLOBAL
**Todo o app opera no fuso de Campo Grande, MS: `America/Campo_Grande` (UTC−4).** NÃO usar Brasília/`America/Sao_Paulo` (UTC−3) — MS está 1 hora atrás.
- **Banco:** `timestamptz` sempre em **UTC** (padrão Postgres). Nunca gravar "horário local" como se fosse UTC.
- **Entrada (admin digita data/hora do jogo):** o input é interpretado como horário de Campo Grande e convertido para UTC antes de gravar.
- **Exibição (qualquer horário pro usuário):** converter de UTC para `America/Campo_Grande` na renderização. Labels devem dizer "Campo Grande" (ou nada), nunca "Brasília".
- **Cálculo de prazo:** a trava (X min antes do 1º jogo) é calculada sobre os instantes UTC — então é fuso-agnóstica e correta. O cuidado é só na entrada/exibição.
- Usar uma lib de tempo com timezone (ex.: `date-fns-tz` ou `Temporal`/Intl com `timeZone: 'America/Campo_Grande'`). Centralizar em util (ex.: `lib/utils/datetime.ts`) — nunca formatar data solta sem timezone.

### Pré-requisito para palpitar (trava no banco)
Além da fase estar `open` e dentro do prazo, o jogador **só palpita se estiver pago** (`profiles.payment_status = 'paid'`). Garantido no banco pelo trigger `enforce_bet_payment` (migration 08); admin isento. `payment_status` só assume `'paid'` ou `'pending'` (constraint). O admin alterna esse status na seção Participantes.

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

As 5 perguntas são respondidas **antes do início da Copa** e travam em **11/06/2026 14:45 (America/Campo_Grande)** — prazo fixo, garantido no banco pelo trigger `enforce_tiebreaker_deadline` (migration 11; admin isento). Ficam em `tiebreaker_questions`/`tiebreaker_responses` e aparecem na seção Desempate. A seção deve deixar **transparente** qual critério decidiu cada empate. O admin pode exportar as respostas (CSV e PDF).

**Tela Desempate (jogador) — dois estados:**
- *Antes do prazo (11/06 14:45):* jogador responde/edita as **próprias** respostas; vê só as dele; timer regressivo até o prazo (fuso Campo Grande).
- *Depois do prazo:* respostas travadas (banco, migration 11); a tela vira modo **transparência** e exibe as respostas de **todos os participantes** por pergunta; timer some / "Respostas encerradas".
- Esconder respostas alheias antes do prazo é regra **de tela** (a RLS deixa ler; suficiente entre amigos) — não depender disso para segurança forte.

**Perguntas (dinâmicas, texto livre — tabelas `tiebreaker_questions` / `tiebreaker_responses`):**
O admin faz CRUD das perguntas em `/admin/desempate` e cadastra a `official_answer` de cada uma no fim. O jogador responde em texto livre (uma resposta por pergunta). O critério 1 do desempate compara, na ordem de `display_order`, quem acertou cada pergunta (`is_correct`), sequencialmente.

As 5 perguntas migradas do app antigo: campeão, artilheiro, mais gols na fase de grupos, mais cartões na fase de grupos, até onde o Brasil chega. O admin pode editar/remover/adicionar livremente.

### Prazos de palpite e ciclo de fases (Art. 6º)
Ciclo de vida de cada fase via `tournament_phases.status`:
- **`upcoming`** → fase ainda não liberada; ninguém palpita.
- **`open`** → liberada; jogadores palpitam até o prazo calculado.
- **`locked`** → prazo passou (ou admin travou); sem novos palpites, admin lança resultados.
- **`concluded`** → resultados lançados, pontuação exibida; admin libera a próxima fase.

**Prazo SEMPRE automático.** O admin define apenas a antecedência `X` minutos (ex.: 15). O `locks_at` é **calculado** = (horário do 1º jogo da janela) − X. O admin não digita horário na mão.

**Modo de palpite (configurável por fase):**
- **Fase de grupos:** o admin escolhe entre dois modos:
  - *Fase inteira (`whole_phase`):* trava única = X min antes do 1º jogo de toda a fase de grupos (as 3 rodadas travam juntas nesse instante).
  - *Por rodada (`per_round`):* ao abrir a fase, **as 3 rodadas já ficam preenchíveis de uma vez**. Cada rodada **trava sozinha por horário** = X min antes do 1º jogo daquela rodada (rodadas ainda não vencidas seguem editáveis). **Não há abertura manual de rodada** — abrir é por fase; a trava é automática por rodada.
- **Mata-mata (16-avos → final):** sempre **fase inteira** (um prazo por fase).

**Ciclo (status em `tournament_phases`):** o admin abre a **fase** uma vez (`upcoming → open`); a partir daí toda trava é automática por tempo (trigger `enforce_bet_deadline`, versão final na migration 12). `phase_rounds` **não controla abertura** de palpite (o trigger não depende dela).

**Implicação de dados:** o modo "por rodada" usa `matches.round`. O cálculo do prazo pega o menor `match_date` da janela (fase no `whole_phase`; rodada do jogo no `per_round`). Campos em `tournament_phases`: `bet_mode` (`whole_phase`|`per_round`) e `lock_minutes_before` (int).

Fluxo real (grupos, modo "fase inteira"): 1º jogo 11/06 15:00, X=15 → trava 14:45 automático. Admin lança resultados, marca `concluded`, pontuação aparece, abre a próxima fase.

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
| **Início** | `/inicio` | Dashboard do jogador. **Timer de destaque** (bonito, moderno): countdown em dias/horas/min/seg até **travar a próxima janela de palpite** (janela aberta com o prazo futuro mais próximo = 1º jogo da janela − X; fuso Campo Grande). **Premiação acumulada** = `quota_value` × participantes pagos (cresce com pagamentos). Métricas do jogador: **total de pontos** (`ranking.total_points`), **palpites feitos** (count em `bets`), **placares exatos** (`ranking.exact_scores`), **posição atual** (`ranking.position`/ordem por pontos). |
| **Palpite** | `/palpite` | **Navegação por data** (passa de dia em dia vendo os jogos daquele dia). Cada jogo: bandeiras + sigla das seleções e **stepper de placar** (setinhas ↑/↓ em cada gol, estilo da referência — mas no visual "Almanaque", não copiar o azul). Salva o palpite do jogador (upsert em `bets`). **Trava por tempo** (15 min antes do 1º jogo da janela — rodada no `per_round`, fase no `whole_phase`): timer regressivo; ao zerar, campos viram read-only sem reload (banco também recusa — dupla proteção). **Transparência:** após o prazo da rodada fechar, exibir os palpites dos **outros** participantes naqueles jogos (regra de tela; RLS já permite ler). **Pontos:** quando a partida for marcada encerrada com resultado, exibir os pontos que cada um fez naquele jogo. |
| **Ranking** | `/ranking` | Pódio (1º/2º/3º com fotos, gold/silver/bronze), lista do 4º pra baixo com fotos, linha do usuário realçada. **Tempo real (Supabase Realtime na tabela `ranking`)**: atualiza sozinho quando o admin lança resultado. **"Zona da picanha"**: os 2 últimos colocados destacados (zoeira — Art. 11 Ousa Churras), exibida durante toda a Copa. Ordenação por `total_points` (desempate fino do Art. 9º fica para depois). Animar mudança de posição. |
| **Desempate** | `/desempate` | Explica os critérios de desempate e mostra os números que definem empates. Transparência. |
| **Meu Perfil** | `/perfil` | Dados do jogador, avatar, `payment_status`, histórico de palpites, estatísticas (% de acerto, placares exatos), logout. |
| **Pagamento** | `/pagamento` | **Read-only p/ jogador.** Mostra a quota (`pool_settings.quota_value` = R$ 100), a chave PIX e instruções (`pool_settings.payment_instructions`, editadas pelo admin), e o status da própria inscrição. |
| **Regras** | `/regras` | Regulamento (Arts. 1º–12º). Conteúdo **editável pelo admin** (não hardcoded). |
| **Admin** | `/admin` | Dashboard completo, só `role=admin`. Ver §7.1. |

> Confirmado: login **email + senha** apenas. As 6 seções principais do jogador + Pagamento + Regras + Admin compõem o app. Bottom nav mostra as principais do jogador; Pagamento/Regras podem ficar no menu/perfil.

### 7.1 Dashboard Admin — controle total do app

Não é uma página de formulários soltos: é um **painel de controle** fluido. Sidebar do admin com os itens abaixo. **Visão geral (home do painel):** cockpit com fase atual, modo de palpite ativo, próximo prazo de trava (calculado), nº de pagos/pendentes, e jogos sem resultado lançado.

**a) Jogos** (`national_teams`, `matches`) — abas internas:
- *Seleções:* CRUD de `national_teams` (nome, país, emblema/bandeira via Storage). ✅ já construído.
- *Partidas:* cadastro manual por contexto — admin escolhe **fase** e, na fase de grupos, a **rodada**, e cadastra as partidas. Usar `*_national_id` + `category='national'`, `phase` (chaves canônicas), `match_group`, `round`, `match_date`. Listagem agrupada por fase → rodada.

**b) Resultados** (`matches`, ranking) — item próprio na sidebar (tarefa mais frequente na Copa):
Lista de partidas com foco em lançar placar (`home_score`/`away_score` + `status`). Separar visualmente "a lançar" de "já lançados". Botão "Encerrar e pontuar" por jogo → grava placar, aplica `calcularPontos` nos `bets` daquele jogo e chama `recalculate_complete_ranking()`. Mata-mata: lembrar que conta só 90 min (Art. 5º).

**c) Fases** (`tournament_phases`, `phase_rounds`) — configurar + ABRIR (encerrar é em Resultados):
Define a **fase atual** do torneio (reflete na Home e no Palpite). Lista das fases com status (`upcoming`/`open`/`locked`/`concluded`). Por fase: **modo de palpite** (fase de grupos: toggle *fase inteira* / *por rodada*; mata-mata sempre fase inteira) e **X min** de antecedência (`lock_minutes_before`). Exibe o **prazo calculado** (somente leitura) derivado do 1º jogo da janela (ver §6) — se não houver jogos cadastrados, mostrar "aguardando cadastro de jogos".
- **Abrir** a janela para palpite: `upcoming → open` na **fase** (`tournament_phases`). Vale para os dois modos — no `per_round`, abrir a fase já libera as 3 rodadas (cada uma trava sozinha no horário). **Não** há botão de abrir rodada individual.
- **Não** encerra aqui — encerrar (`concluded`) é ação da seção Resultados.

**Divisão Fases × Resultados:** Fases = configurar e **abrir**; Resultados = lançar placar e **encerrar** (rodada/fase). Fluxo: abre rodada/fase em Fases → jogadores palpitam até o prazo → em Resultados lança placares e encerra → pontuação/ranking aparecem → volta em Fases e abre a próxima.

**d) Participantes** (`profiles`, `bets_with_profiles`):
Listar jogadores, marcar `payment_status` **pago/pendente**. **Ver todos os palpites** (via view `bets_with_profiles`), filtrável por fase/rodada/jogo. **Exportar PDF** dos palpites para o grupo (ver §7.2).

**e) Desempate** (`tiebreaker_questions`, `tiebreaker_responses`):
CRUD das perguntas (texto livre): adicionar, editar, reordenar, ativar/desativar, remover. Cadastro da **resposta oficial** (`official_answer`) de cada pergunta — preenchida depois (pode ficar vazia). **Exportar as respostas dos jogadores em CSV e PDF.** As respostas dos jogadores travam em 11/06/2026 14:45 (trigger, migration 11); a tela pode exibir esse prazo e o status (aberto/encerrado).

**f) Pagamento** (`pool_settings`):
Editar `quota_value` (R$100) e `payment_instructions` (a **chave PIX** exibida em `/pagamento`).

**g) Palpites Gerais** (`bets_with_profiles`, `matches`, `national_teams`) — fica **acima de Regras** no menu:
Visão central de **todos os palpites** de todos os participantes. Filtrar por **fase** e por **rodada** (e idealmente por jogo/participante). Ler da view `bets_with_profiles` (já traz nome, email, status de pagamento) cruzando com `matches` (jogos da fase/rodada) e `national_teams` (escudos). Apresentar como matriz/tabela jogador × jogos. **Exportar em CSV e PDF** (mesmo motor de PDF reutilizável do Desempate) para mandar no grupo. Respeitar transparência (Art. 7º): aqui o admin vê tudo; a regra de esconder palpite alheio antes do jogo é só do lado do jogador.

**h) Regras** (`rules`):
Adicionar, editar, remover e reordenar artigos do regulamento exibido em `/regras`.

> Acesso ao admin: §8. Tabelas existentes após migrations; pendente apenas a migration de `bet_mode`/`lock_minutes_before` em `tournament_phases`.

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
- `tiebreaker_answers` (legado), `pool_settings.phase_deadlines` (jsonb), `ranking.points` (numeric). (`teams` NÃO é legado — é a tabela de clubes do design multi-categoria.)

**Ainda em aberto:**
- [ ] Após rodar as migrations: configurar `betting_locks_at` da fase de grupos (11/06/2026, horário exato) e a chave PIX em `pool_settings.payment_instructions`.
- [ ] Validar a migração de `tiebreaker_answers` → `tiebreaker_responses` antes de arquivar a tabela antiga.
- [ ] Cor de marca definitiva (§4) e logo do OusaBolão.
- [ ] Revisar texto da 5ª pergunta de desempate (Brasil) se quiser.