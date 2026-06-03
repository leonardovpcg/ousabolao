-- =====================================================================
-- OusaBolão · Migration 06 — Modo de palpite por fase + phase_rounds
-- =====================================================================
-- O QUE FAZ:
--   1. Adiciona bet_mode e lock_minutes_before em tournament_phases.
--   2. Cria a tabela phase_rounds (status por rodada da fase de grupos).
--   3. Seed das 3 rodadas iniciais (upcoming).
-- POR QUÊ:
--   O admin precisa configurar: (a) quantos minutos antes o prazo fecha,
--   (b) se a fase de grupos usa um único prazo ou um prazo por rodada.
--   A trava do banco (migration 05) continua usando tournament_phases.status
--   por ora; phase_rounds é usada pelo app para controle granular de abertura.
-- =====================================================================

-- 1) Novos campos em tournament_phases ------------------------------------

alter table public.tournament_phases
  add column if not exists bet_mode text not null default 'whole_phase'
    check (bet_mode in ('whole_phase', 'per_round')),
  add column if not exists lock_minutes_before int not null default 30;

-- 2) Tabela phase_rounds --------------------------------------------------

create table if not exists public.phase_rounds (
  id         uuid primary key default gen_random_uuid(),
  phase      text not null,
  round      text not null check (round in ('1','2','3')),
  status     text not null default 'upcoming'
               check (status in ('upcoming','open','locked','concluded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase, round)
);

drop trigger if exists trg_phase_rounds_updated_at on public.phase_rounds;
create trigger trg_phase_rounds_updated_at
  before update on public.phase_rounds
  for each row execute function public.set_updated_at();

-- 3) Seed rodadas da fase de grupos --------------------------------------

insert into public.phase_rounds (phase, round, status)
values
  ('group_stage', '1', 'upcoming'),
  ('group_stage', '2', 'upcoming'),
  ('group_stage', '3', 'upcoming')
on conflict (phase, round) do nothing;

-- 4) RLS -----------------------------------------------------------------

alter table public.phase_rounds enable row level security;

drop policy if exists "Rounds viewable by authenticated" on public.phase_rounds;
create policy "Rounds viewable by authenticated"
  on public.phase_rounds for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admins manage rounds" on public.phase_rounds;
create policy "Admins manage rounds"
  on public.phase_rounds for all
  using (public.is_admin())
  with check (public.is_admin());
