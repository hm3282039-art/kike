export const CHICKEN_ROUTES = 12
export const CHICKEN_MODES = {
  calm: { label: 'Détente', survival: .9, description: 'Progression douce, petits multiplicateurs.', district: 'JARDINS DE MINUIT', color: '#a9dec8' },
  classic: { label: 'Classique', survival: .82, description: 'Le rythme original, risque équilibré.', district: 'QUARTIER NÉON', color: '#c9f18b' },
  expert: { label: 'Intense', survival: .7, description: 'Plus de collisions, multiplicateurs plus élevés.', district: 'AVENUE ÉLECTRIQUE', color: '#f4bb82' },
} as const
export type ChickenMode = keyof typeof CHICKEN_MODES
export function chickenMultiplier(step: number, mode: ChickenMode): number {
  const route = Math.min(CHICKEN_ROUTES, Math.max(0, Math.floor(step)))
  return route === 0 ? 1 : Math.floor(.96 / CHICKEN_MODES[mode].survival ** route * 100) / 100
}
export function chickenPayout(stake: number, step: number, mode: ChickenMode): number {
  return Math.floor(stake * chickenMultiplier(step, mode))
}
export function chickenSurvives(random: number, mode: ChickenMode): boolean {
  return random >= 0 && random < CHICKEN_MODES[mode].survival
}
export type ChickenHistory = { amount: number; step: number; won: boolean; stake?: number; mode?: ChickenMode }
