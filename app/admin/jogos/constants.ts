export const PHASES = [
  'group_stage',
  'round_of_32',
  'round_of_16',
  'quarter_finals',
  'semi_finals',
  'third_place',
  'final',
] as const

export type Phase = (typeof PHASES)[number]

export const PHASE_LABELS: Record<string, string> = {
  group_stage: 'Fase de Grupos',
  round_of_32: 'Rodada de 32',
  round_of_16: 'Oitavas de Final',
  quarter_finals: 'Quartas de Final',
  semi_finals: 'Semifinais',
  third_place: 'Disputa 3º Lugar',
  final: 'Final',
}
