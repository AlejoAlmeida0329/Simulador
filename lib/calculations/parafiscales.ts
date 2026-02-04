import {
  HEALTH_RATE,
  PENSION_RATE,
  ARL_RATES,
  SENA_RATE,
  ICBF_RATE,
  CAJA_RATE,
  ARLRiskLevel,
} from '@/lib/constants/parafiscales'
import { ParafiscalesBreakdown } from '@/types/calculations'

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

/**
 * Calculate all parafiscales contributions for a given salary base
 * Returns detailed breakdown by contribution type
 */
export function calculateTotalParafiscales(
  salaryBase: number,
  riskLevel: ARLRiskLevel
): ParafiscalesBreakdown {
  const health = calculateHealth(salaryBase)
  const pension = calculatePension(salaryBase)
  const arl = calculateARL(salaryBase, riskLevel)
  const sena = calculateSENA(salaryBase)
  const icbf = calculateICBF(salaryBase)
  const caja = calculateCajaCompensacion(salaryBase)

  return {
    health,
    pension,
    arl,
    sena,
    icbf,
    caja,
    total: health + pension + arl + sena + icbf + caja,
  }
}

/**
 * Calculate aggregate parafiscales for multiple employees
 */
export function calculateAggregateParafiscales(
  employees: Array<{ id: string; salario: number }>,
  salaryPercentage: number,
  riskLevel: ARLRiskLevel
): ParafiscalesBreakdown {
  let totalHealth = 0
  let totalPension = 0
  let totalARL = 0
  let totalSENA = 0
  let totalICBF = 0
  let totalCaja = 0

  employees.forEach((employee) => {
    // Calculate salary base (salary percentage of total compensation)
    const salaryBase = employee.salario * (salaryPercentage / 100)

    totalHealth += calculateHealth(salaryBase)
    totalPension += calculatePension(salaryBase)
    totalARL += calculateARL(salaryBase, riskLevel)
    totalSENA += calculateSENA(salaryBase)
    totalICBF += calculateICBF(salaryBase)
    totalCaja += calculateCajaCompensacion(salaryBase)
  })

  const total = totalHealth + totalPension + totalARL + totalSENA + totalICBF + totalCaja

  return {
    health: totalHealth,
    pension: totalPension,
    arl: totalARL,
    sena: totalSENA,
    icbf: totalICBF,
    caja: totalCaja,
    total,
  }
}
