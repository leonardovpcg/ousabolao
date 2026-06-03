-- =====================================================================
-- OusaBolão · Migration 05 — Trava de prazo de palpites NO BANCO
-- =====================================================================
-- O QUE FAZ:
--   Impede insert/update de palpite (bets) quando a fase do jogo não está
--   aberta OU o horário de trava (betting_locks_at) já passou.
--   Admin é isento (pode corrigir manualmente).
-- POR QUÊ:
--   No app antigo a trava existia só no front -> qualquer um podia palpitar
--   pela API depois do jogo começar. Agora é garantido no banco.
-- DEPENDE DE: migration 01 (tournament_phases).
-- =====================================================================

create or replace function public.enforce_bet_deadline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phase    text;
  v_status   text;
  v_locks_at timestamptz;
begin
  -- Admin pode lançar/corrigir palpites sem restrição de prazo
  if public.is_admin() then
    return new;
  end if;

  select m.phase into v_phase
  from public.matches m
  where m.id = new.match_id;

  if v_phase is null then
    raise exception 'Jogo inexistente ou sem fase definida.';
  end if;

  select tp.status, tp.betting_locks_at
    into v_status, v_locks_at
  from public.tournament_phases tp
  where tp.phase = v_phase;

  if v_status is null then
    raise exception 'Fase "%" não está configurada.', v_phase;
  end if;

  if v_status <> 'open' then
    raise exception 'Os palpites da fase "%" não estão abertos.', v_phase;
  end if;

  if v_locks_at is not null and now() >= v_locks_at then
    raise exception 'O prazo de palpites desta fase encerrou em %.', v_locks_at;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_bet_deadline on public.bets;
create trigger trg_enforce_bet_deadline
  before insert or update on public.bets
  for each row execute function public.enforce_bet_deadline();
