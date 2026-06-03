import { describe, expect, it } from 'vitest'
import { calcularPontos } from './calcularPontos'

describe('calcularPontos', () => {
  // ── 15 pts: placar exato ──────────────────────────────────────
  it('2×1 → 2×1 = 15 (exato vitória mandante)', () =>
    expect(calcularPontos({ casa: 2, fora: 1 }, { casa: 2, fora: 1 })).toBe(15))

  it('0×0 → 0×0 = 15 (empate exato zerado)', () =>
    expect(calcularPontos({ casa: 0, fora: 0 }, { casa: 0, fora: 0 })).toBe(15))

  it('1×1 → 1×1 = 15 (empate exato com gols)', () =>
    expect(calcularPontos({ casa: 1, fora: 1 }, { casa: 1, fora: 1 })).toBe(15))

  it('0×2 → 0×2 = 15 (exato vitória visitante)', () =>
    expect(calcularPontos({ casa: 0, fora: 2 }, { casa: 0, fora: 2 })).toBe(15))

  // ── 5 pts: resultado correto, placar diferente ────────────────
  it('2×1 → 3×1 = 5 (mandante vence, placar diferente)', () =>
    expect(calcularPontos({ casa: 2, fora: 1 }, { casa: 3, fora: 1 })).toBe(5))

  it('1×1 → 2×2 = 5 (acerta empate, placar diferente)', () =>
    expect(calcularPontos({ casa: 1, fora: 1 }, { casa: 2, fora: 2 })).toBe(5))

  it('0×1 → 0×3 = 5 (acerta vitória visitante, placar diferente)', () =>
    expect(calcularPontos({ casa: 0, fora: 1 }, { casa: 0, fora: 3 })).toBe(5))

  // ── 0 pts: resultado errado ───────────────────────────────────
  it('2×1 → 1×2 = 0 (placar invertido)', () =>
    expect(calcularPontos({ casa: 2, fora: 1 }, { casa: 1, fora: 2 })).toBe(0))

  it('1×1 → 2×1 = 0 (palpitou empate, mandante venceu)', () =>
    expect(calcularPontos({ casa: 1, fora: 1 }, { casa: 2, fora: 1 })).toBe(0))

  it('0×1 → 2×2 = 0 (palpitou visitante, empatou)', () =>
    expect(calcularPontos({ casa: 0, fora: 1 }, { casa: 2, fora: 2 })).toBe(0))

  it('2×0 → 0×0 = 0 (palpitou mandante, empatou)', () =>
    expect(calcularPontos({ casa: 2, fora: 0 }, { casa: 0, fora: 0 })).toBe(0))
})
