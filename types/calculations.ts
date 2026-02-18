import { ARLRiskLevel } from '@/lib/constants/parafiscales'
import type { RegimenParafiscales } from '@/lib/bonos/types'

/**
 * Options for parafiscales calculations
 */
export interface ParafiscalesOptions {
  regimen?: RegimenParafiscales
}

export interface ParafiscalesBreakdown {
  // Seguridad Social (aporte empleador)
  health: number      // Salud: 8.5%
  pension: number     // Pensión: 12%
  arl: number         // ARL: 0.522% - 6.960%

  // Parafiscales
  sena: number        // SENA: 2%
  icbf: number        // ICBF: 3%
  caja: number        // Caja Compensación: 4%

  // Prestaciones Sociales
  prima: number              // Prima de servicios: 8.33%
  cesantias: number          // Cesantías: 8.33%
  interesesCesantias: number // Intereses sobre cesantías: 1%
  vacaciones: number         // Vacaciones: 4.17%

  // Subtotales por categoría
  subtotalSeguridadSocial: number  // health + pension + arl
  subtotalParafiscales: number     // sena + icbf + caja
  subtotalPrestaciones: number     // prima + cesantias + interesesCesantias + vacaciones

  // Total legacy (seguridad social + parafiscales, sin prestaciones) — backward compatible v1
  total: number

  // Total completo incluyendo prestaciones
  grandTotal: number
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
