'use client'

import { useState, useMemo } from 'react'
import { BonusTypeSelector } from '@/components/bonuses/BonusTypeSelector'
import { BonusCompanyDataForm } from '@/components/bonuses/BonusCompanyDataForm'
import { EmployeeLoader } from '@/components/bonuses/EmployeeLoader'
import { SalaryBonusSlider } from '@/components/SalaryBonusSlider'
import { ARLRiskSelector } from '@/components/ARLRiskSelector'
import { ComparisonView } from '@/components/ComparisonView'
import { SavingsMetrics } from '@/components/SavingsMetrics'
import { TikinCostCard } from '@/components/TikinCostCard'
import { DownloadQuotationButton } from '@/components/DownloadQuotationButton'
import { BonusType, BonusCompanyData, Employee, EmployeeBatch } from '@/types/bonuses'
import { ARLRiskLevel } from '@/lib/constants/parafiscales'
import {
  calculateTraditionalScenario,
  calculateTikinScenario,
  calculateSavings,
} from '@/lib/calculations/scenarios'
import { calculateTikinCommission } from '@/lib/calculations/tikin-commission'

interface BonusFlowState {
  tipoSeleccionado?: BonusType
  companyData?: BonusCompanyData
  empleados: Employee[]
  lotes: EmployeeBatch[]
  totalEmpleados: number
  pasoActual: number
  salaryPercentage: number
  arlRiskLevel: ARLRiskLevel
}

export default function BonosPage() {
  const [flowState, setFlowState] = useState<BonusFlowState>({
    empleados: [],
    lotes: [],
    totalEmpleados: 0,
    pasoActual: 1,
    salaryPercentage: 70, // Starts at 70% (30% bonus)
    arlRiskLevel: 'III'
  })

  // Calculate total salary from employees
  const totalSalary = useMemo(() => {
    return flowState.empleados.reduce((sum, emp) => sum + emp.salario, 0)
  }, [flowState.empleados])

  // Calculate bonus percentage
  const bonusPercentage = 100 - flowState.salaryPercentage

  // Calculate scenarios
  const savingsData = useMemo(() => {
    if (flowState.empleados.length === 0) return null

    // Convert bonus employees to calculation format
    const calculationEmployees = flowState.empleados.map(emp => ({
      id: emp.id,
      salary: emp.salario,
      name: emp.nombre
    }))

    const traditional = calculateTraditionalScenario(calculationEmployees, flowState.arlRiskLevel)
    const tikin = calculateTikinScenario(calculationEmployees, flowState.salaryPercentage, flowState.arlRiskLevel)
    return calculateSavings(traditional, tikin)
  }, [flowState.empleados, flowState.salaryPercentage, flowState.arlRiskLevel])

  // Calculate Tikin commission
  const tikinCommission = useMemo(() => {
    if (!savingsData) return null
    return calculateTikinCommission(savingsData.tikin.totalBonusAmount)
  }, [savingsData])

  const handleTipoSeleccionado = (tipo: BonusType) => {
    setFlowState(prev => ({
      ...prev,
      tipoSeleccionado: tipo,
      pasoActual: 2
    }))
  }

  const handleCompanyDataSubmit = (data: BonusCompanyData) => {
    setFlowState(prev => ({
      ...prev,
      companyData: data,
      pasoActual: 3
    }))
  }

  const handleBackToPaso = (paso: number) => {
    setFlowState(prev => ({
      ...prev,
      pasoActual: paso
    }))
  }

  const handleEmpleadosChange = (empleados: Employee[], lotes: EmployeeBatch[]) => {
    setFlowState(prev => ({
      ...prev,
      empleados,
      lotes,
      totalEmpleados: empleados.length
    }))
  }

  const handleContinueFromStep3 = () => {
    setFlowState(prev => ({
      ...prev,
      pasoActual: 4
    }))
  }

  const handleSalaryPercentageChange = (percentage: number) => {
    setFlowState(prev => ({
      ...prev,
      salaryPercentage: percentage
    }))
  }

  const handleARLRiskChange = (level: ARLRiskLevel) => {
    setFlowState(prev => ({
      ...prev,
      arlRiskLevel: level
    }))
  }

  const handleContinueToSummary = () => {
    setFlowState(prev => ({
      ...prev,
      pasoActual: 5
    }))
  }

  const minSalaryPercentage = 60
  const maxSalaryPercentage = 90

  return (
    <div className="space-y-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3, 4, 5].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${
                    step === flowState.pasoActual
                      ? 'bg-tikin-red text-white border-tikin-red'
                      : step < flowState.pasoActual
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-400 border-gray-300'
                  }`}
                >
                  {step < flowState.pasoActual ? '✓' : step}
                </div>
                {index < 4 && (
                  <div
                    className={`h-1 w-16 mx-2 ${
                      step < flowState.pasoActual ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-3 text-sm text-gray-600">
            <span className="font-medium">
              {flowState.pasoActual === 1 && 'Tipo de Bono'}
              {flowState.pasoActual === 2 && 'Información de Empresa'}
              {flowState.pasoActual === 3 && 'Agregar Empleados'}
              {flowState.pasoActual === 4 && 'Distribución'}
              {flowState.pasoActual === 5 && 'Resumen y Confirmación'}
            </span>
          </div>
        </div>

        {/* Paso Actual */}
        {flowState.pasoActual === 1 && (
          <BonusTypeSelector onSelect={handleTipoSeleccionado} />
        )}

        {flowState.pasoActual === 2 && (
          <BonusCompanyDataForm
            onSubmit={handleCompanyDataSubmit}
            onBack={() => handleBackToPaso(1)}
            initialData={flowState.companyData}
          />
        )}

        {flowState.pasoActual === 3 && (
          <EmployeeLoader
            empleados={flowState.empleados}
            lotes={flowState.lotes}
            onEmpleadosChange={handleEmpleadosChange}
            onContinue={handleContinueFromStep3}
            onBack={() => handleBackToPaso(2)}
          />
        )}

        {flowState.pasoActual === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Configuración del Bono
              </h2>
              <p className="text-gray-600">
                Define la estructura de compensación (salario base vs bonos) y nivel de riesgo ARL
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SalaryBonusSlider
                salaryPercentage={flowState.salaryPercentage}
                onSalaryPercentageChange={handleSalaryPercentageChange}
                totalCompensation={totalSalary}
                minPercentage={minSalaryPercentage}
                maxPercentage={maxSalaryPercentage}
              />

              <ARLRiskSelector
                selectedLevel={flowState.arlRiskLevel}
                onLevelChange={handleARLRiskChange}
              />
            </div>

            {savingsData && (
              <ComparisonView savingsData={savingsData} arlRiskLevel={flowState.arlRiskLevel} />
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => handleBackToPaso(3)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                ← Volver
              </button>
              <button
                onClick={handleContinueToSummary}
                className="flex-1 px-6 py-3 bg-tikin-red text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {flowState.pasoActual === 5 && savingsData && tikinCommission && flowState.companyData && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Resumen de Ahorro
              </h2>
              <p className="text-gray-600">
                Revisa el ahorro en parafiscales y confirma tu propuesta
              </p>
            </div>

            <SavingsMetrics savingsData={savingsData} />

            <TikinCostCard commission={tikinCommission} />

            <DownloadQuotationButton
              companyData={flowState.companyData}
              savingsData={savingsData}
              tikinCommission={tikinCommission}
              arlRiskLevel={flowState.arlRiskLevel}
              employeeCount={flowState.empleados.length}
              totalPayroll={totalSalary}
            />

            <div className="flex gap-4">
              <button
                onClick={() => handleBackToPaso(4)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                ← Volver
              </button>
            </div>
          </div>
        )}
    </div>
  )
}
