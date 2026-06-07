-- =====================================================================
-- OusaBolão · Migration 07 — RLS Hardening Abrangente
-- =====================================================================
-- O QUE FAZ:
--   Consolida e endurece TODAS as policies RLS do banco em um estado
--   definitivo. Seguro de rodar múltiplas vezes (DROP IF EXISTS + CREATE).
--
--   Regras aplicadas:
--   - Leitura: todos os autenticados (dados públicos do bolão)
--   - Jogador escreve: só o que é seu (bets, perfil, respostas)
--   - payment_status: somente admin pode alterar (trigger dedicado)
--   - Jogadores NÃO podem deletar bets nem respostas — só admin
--   - user_roles: jogador vê só o próprio; admin gerencia tudo (CRÍTICO)
--   - ranking/pool_settings: leitura livre; escrita só admin
--   - tiebreaker_answers (legado): read-only para autenticados
-- =====================================================================

-- ── TRIGGER: proteger payment_status em profiles ───────────────────
-- Impede que o jogador altere o próprio status de pagamento via API.
-- Só admin pode mudar paid/pending.

CREATE OR REPLACE FUNCTION public.protect_payment_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin()
     AND NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar o status de pagamento.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_payment_status ON public.profiles;
CREATE TRIGGER trg_protect_payment_status
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_payment_status();


-- ══════════════════════════════════════════════════════════════════
-- PROFILES
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Todos os autenticados leem perfis (necessário para rankings, nomes, etc.)
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Jogador atualiza o próprio perfil (payment_status protegido por trigger acima)
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT é feito pelo trigger handle_new_user (SECURITY DEFINER) — sem policy de INSERT p/ usuário
-- Isso bloqueia insert direto via API por qualquer não-admin

-- Admin gerencia tudo (inclui INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
CREATE POLICY "Admins manage profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ══════════════════════════════════════════════════════════════════
-- USER_ROLES  (tabela crítica — define quem é admin)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Jogador vê apenas o próprio role (sabe se é user/admin)
-- is_admin() usa SECURITY DEFINER e não depende desta policy para funcionar
DROP POLICY IF EXISTS "Users view own role" ON public.user_roles;
CREATE POLICY "Users view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admin gerencia todos os papéis (promover/rebaixar)
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ══════════════════════════════════════════════════════════════════
-- BETS (palpites)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

-- Todos os autenticados leem (Art. 7º — transparência; a UI filtra por horário)
DROP POLICY IF EXISTS "Bets viewable by authenticated" ON public.bets;
CREATE POLICY "Bets viewable by authenticated"
  ON public.bets FOR SELECT
  USING (auth.role() = 'authenticated');

-- Jogador insere o próprio palpite (deadline garantido por trigger enforce_bet_deadline)
DROP POLICY IF EXISTS "Users insert own bets" ON public.bets;
CREATE POLICY "Users insert own bets"
  ON public.bets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Jogador atualiza o próprio palpite (deadline garantido por trigger)
DROP POLICY IF EXISTS "Users update own bets" ON public.bets;
CREATE POLICY "Users update own bets"
  ON public.bets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Jogador NÃO pode deletar palpite — sem policy de DELETE para usuário comum

-- Admin gerencia tudo (corrigir palpites, deletar, etc.)
DROP POLICY IF EXISTS "Admins manage bets" ON public.bets;
CREATE POLICY "Admins manage bets"
  ON public.bets FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Remove policies antigas com nome "for all" que podiam dar DELETE ao usuário
DROP POLICY IF EXISTS "Users manage own bets" ON public.bets;


-- ══════════════════════════════════════════════════════════════════
-- RANKING
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.ranking ENABLE ROW LEVEL SECURITY;

-- Todos os autenticados leem
DROP POLICY IF EXISTS "Ranking viewable by authenticated" ON public.ranking;
CREATE POLICY "Ranking viewable by authenticated"
  ON public.ranking FOR SELECT
  USING (auth.role() = 'authenticated');

-- Escrita SOMENTE admin (recalculate_complete_ranking() é chamado pelo admin)
DROP POLICY IF EXISTS "Admins manage ranking" ON public.ranking;
CREATE POLICY "Admins manage ranking"
  ON public.ranking FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Remove qualquer policy legada que possa ter dado acesso de escrita a autenticados
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.ranking;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.ranking;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.ranking;


-- ══════════════════════════════════════════════════════════════════
-- POOL_SETTINGS (configurações globais: quota, PIX, fase atual)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.pool_settings ENABLE ROW LEVEL SECURITY;

-- Todos os autenticados leem (quota e PIX são informações necessárias para o jogador)
DROP POLICY IF EXISTS "Pool settings viewable by authenticated" ON public.pool_settings;
CREATE POLICY "Pool settings viewable by authenticated"
  ON public.pool_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Somente admin altera configurações
DROP POLICY IF EXISTS "Admins manage pool settings" ON public.pool_settings;
CREATE POLICY "Admins manage pool settings"
  ON public.pool_settings FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Remove policies legadas
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.pool_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.pool_settings;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.pool_settings;


-- ══════════════════════════════════════════════════════════════════
-- TIEBREAKER_RESPONSES — ajuste: remover DELETE do usuário
-- ══════════════════════════════════════════════════════════════════

-- Remove a policy "for all" que permitia delete pelo próprio usuário
DROP POLICY IF EXISTS "Users manage own responses" ON public.tiebreaker_responses;

-- Jogador insere a própria resposta (deadline via trigger enforce_tiebreaker_deadline)
DROP POLICY IF EXISTS "Users insert own responses" ON public.tiebreaker_responses;
CREATE POLICY "Users insert own responses"
  ON public.tiebreaker_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Jogador atualiza a própria resposta (deadline via trigger)
DROP POLICY IF EXISTS "Users update own responses" ON public.tiebreaker_responses;
CREATE POLICY "Users update own responses"
  ON public.tiebreaker_responses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SELECT e admin já definidos na migration 02 — mantidos


-- ══════════════════════════════════════════════════════════════════
-- TIEBREAKER_ANSWERS (tabela legada — read-only)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.tiebreaker_answers ENABLE ROW LEVEL SECURITY;

-- Leitura para autenticados (dados migrados, somente consulta)
DROP POLICY IF EXISTS "Tiebreaker answers viewable by authenticated" ON public.tiebreaker_answers;
CREATE POLICY "Tiebreaker answers viewable by authenticated"
  ON public.tiebreaker_answers FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin pode editar se precisar corrigir dados da migração
DROP POLICY IF EXISTS "Admins manage tiebreaker answers" ON public.tiebreaker_answers;
CREATE POLICY "Admins manage tiebreaker answers"
  ON public.tiebreaker_answers FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Remove policies legadas que davam escrita a autenticados
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.tiebreaker_answers;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.tiebreaker_answers;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.tiebreaker_answers;
DROP POLICY IF EXISTS "Users manage own tiebreaker answers" ON public.tiebreaker_answers;
