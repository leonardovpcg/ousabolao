/**
 * Calcula a pontuação de um palpite dado o placar oficial (Art. 4º).
 *
 * Regras:
 * - Placar exato (casa E fora iguais) → 15 pts
 * - Resultado correto (mesmo sinal de casa−fora, i.e., mesmo vencedor/empate) → 5 pts
 * - Resultado errado → 0 pts
 *
 * Função pura — sem efeitos colaterais, sem dependência de Supabase ou UI.
 */
export function calcularPontos(
  palpite: { casa: number; fora: number },
  oficial: { casa: number; fora: number },
): 15 | 5 | 0 {
  if (palpite.casa === oficial.casa && palpite.fora === oficial.fora) return 15
  if (Math.sign(palpite.casa - palpite.fora) === Math.sign(oficial.casa - oficial.fora)) return 5
  return 0
}
