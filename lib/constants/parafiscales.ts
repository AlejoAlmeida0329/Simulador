/**
 * Colombian parafiscal contribution rates (2024)
 * These rates are applied to the salary base (not including bonuses)
 */

// Health contribution rate
export const HEALTH_RATE = 0.085 // 8.5%

// Pension contribution rate
export const PENSION_RATE = 0.12 // 12%

// ARL (Occupational Risk) rates by risk level
export const ARL_RATES = {
  I: 0.00522, // 0.522%
  II: 0.01044, // 1.044%
  III: 0.02436, // 2.436%
  IV: 0.04350, // 4.350%
  V: 0.06960, // 6.960%
} as const

export type ARLRiskLevel = keyof typeof ARL_RATES

// SENA (National Learning Service) rate
export const SENA_RATE = 0.02 // 2%

// ICBF (Colombian Family Welfare Institute) rate
export const ICBF_RATE = 0.03 // 3%

// Caja de Compensación Familiar rate
export const CAJA_RATE = 0.04 // 4%

/**
 * Total parafiscales rate for 100% salary scenario (excluding ARL which varies)
 * Health + Pension + SENA + ICBF + Caja = 8.5% + 12% + 2% + 3% + 4% = 29.5%
 * Plus ARL (0.522% to 6.960%) = 30.022% to 36.46%
 */
export const BASE_RATE_WITHOUT_ARL =
  HEALTH_RATE + PENSION_RATE + SENA_RATE + ICBF_RATE + CAJA_RATE // 29.5%
