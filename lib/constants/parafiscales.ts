/**
 * Colombian parafiscal contribution rates (2026)
 * These rates are applied to the salary base (not including bonuses)
 * Tasas vigentes — no cambian anualmente, se actualizan por ley
 */

import { SMMLV_2026 } from '@/lib/bonos/constants'

// ============================================
// REGIMEN DE EXONERACION (Art. 114-1 E.T.)
// ============================================

/**
 * Umbral de exoneración: 10 SMMLV
 * Empresas declarantes de renta (SAS, LTDA, S.A.) quedan exoneradas de:
 * - Salud empleador (8.5%)
 * - SENA (2%)
 * - ICBF (3%)
 * Para empleados con IBC < 10 SMMLV mensuales.
 * Art. 114-1 E.T., Ley 1607/2012, modificado por Ley 1819/2016.
 */
export const UMBRAL_EXONERACION_SMMLV = 10
export const UMBRAL_EXONERACION = SMMLV_2026 * UMBRAL_EXONERACION_SMMLV // $17,509,050

/**
 * Ley 1393 de 2010, Art. 30:
 * "Los pagos laborales no constitutivos de salario de los trabajadores
 * particulares no podrán ser superiores al 40% del total de la
 * remuneración."
 * Esto establece el piso legal para el split 60/40: mínimo el 60%
 * de la compensación total debe ser IBC.
 */
export const MAX_BONOS_NO_SALARIALES_PCT = 40
export const MIN_IBC_PCT = 60

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

// ============================================
// PRESTACIONES SOCIALES (employer cost)
// ============================================

// Prima de servicios: 1 mes por año = 30/360 = 8.33%
export const PRIMA_RATE = 30 / 360 // 0.0833

// Cesantías: 1 mes por año = 30/360 = 8.33%
export const CESANTIAS_RATE = 30 / 360 // 0.0833

// Intereses sobre cesantías: 12% anual sobre cesantías = 12% * 8.33% = 1%
export const INTERESES_CESANTIAS_RATE = 0.12 * CESANTIAS_RATE // 0.01

// Vacaciones: 15 días hábiles por año = 15/360 = 4.17%
export const VACACIONES_RATE = 15 / 360 // 0.0417

// ============================================
// SUBTOTALES POR CATEGORÍA
// ============================================

/**
 * Subtotal Seguridad Social (sin ARL, que varía por nivel de riesgo)
 * Salud 8.5% + Pensión 12% = 20.5%
 */
export const SEGURIDAD_SOCIAL_RATE_WITHOUT_ARL = HEALTH_RATE + PENSION_RATE // 20.5%

/**
 * Subtotal Parafiscales
 * SENA 2% + ICBF 3% + Caja 4% = 9%
 */
export const PARAFISCALES_RATE = SENA_RATE + ICBF_RATE + CAJA_RATE // 9%

/**
 * Subtotal Prestaciones Sociales
 * Prima 8.33% + Cesantías 8.33% + Intereses 1% + Vacaciones 4.17% = 21.83%
 */
export const PRESTACIONES_RATE =
  PRIMA_RATE + CESANTIAS_RATE + INTERESES_CESANTIAS_RATE + VACACIONES_RATE // 21.83%

/**
 * Total legacy rate (seguridad social + parafiscales, sin prestaciones ni ARL)
 * Health + Pension + SENA + ICBF + Caja = 8.5% + 12% + 2% + 3% + 4% = 29.5%
 * Plus ARL (0.522% to 6.960%) = 30.022% to 36.46%
 */
export const BASE_RATE_WITHOUT_ARL =
  HEALTH_RATE + PENSION_RATE + SENA_RATE + ICBF_RATE + CAJA_RATE // 29.5%

/**
 * Gran total (seguridad social + parafiscales + prestaciones, sin ARL)
 * 29.5% + 21.83% = 51.33%
 * Plus ARL (0.522% to 6.960%) = 51.85% to 58.29%
 */
export const GRAND_TOTAL_RATE_WITHOUT_ARL =
  BASE_RATE_WITHOUT_ARL + PRESTACIONES_RATE // 51.33%
