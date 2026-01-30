'use client'

import { useState, useMemo } from 'react'
import { useEmployees } from '@/hooks/useEmployees'
import { useSalaryBonusSplit } from '@/hooks/useSalaryBonusSplit'
import { EmployeeForm } from '@/components/EmployeeForm'
import { EmployeeListGrouped } from '@/components/EmployeeListGrouped'
import { SalaryBonusSlider } from '@/components/SalaryBonusSlider'
import { ARLRiskSelector } from '@/components/ARLRiskSelector'
import { ComparisonView } from '@/components/ComparisonView'
import { SavingsMetrics } from '@/components/SavingsMetrics'
import { CompanyDataModal } from '@/components/CompanyDataModal'
import { TikinCostCard } from '@/components/TikinCostCard'
import { DownloadQuotationButton } from '@/components/DownloadQuotationButton'
import { ARLRiskLevel } from '@/lib/constants/parafiscales'
import { CompanyData } from '@/types/company'
import {
  calculateTraditionalScenario,
  calculateTikinScenario,
  calculateSavings,
} from '@/lib/calculations/scenarios'
import { calculateTikinCommission } from '@/lib/calculations/tikin-commission'

export default function Home() {
  const {
    employees,
    addEmployee,
    addEmployeesBulk,
    removeEmployeeGroup,
    totalSalary,
  } = useEmployees()

  const {
    salaryPercentage,
    bonusPercentage,
    updateSalaryPercentage,
    minSalaryPercentage,
    maxSalaryPercentage,
  } = useSalaryBonusSplit()

  const [arlRiskLevel, setArlRiskLevel] = useState<ARLRiskLevel>('III')
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)

  const handleCompanyDataSubmit = (data: CompanyData) => {
    setCompanyData(data)
    setIsModalOpen(false)
  }

  // Calculate scenarios
  const savingsData = useMemo(() => {
    if (employees.length === 0) return null

    const traditional = calculateTraditionalScenario(employees, arlRiskLevel)
    const tikin = calculateTikinScenario(employees, salaryPercentage, arlRiskLevel)
    return calculateSavings(traditional, tikin)
  }, [employees, salaryPercentage, arlRiskLevel])

  // Calculate Tikin commission
  const tikinCommission = useMemo(() => {
    if (!savingsData) return null
    return calculateTikinCommission(savingsData.tikin.totalBonusAmount)
  }, [savingsData])

  return (
    <>
      <CompanyDataModal isOpen={isModalOpen} onSubmit={handleCompanyDataSubmit} />

      <div className="space-y-6">
      {/* 1. Employee Parametrization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <EmployeeForm
            onAdd={(data) => {
              const result = addEmployee(data)
              if (!result.success) {
                alert('Error al agregar empleado: ' + result.error?.message)
              }
            }}
            onAddBulk={(data) => {
              const result = addEmployeesBulk(data.salary, data.count)
              if (!result.success) {
                alert('Error al agregar empleados: ' + result.error?.message)
              }
            }}
          />
        </div>

        <div className="lg:col-span-2">
          <EmployeeListGrouped
            employees={employees}
            totalSalary={totalSalary}
            onRemoveGroup={removeEmployeeGroup}
          />
        </div>
      </div>

      {/* 2. Configuration Controls */}
      {employees.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalaryBonusSlider
            salaryPercentage={salaryPercentage}
            onSalaryPercentageChange={updateSalaryPercentage}
            totalCompensation={totalSalary}
            minPercentage={minSalaryPercentage}
            maxPercentage={maxSalaryPercentage}
          />

          <ARLRiskSelector
            selectedLevel={arlRiskLevel}
            onLevelChange={setArlRiskLevel}
          />
        </div>
      )}

      {/* 3. Scenario Comparison */}
      {employees.length > 0 && savingsData && (
        <ComparisonView savingsData={savingsData} arlRiskLevel={arlRiskLevel} />
      )}

      {/* 4. Savings Metrics */}
      {employees.length > 0 && savingsData && (
        <SavingsMetrics savingsData={savingsData} />
      )}

      {/* 5. Tikin Cost */}
      {employees.length > 0 && tikinCommission && (
        <TikinCostCard commission={tikinCommission} />
      )}

      {/* 6. Download Quotation */}
      {employees.length > 0 && savingsData && tikinCommission && companyData && (
        <DownloadQuotationButton
          companyData={companyData}
          savingsData={savingsData}
          tikinCommission={tikinCommission}
          arlRiskLevel={arlRiskLevel}
          employeeCount={employees.length}
          totalPayroll={totalSalary}
        />
      )}
      </div>
    </>
  )
}
