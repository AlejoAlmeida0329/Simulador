import { Employee } from '@/types/employee'
import { ARLRiskLevel } from '@/lib/constants/parafiscales'
import { ScenarioResult, SavingsResult } from '@/types/scenarios'
import { calculateAggregateParafiscales } from './parafiscales'

/**
 * Calculate Traditional scenario (100% salary, no bonuses)
 */
export function calculateTraditionalScenario(
  employees: Employee[],
  arlRiskLevel: ARLRiskLevel
): ScenarioResult {
  const totalCompensation = employees.reduce((sum, emp) => sum + emp.salario, 0)

  const parafiscales = calculateAggregateParafiscales(
    employees,
    100, // 100% salary
    arlRiskLevel
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
  arlRiskLevel: ARLRiskLevel
): ScenarioResult {
  const totalCompensation = employees.reduce((sum, emp) => sum + emp.salario, 0)
  const bonusPercentage = 100 - salaryPercentage

  const totalSalaryBase = (totalCompensation * salaryPercentage) / 100
  const totalBonusAmount = (totalCompensation * bonusPercentage) / 100

  const parafiscales = calculateAggregateParafiscales(
    employees,
    salaryPercentage,
    arlRiskLevel
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
