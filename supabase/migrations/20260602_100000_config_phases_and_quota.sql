-- =====================================================================
-- OusaBolão · Migration 01 — Config: fases do torneio + quota + helpers
-- =====================================================================
-- O QUE FAZ:
--   1. Cria função genérica de updated_at (set_updated_at) reutilizável.
--   2. Cria a tabela tournament_phases (fonte da verdade do ciclo de fases).
--   3. Migra os horários já existentes em pool_settings.phase_deadlines (jsonb).
--   4. Ajusta a quota para R$ 100,00.
-- SEGURO: não dropa nada. pool_settings.phase_deadlines é MANTIDA (legado).
-- =====================================================================

-- 1) Helper de updated_at -------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) Tabela de fases ------------------------------------------------------
-- Ciclo de vida de cada fase:
--   upcoming  -> ainda não liberada para palpites
--   open      -> palpites liberados (até betting_locks_at)
--   locked    -> prazo encerrado, admin lançando resultados
--   concluded -> resultados oficiais lançados, pontuação exibida
create table if not exists public.tournament_phases (
  id               uuid primary key default gen_random_uuid(),
  phase            text not null unique,   -- chave canônica (bate com matches.phase)
  label            text not null,          -- rótulo de exibição em PT-BR
  display_order    int  not null,
  status           text not null default 'upcoming'
                     check (status in ('upcoming','open','locked','concluded')),
  betting_locks_at timestamptz,            -- horário em que o admin trava os palpites
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists trg_tournament_phases_updated_at on public.tournament_phases;
create trigger trg_tournament_phases_updated_at
  before update on public.tournament_phases
  for each row execute function public.set_updated_at();

-- Seed das fases da Copa 2026 (48 seleções → Round of 32).
-- group_stage já entra como 'open'; as demais 'upcoming' (admin libera depois).
insert into public.tournament_phases (phase, label, display_order, status)
values
  ('group_stage',     'Fase de Grupos',   1, 'open'),
  ('round_of_32',     '16-avos de final', 2, 'upcoming'),
  ('round_of_16',     'Oitavas de final', 3, 'upcoming'),
  ('quarter_finals',  'Quartas de final', 4, 'upcoming'),
  ('semi_finals',     'Semifinais',       5, 'upcoming'),
  ('third_place',     'Disputa de 3º',    6, 'upcoming'),
  ('final',           'Final',            7, 'upcoming')
on conflict (phase) do nothing;

-- 3) Migra horários já configurados em pool_settings.phase_deadlines ------
update public.tournament_phases tp
set betting_locks_at = (ps.phase_deadlines ->> tp.phase)::timestamptz
from public.pool_settings ps
where ps.phase_deadlines ? tp.phase
  and nullif(ps.phase_deadlines ->> tp.phase, '') is not null;

-- 4) Quota = R$ 100,00 (estava 50) ---------------------------------------
update public.pool_settings set quota_value = 100 where quota_value = 50;

-- RLS da nova tabela ------------------------------------------------------
alter table public.tournament_phases enable row level security;

drop policy if exists "Phases viewable by authenticated" on public.tournament_phases;
create policy "Phases viewable by authenticated"
  on public.tournament_phases for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admins manage phases" on public.tournament_phases;
create policy "Admins manage phases"
  on public.tournament_phases for all
  using (public.is_admin())
  with check (public.is_admin());
