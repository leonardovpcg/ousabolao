-- =====================================================================
-- OusaBolão · Migration 08 — Prazo de palpite por rodada
-- =====================================================================
-- O QUE FAZ:
--   1. Adiciona betting_locks_at em phase_rounds (prazo por rodada).
--   2. Reescreve enforce_bet_deadline para verificar, no modo per_round,
--      o prazo da rodada específica do jogo (em vez do prazo da fase).
-- POR QUÊ:
--   No modo whole_phase, o trigger usava tournament_phases.betting_locks_at
--   (que nunca era gravado pelo app) — trava automática não funcionava.
--   No modo per_round, o trigger nem sabia que rodadas existiam.
--   Agora: openPhase/openRound gravam os prazos no banco; o trigger lê.
-- DEPENDE DE: migrations 01, 05, 06.
-- =====================================================================

-- 1) Nova coluna em phase_rounds ------------------------------------------

ALTER TABLE public.phase_rounds
  ADD COLUMN IF NOT EXISTS betting_locks_at timestamptz;

-- 2) Trigger reescrito — suporta whole_phase e per_round ------------------

CREATE OR REPLACE FUNCTION public.enforce_bet_deadline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phase       text;
  v_round       text;
  v_status      text;
  v_locks_at    timestamptz;
  v_bet_mode    text;
  v_round_locks timestamptz;
BEGIN
  -- Admin pode lançar/corrigir palpites sem restrição de prazo
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Busca fase e rodada do jogo
  SELECT m.phase, m.round
    INTO v_phase, v_round
  FROM public.matches m
  WHERE m.id = NEW.match_id;

  IF v_phase IS NULL THEN
    RAISE EXCEPTION 'Jogo inexistente ou sem fase definida.';
  END IF;

  -- Busca configuração da fase
  SELECT tp.status, tp.betting_locks_at, tp.bet_mode
    INTO v_status, v_locks_at, v_bet_mode
  FROM public.tournament_phases tp
  WHERE tp.phase = v_phase;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Fase "%" não está configurada.', v_phase;
  END IF;

  -- Fase deve estar aberta
  IF v_status <> 'open' THEN
    RAISE EXCEPTION 'Os palpites da fase "%" não estão abertos.', v_phase;
  END IF;

  -- Modo per_round (fase de grupos): verifica prazo da rodada específica
  IF v_bet_mode = 'per_round' AND v_phase = 'group_stage' AND v_round IS NOT NULL THEN
    SELECT pr.betting_locks_at
      INTO v_round_locks
    FROM public.phase_rounds pr
    WHERE pr.phase = v_phase AND pr.round = v_round;

    IF v_round_locks IS NOT NULL AND NOW() >= v_round_locks THEN
      RAISE EXCEPTION 'O prazo de palpites da rodada % encerrou em %.', v_round, v_round_locks;
    END IF;

  ELSE
    -- Modo whole_phase (ou mata-mata): verifica prazo da fase
    IF v_locks_at IS NOT NULL AND NOW() >= v_locks_at THEN
      RAISE EXCEPTION 'O prazo de palpites desta fase encerrou em %.', v_locks_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- O trigger em si já existe desde a migration 05 — só a função foi atualizada.
-- Recriamos por garantia caso tenha sido dropado manualmente.
DROP TRIGGER IF EXISTS trg_enforce_bet_deadline ON public.bets;
CREATE TRIGGER trg_enforce_bet_deadline
  BEFORE INSERT OR UPDATE ON public.bets
  FOR EACH ROW EXECUTE FUNCTION public.enforce_bet_deadline();
