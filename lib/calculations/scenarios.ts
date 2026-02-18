import { Employee } from '@/types/employee'
import { ARLRiskLevel } from '@/lib/constants/parafiscales'
import { ScenarioResult, SavingsResult } from '@/types/scenarios'
import { ParafiscalesOptions } from '@/types/calculations'
import { calculateAggregateParafiscales } from './parafiscales'

/**
 * Calculate Traditional scenario (100% salary, no bonuses)
 */
export function calculateTraditionalScenario(
  employees: Employee[],
  arlRiskLevel: ARLRiskLevel,
  options?: ParafiscalesOptions
): ScenarioResult {
  const totalCompensation = employees.reduce((sum, emp) => sum + emp.salario, 0)

  const parafiscales = calculateAggregateParafiscales(
    employees,
    100, // 100% salary
    arlRiskLevel,
    options
  )

  return {
    label: 'Tradicional',
    salaryPercentage: 100,
    bonusPercentage: 0,
    totalSalaryBase: totalCompensation,
    totalBonusAmount: 0,
    parafiscales,
  }
}

/**
 * Calculate Tikin scenario (optimized salary/bonus split)
 */
export function calculateTikinScenario(
  employees: Employee[],
  salaryPercentage: number,
  arlRiskLevel: ARLRiskLevel,
  options?: ParafiscalesOptions
): ScenarioResult {
  const totalCompensation = employees.reduce((sum, emp) => sum + emp.salario, 0)
  const bonusPercentage = 100 - salaryPercentage

  const totalSalaryBase = (totalCompensation * salaryPercentage) / 100
  const totalBonusAmount = (totalCompensation * bonusPercentage) / 100

  const parafiscales = calculateAggregateParafiscales(
    employees,
    salaryPercentage,
    arlRiskLevel,
    options
  )

  return {
    label: 'Tikin',
    salaryPercentage,
    bonusPercentage,
    totalSalaryBase,
    totalBonusAmount,
    parafiscales,
  }
}

/**
 * Calculate savings between Traditional and Tikin scenarios
 * Uses legacy `total` (SS + Parafiscales) for backward compatibility with v1
 */
export function calculateSavings(
  traditional: ScenarioResult,
  tikin: ScenarioResult
): SavingsResult {
  const monthlySavings = traditional.parafiscales.total - tikin.parafiscales.total

  const percentageReduction =
    traditional.parafiscales.total > 0
      ? (monthlySavings / traditional.parafiscales.total) * 100
      : 0

  return {
    monthlySavings,
    percentageReduction,
    traditional,
    tikin,
  }
}

/**
 * Calculate full savings including Prestaciones Sociales
 * Uses `grandTotal` (SS + Parafiscales + Prestaciones)
 */
export function calculateFullSavings(
  traditional: ScenarioResult,
  tikin: ScenarioResult
): SavingsResult & {
  monthlySavingsGrand: number
  percentageReductionGrand: number
  savingsSeguridadSocial: number
  savingsParafiscales: number
  savingsPrestaciones: number
} {
  // Ahorro por categoría
  const savingsSeguridadSocial =
    traditional.parafiscales.subtotalSeguridadSocial - tikin.parafiscales.subtotalSeguridadSocial
  const savingsParafiscales =
    traditional.parafiscales.subtotalParafiscales - tikin.parafiscales.subtotalParafiscales
  const savingsPrestaciones =
    traditional.parafiscales.subtotalPrestaciones - tikin.parafiscales.subtotalPrestaciones

  // Total incluyendo prestaciones
  const monthlySavingsGrand = traditional.parafiscales.grandTotal - tikin.parafiscales.grandTotal

  const percentageReductionGrand =
    traditional.parafiscales.grandTotal > 0
      ? (monthlySavingsGrand / traditional.parafiscales.grandTotal) * 100
      : 0

  // Legacy total (backward compat)
  const monthlySavings = traditional.parafiscales.total - tikin.parafiscales.total
  const percentageReduction =
    traditional.parafiscales.total > 0
      ? (monthlySavings / traditional.parafiscales.total) * 100
      : 0

  return {
    monthlySavings,
    percentageReduction,
    traditional,
    tikin,
    monthlySavingsGrand,
    percentageReductionGrand,
    savingsSeguridadSocial,
    savingsParafiscales,
    savingsPrestaciones,
  }
}
