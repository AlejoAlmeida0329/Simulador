import {
  HEALTH_RATE,
  PENSION_RATE,
  ARL_RATES,
  SENA_RATE,
  ICBF_RATE,
  CAJA_RATE,
  PRIMA_RATE,
  CESANTIAS_RATE,
  INTERESES_CESANTIAS_RATE,
  VACACIONES_RATE,
  UMBRAL_EXONERACION,
  ARLRiskLevel,
} from '@/lib/constants/parafiscales'
import { ParafiscalesBreakdown, ParafiscalesOptions } from '@/types/calculations'

// ============================================
// SEGURIDAD SOCIAL
// ============================================

/**
 * Calculate Health contribution (8.5% of salary base)
 */
export function calculateHealth(salaryBase: number): number {
  return salaryBase * HEALTH_RATE
}

/**
 * Calculate Pension contribution (12% of salary base)
 */
export function calculatePension(salaryBase: number): number {
  return salaryBase * PENSION_RATE
}

/**
 * Calculate ARL contribution (rate based on risk level)
 */
export function calculateARL(
  salaryBase: number,
  riskLevel: ARLRiskLevel
): number {
  return salaryBase * ARL_RATES[riskLevel]
}

// ============================================
// PARAFISCALES
// ============================================

/**
 * Calculate SENA contribution (2% of salary base)
 */
export function calculateSENA(salaryBase: number): number {
  return salaryBase * SENA_RATE
}

/**
 * Calculate ICBF contribution (3% of salary base)
 */
export function calculateICBF(salaryBase: number): number {
  return salaryBase * ICBF_RATE
}

/**
 * Calculate Caja de Compensación contribution (4% of salary base)
 */
export function calculateCajaCompensacion(salaryBase: number): number {
  return salaryBase * CAJA_RATE
}

// ============================================
// PRESTACIONES SOCIALES
// ============================================

/**
 * Calculate Prima de servicios (8.33% of salary base)
 */
export function calculatePrima(salaryBase: number): number {
  return salaryBase * PRIMA_RATE
}

/**
 * Calculate Cesantías (8.33% of salary base)
 */
export function calculateCesantias(salaryBase: number): number {
  return salaryBase * CESANTIAS_RATE
}

/**
 * Calculate Intereses sobre cesantías (1% of salary base)
 */
export function calculateInteresesCesantias(salaryBase: number): number {
  return salaryBase * INTERESES_CESANTIAS_RATE
}

/**
 * Calculate Vacaciones (4.17% of salary base)
 */
export function calculateVacaciones(salaryBase: number): number {
  return salaryBase * VACACIONES_RATE
}

// ============================================
// CÁLCULO COMPLETO
// ============================================

/**
 * Calculate all contributions for a given salary base
 * Returns detailed breakdown by category: Seguridad Social, Parafiscales, Prestaciones
 *
 * When regimen is 'exonerado' and salaryBase < UMBRAL_EXONERACION (10 SMMLV):
 * - Health (8.5%), SENA (2%), ICBF (3%) are set to 0
 * - Pension, ARL, Caja, and Prestaciones remain unchanged
 * Art. 114-1 E.T., Ley 1607/2012
 */
export function calculateTotalParafiscales(
  salaryBase: number,
  riskLevel: ARLRiskLevel,
  options?: ParafiscalesOptions
): ParafiscalesBreakdown {
  const regimen = options?.regimen || 'general'
  const isExonerado = regimen === 'exonerado' && salaryBase < UMBRAL_EXONERACION

  // Seguridad Social
  const health = isExonerado ? 0 : calculateHealth(salaryBase)
  const pension = calculatePension(salaryBase)
  const arl = calculateARL(salaryBase, riskLevel)

  // Parafiscales
  const sena = isExonerado ? 0 : calculateSENA(salaryBase)
  const icbf = isExonerado ? 0 : calculateICBF(salaryBase)
  const caja = calculateCajaCompensacion(salaryBase)

  // Prestaciones Sociales
  const prima = calculatePrima(salaryBase)
  const cesantias = calculateCesantias(salaryBase)
  const interesesCesantias = calculateInteresesCesantias(salaryBase)
  const vacaciones = calculateVacaciones(salaryBase)

  // Subtotales
  const subtotalSeguridadSocial = health + pension + arl
  const subtotalParafiscales = sena + icbf + caja
  const subtotalPrestaciones = prima + cesantias + interesesCesantias + vacaciones

  // Total legacy (SS + Parafiscales, sin prestaciones) — backward compatible v1
  const total = subtotalSeguridadSocial + subtotalParafiscales

  // Gran total incluyendo prestaciones
  const grandTotal = total + subtotalPrestaciones

  return {
    health,
    pension,
    arl,
    sena,
    icbf,
    caja,
    prima,
    cesantias,
    interesesCesantias,
    vacaciones,
    subtotalSeguridadSocial,
    subtotalParafiscales,
    subtotalPrestaciones,
    total,
    grandTotal,
  }
}

/**
 * Calculate aggregate contributions for multiple employees
 * Exemption is evaluated per-employee: each employee's salaryBase is checked
 * against UMBRAL_EXONERACION individually.
 */
export function calculateAggregateParafiscales(
  employees: Array<{ id: string; salario: number }>,
  salaryPercentage: number,
  riskLevel: ARLRiskLevel,
  options?: ParafiscalesOptions
): ParafiscalesBreakdown {
  let totalHealth = 0
  let totalPension = 0
  let totalARL = 0
  let totalSENA = 0
  let totalICBF = 0
  let totalCaja = 0
  let totalPrima = 0
  let totalCesantias = 0
  let totalInteresesCesantias = 0
  let totalVacaciones = 0

  const regimen = options?.regimen || 'general'

  employees.forEach((employee) => {
    const salaryBase = employee.salario * (salaryPercentage / 100)
    const isExonerado = regimen === 'exonerado' && salaryBase < UMBRAL_EXONERACION

    // Seguridad Social
    totalHealth += isExonerado ? 0 : calculateHealth(salaryBase)
    totalPension += calculatePension(salaryBase)
    totalARL += calculateARL(salaryBase, riskLevel)

    // Parafiscales
    totalSENA += isExonerado ? 0 : calculateSENA(salaryBase)
    totalICBF += isExonerado ? 0 : calculateICBF(salaryBase)
    totalCaja += calculateCajaCompensacion(salaryBase)

    // Prestaciones Sociales
    totalPrima += calculatePrima(salaryBase)
    totalCesantias += calculateCesantias(salaryBase)
    totalInteresesCesantias += calculateInteresesCesantias(salaryBase)
    totalVacaciones += calculateVacaciones(salaryBase)
  })

  const subtotalSeguridadSocial = totalHealth + totalPension + totalARL
  const subtotalParafiscales = totalSENA + totalICBF + totalCaja
  const subtotalPrestaciones = totalPrima + totalCesantias + totalInteresesCesantias + totalVacaciones

  // Total legacy (SS + Parafiscales) — backward compatible v1
  const total = subtotalSeguridadSocial + subtotalParafiscales

  // Gran total incluyendo prestaciones
  const grandTotal = total + subtotalPrestaciones

  return {
    health: totalHealth,
    pension: totalPension,
    arl: totalARL,
    sena: totalSENA,
    icbf: totalICBF,
    caja: totalCaja,
    prima: totalPrima,
    cesantias: totalCesantias,
    interesesCesantias: totalInteresesCesantias,
    vacaciones: totalVacaciones,
    subtotalSeguridadSocial,
    subtotalParafiscales,
    subtotalPrestaciones,
    total,
    grandTotal,
  }
}
