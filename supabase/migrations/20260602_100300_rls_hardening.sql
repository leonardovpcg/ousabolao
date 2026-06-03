-- =====================================================================
-- OusaBolão · Migration 04 — Endurecimento de RLS (hardening)
-- =====================================================================
-- O QUE FAZ:
--   1. FECHA o furo de national_teams (qualquer autenticado podia editar/
--      deletar seleções). Agora só admin gerencia.
--   2. Remove policies duplicadas/legado de matches, padronizando em is_admin().
--   3. Mantém leitura pública/autenticada onde já existia.
-- ATENÇÃO: revise os nomes das policies contra o seu banco antes de rodar.
--          Os DROPs usam IF EXISTS, então é seguro se algum nome não bater.
-- =====================================================================

-- 1) national_teams: remover acesso de escrita de "authenticated" --------
drop policy if exists "Enable insert for authenticated users only" on public.national_teams;
drop policy if exists "Enable update for authenticated users only" on public.national_teams;
drop policy if exists "Enable delete for authenticated users only" on public.national_teams;

-- Garante leitura para autenticados e gestão só por admin (idempotente)
drop policy if exists "National teams viewable by authenticated" on public.national_teams;
create policy "National teams viewable by authenticated"
  on public.national_teams for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admins manage national teams" on public.national_teams;
create policy "Admins manage national teams"
  on public.national_teams for all
  using (public.is_admin()) with check (public.is_admin());

-- 2) matches: limpar duplicatas e padronizar -----------------------------
drop policy if exists "Everyone can view matches" on public.matches;
drop policy if exists "Enable insert for admins" on public.matches;
drop policy if exists "Enable update for admins" on public.matches;
drop policy if exists "Enable delete for admins" on public.matches;
drop policy if exists "Apenas Admins podem deletar matches" on public.matches;

-- Conjunto final e único:
drop policy if exists "Matches viewable by authenticated" on public.matches;
create policy "Matches viewable by authenticated"
  on public.matches for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admins manage matches" on public.matches;
create policy "Admins manage matches"
  on public.matches for all
  using (public.is_admin()) with check (public.is_admin());

-- 3) teams (clubes legado): leitura autenticada + gestão admin (idempotente)
drop policy if exists "Teams viewable by authenticated" on public.teams;
create policy "Teams viewable by authenticated"
  on public.teams for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admins manage teams" on public.teams;
create policy "Admins manage teams"
  on public.teams for all
  using (public.is_admin()) with check (public.is_admin());
