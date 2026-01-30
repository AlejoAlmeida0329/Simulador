'use client'

import { useState, useCallback } from 'react'

const MIN_SALARY_PERCENTAGE = 60
const MAX_SALARY_PERCENTAGE = 100

export function useSalaryBonusSplit() {
  const [salaryPercentage, setSalaryPercentage] = useState(70)

  const updateSalaryPercentage = useCallback((value: number) => {
    // Clamp value between min and max
    const clamped = Math.max(
      MIN_SALARY_PERCENTAGE,
      Math.min(MAX_SALARY_PERCENTAGE, value)
    )
    setSalaryPercentage(clamped)
  }, [])

  const bonusPercentage = 100 - salaryPercentage

  return {
    salaryPercentage,
    bonusPercentage,
    updateSalaryPercentage,
    minSalaryPercentage: MIN_SALARY_PERCENTAGE,
    maxSalaryPercentage: MAX_SALARY_PERCENTAGE,
  }
}
