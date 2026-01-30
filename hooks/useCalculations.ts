'use client'

import { useMemo } from 'react'
import { Employee } from '@/types/employee'
import { ARLRiskLevel } from '@/lib/constants/parafiscales'
import { ParafiscalesBreakdown } from '@/types/calculations'
import { calculateAggregateParafiscales } from '@/lib/calculations/parafiscales'

export function useCalculations(
  employees: Employee[],
  salaryPercentage: number,
  arlRiskLevel: ARLRiskLevel
) {
  // Memoize calculations to avoid unnecessary recalculations
  const calculations = useMemo(() => {
    if (employees.length === 0) {
      const empty: ParafiscalesBreakdown = {
        health: 0,
        pension: 0,
        arl: 0,
        sena: 0,
        icbf: 0,
        caja: 0,
        total: 0,
      }
      return empty
    }

    return calculateAggregateParafiscales(
      employees,
      salaryPercentage,
      arlRiskLevel
    )
  }, [employees, salaryPercentage, arlRiskLevel])

  return calculations
}
