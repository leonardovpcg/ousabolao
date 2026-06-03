-- =====================================================================
-- OusaBolão · Migration 02 — Desempate dinâmico (texto livre)
-- =====================================================================
-- O QUE FAZ:
--   1. Cria tiebreaker_questions (admin faz CRUD de perguntas).
--   2. Cria tiebreaker_responses (resposta do jogador por pergunta).
--   3. MIGRA os dados de tiebreaker_answers (colunas fixas) -> linhas.
-- SEGURO: a tabela antiga tiebreaker_answers é MANTIDA (não dropada).
--         Após validar a migração, pode ser arquivada/removida em outra etapa.
-- =====================================================================

-- 1) Perguntas (configuráveis pelo admin) --------------------------------
create table if not exists public.tiebreaker_questions (
  id              uuid primary key default gen_random_uuid(),
  display_order   int  not null,
  question        text not null,
  official_answer text,                       -- preenchida pelo admin no fim
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_tiebreaker_questions_updated_at on public.tiebreaker_questions;
create trigger trg_tiebreaker_questions_updated_at
  before update on public.tiebreaker_questions
  for each row execute function public.set_updated_at();

-- 2) Respostas dos jogadores ---------------------------------------------
create table if not exists public.tiebreaker_responses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  question_id  uuid not null references public.tiebreaker_questions(id) on delete cascade,
  answer       text not null,
  is_correct   boolean,                        -- calculado quando official_answer existe
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, question_id)
);

drop trigger if exists trg_tiebreaker_responses_updated_at on public.tiebreaker_responses;
create trigger trg_tiebreaker_responses_updated_at
  before update on public.tiebreaker_responses
  for each row execute function public.set_updated_at();

create index if not exists idx_tiebreaker_responses_user on public.tiebreaker_responses(user_id);
create index if not exists idx_tiebreaker_responses_question on public.tiebreaker_responses(question_id);

-- 3) Seed das 5 perguntas atuais (só se a tabela estiver vazia) ----------
insert into public.tiebreaker_questions (display_order, question)
select * from (values
  (1, 'Quem será o campeão da Copa do Mundo 2026?'),
  (2, 'Quem será o artilheiro da Copa?'),
  (3, 'Qual seleção marcará mais gols na fase de grupos?'),
  (4, 'Qual seleção receberá mais cartões na fase de grupos?'),
  (5, 'Até qual fase a seleção do Brasil vai chegar?')
) as v(display_order, question)
where not exists (select 1 from public.tiebreaker_questions);

-- 4) Migra respostas antigas (colunas -> linhas) -------------------------
with q as (
  select display_order, id from public.tiebreaker_questions
)
insert into public.tiebreaker_responses (user_id, question_id, answer, created_at, updated_at)
select ta.user_id, q.id, src.answer, ta.created_at, ta.updated_at
from public.tiebreaker_answers ta
cross join lateral (values
  (1, ta.champion_team),
  (2, ta.top_scorer),
  (3, ta.most_goals_group_stage),
  (4, ta.most_cards_group_stage),
  (5, ta.furthest_brazilian_team)
) as src(display_order, answer)
join q on q.display_order = src.display_order
where nullif(src.answer, '') is not null
on conflict (user_id, question_id) do nothing;

-- RLS --------------------------------------------------------------------
alter table public.tiebreaker_questions enable row level security;
alter table public.tiebreaker_responses enable row level security;

-- Perguntas: todos leem; só admin gerencia
drop policy if exists "Questions viewable by authenticated" on public.tiebreaker_questions;
create policy "Questions viewable by authenticated"
  on public.tiebreaker_questions for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admins manage questions" on public.tiebreaker_questions;
create policy "Admins manage questions"
  on public.tiebreaker_questions for all
  using (public.is_admin()) with check (public.is_admin());

-- Respostas: todos autenticados leem (transparência); jogador gerencia as próprias; admin tudo
drop policy if exists "Responses viewable by authenticated" on public.tiebreaker_responses;
create policy "Responses viewable by authenticated"
  on public.tiebreaker_responses for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users manage own responses" on public.tiebreaker_responses;
create policy "Users manage own responses"
  on public.tiebreaker_responses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Admins manage all responses" on public.tiebreaker_responses;
create policy "Admins manage all responses"
  on public.tiebreaker_responses for all
  using (public.is_admin()) with check (public.is_admin());
