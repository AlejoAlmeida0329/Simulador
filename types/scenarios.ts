import { ParafiscalesBreakdown } from './calculations'

export interface ScenarioResult {
  label: string
  salaryPercentage: number
  bonusPercentage: number
  totalSalaryBase: number
  totalBonusAmount: number
  parafiscales: ParafiscalesBreakdown
}

export interface SavingsResult {
  monthlySavings: number
  percentageReduction: number
  traditional: ScenarioResult
  tikin: ScenarioResult
}
