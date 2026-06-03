-- =====================================================================
-- OusaBolão · Migration 03 — Regulamento editável
-- =====================================================================
-- O QUE FAZ:
--   1. Cria a tabela rules (admin adiciona/edita/remove artigos).
--   2. Popula com o regulamento oficial (valores já corrigidos:
--      quota R$ 100, prazo fase de grupos 11/06/2026).
-- =====================================================================

create table if not exists public.rules (
  id            uuid primary key default gen_random_uuid(),
  display_order int  not null,
  title         text not null,
  content       text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_rules_updated_at on public.rules;
create trigger trg_rules_updated_at
  before update on public.rules
  for each row execute function public.set_updated_at();

-- Seed do regulamento (só se vazio) --------------------------------------
insert into public.rules (display_order, title, content)
select * from (values
  (1,  'Art. 1º - Objetivo do Bolão',
       'O OusaBolão tem como objetivo proporcionar diversão e entretenimento entre amigos durante a Copa do Mundo 2026, através de palpites nos resultados dos jogos.'),
  (2,  'Art. 2º - Participação',
       'Podem participar do bolão todos os usuários que se cadastrarem na plataforma com dados válidos (nome, e-mail e senha).'),
  (3,  'Art. 3º - Registro de Palpites',
       'Os participantes deverão registrar seus palpites para o placar final de cada jogo (gols do time mandante vs gols do time visitante) através da plataforma.'),
  (4,  'Art. 4º - Sistema de Pontuação',
       'A pontuação será calculada da seguinte forma: acertar o placar exato do jogo vale 15 pontos; acertar apenas o resultado (vitória, empate ou derrota), mas não o placar exato, vale 5 pontos; errar o resultado vale 0 pontos.'),
  (5,  'Art. 5º - Jogos da Fase de Play-offs',
       'Para jogos que podem ter prorrogação e/ou pênaltis, a pontuação será baseada apenas no resultado obtido nos 90 minutos regulamentares, desconsiderando prorrogação e disputa de pênaltis.'),
  (6,  'Art. 6º - Prazo para Palpites',
       'O prazo para registro de palpites da Fase de Grupos encerra definitivamente no dia 11 de junho de 2026. Após esse prazo, não será possível registrar ou alterar palpites de nenhuma partida da Fase de Grupos. Para as fases de mata-mata, os palpites devem ser preenchidos por fase completa e podem ser alterados até 15 minutos antes do início de cada fase. Parágrafo Único: Os resultados das partidas serão inseridos pelos administradores após cada rodada.'),
  (7,  'Art. 7º - Transparência',
       'Após o início de cada jogo, todos os palpites dos participantes para aquela partida específica ficam visíveis para todos os usuários da plataforma, garantindo transparência total.'),
  (8,  'Art. 8º - Classificação',
       'O ranking será atualizado automaticamente após o registro dos resultados oficiais de cada jogo, ordenando os participantes pela pontuação total acumulada.'),
  (9,  'Art. 9º - Critérios de Desempate',
       'Para fins de critério de desempate no ranking de pontuação, serão considerados os critérios na ordem: 1º acertar a pergunta de desempate; 2º quem possuir mais placares exatos; 3º quem possuir mais resultados exatos. Parágrafo Único: as respostas de desempate são analisadas uma questão por vez (da 1 à 5), até que um dos competidores acerte a resposta.'),
  (10, 'Art. 10º - Premiação',
       'A premiação proporcional para os 3 (três) primeiros colocados observará sobre o total de dinheiro arrecadado no momento da inscrição dos participantes e se limitará ao seguinte percentual: 1º colocado 70%, 2º colocado 20%, 3º colocado 10%.'),
  (11, 'Art. 11º - Confraternização (Ousa Churras)',
       'Os últimos 2 (dois) colocados na classificação final deverão promover o pagamento de R$ 50,00 (cinquenta reais) cada, que servirá exclusivamente para utilização na confraternização a ser realizada durante a final da Copa do Mundo (Ousa Churras). Parágrafo Único: O valor deverá ser pago pelo participante independente se estiver presente ou não no grupo "Ousadia".'),
  (12, 'Art. 12º - Comportamento',
       'Todos os participantes devem manter um comportamento respeitoso. A plataforma se reserva o direito de excluir participantes que violem as regras de convivência.')
) as v(display_order, title, content)
where not exists (select 1 from public.rules);

-- RLS --------------------------------------------------------------------
alter table public.rules enable row level security;

drop policy if exists "Rules viewable by authenticated" on public.rules;
create policy "Rules viewable by authenticated"
  on public.rules for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admins manage rules" on public.rules;
create policy "Admins manage rules"
  on public.rules for all
  using (public.is_admin()) with check (public.is_admin());
