import { ARLRiskLevel } from '@/lib/constants/parafiscales'

export interface ParafiscalesBreakdown {
  health: number
  pension: number
  arl: number
  sena: number
  icbf: number
  caja: number
  total: number
}

export interface EmployeeParafiscales {
  employeeId: string
  salaryBase: number
  contributions: ParafiscalesBreakdown
}

export interface AggregateParafiscales {
  totalSalaryBase: number
  totalContributions: ParafiscalesBreakdown
  employeeContributions: EmployeeParafiscales[]
}
