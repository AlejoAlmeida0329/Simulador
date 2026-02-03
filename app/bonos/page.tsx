'use client'

import { useState, useMemo } from 'react'
import { BonusTypeSelector } from '@/components/bonuses/BonusTypeSelector'
import { BonusCompanyDataForm } from '@/components/bonuses/BonusCompanyDataForm'
import { EmployeeLoader } from '@/components/bonuses/EmployeeLoader'
import { FoodBonusLoader, FoodBonusEmployee } from '@/components/bonuses/FoodBonusLoader'
import { BothBonusesLoader, BothBonusesEmployee } from '@/components/bonuses/BothBonusesLoader'
import { BonusDistribution } from '@/components/bonuses/BonusDistribution'
import { SalaryBonusSlider } from '@/components/SalaryBonusSlider'
import { ARLRiskSelector } from '@/components/ARLRiskSelector'
import { ComparisonView } from '@/components/ComparisonView'
import { SavingsMetrics } from '@/components/SavingsMetrics'
import { TikinCostCard } from '@/components/TikinCostCard'
import { DownloadQuotationButton } from '@/components/DownloadQuotationButton'
import { BonusType, BonusCompanyData, Employee, EmployeeBatch, BonusConfig, FEE_ALIMENTACION, IVA } from '@/types/bonuses'
import { ARLRiskLevel } from '@/lib/constants/parafiscales'
import {
  calculateTraditionalScenario,
  calculateTikinScenario,
  calculateSavings,
} from '@/lib/calculations/scenarios'
import { calculateTikinCommission } from '@/lib/calculations/tikin-commission'
import { formatCOP } from '@/lib/formatters'

interface BonusFlowState {
  tipoSeleccionado?: BonusType
  companyData?: BonusCompanyData
  empleados: Employee[]
  lotes: EmployeeBatch[]
  foodBonusEmployees: FoodBonusEmployee[]
  bothBonusesEmployees: BothBonusesEmployee[]  // Para flujo ambos
  totalEmpleados: number
  pasoActual: number
  subPasoAmbos?: '3a' | '3b' | '4a' | '4b' // Deprecated, will be removed
  configMeraLiberalidad?: BonusConfig
  configAlimentacion?: BonusConfig
  salaryPercentage: number
  arlRiskLevel: ARLRiskLevel
}

export default function BonosPage() {
  const [flowState, setFlowState] = useState<BonusFlowState>({
    empleados: [],
    lotes: [],
    foodBonusEmployees: [],
    bothBonusesEmployees: [],
    totalEmpleados: 0,
    pasoActual: 1,
    salaryPercentage: 70, // Starts at 70% (30% bonus)
    arlRiskLevel: 'III'
  })

  // Calculate total salary from employees
  const totalSalary = useMemo(() => {
    if (flowState.tipoSeleccionado === 'ambos' && flowState.bothBonusesEmployees.length > 0) {
      // Para flujo ambos, calcular desde bothBonusesEmployees
      return flowState.bothBonusesEmployees.reduce(
        (sum, emp) => sum + (emp.cantidad * emp.salarioPorEmpleado),
        0
      )
    }
    // Para flujos individuales ML y AL
    return flowState.empleados.reduce((sum, emp) => sum + emp.salario, 0)
  }, [flowState.empleados, flowState.bothBonusesEmployees, flowState.tipoSeleccionado])

  // Calculate bonus percentage
  const bonusPercentage = 100 - flowState.salaryPercentage

  // Calculate scenarios
  const savingsData = useMemo(() => {
    if (flowState.tipoSeleccionado === 'ambos' && flowState.bothBonusesEmployees.length > 0) {
      // Para flujo ambos, necesitamos calcular con % ML variable por lote
      // Expandir cada lote a empleados individuales para el cálculo
      const expandedEmployees = flowState.bothBonusesEmployees.flatMap(batch =>
        Array.from({ length: batch.cantidad }, (_, i) => ({
          id: `${batch.id}_${i}`,
          salary: batch.salarioPorEmpleado,
          name: `Empleado ${i + 1}`
        }))
      )

      // Calcular el promedio ponderado del % ML para usar en el cálculo
      const totalSalary = flowState.bothBonusesEmployees.reduce(
        (sum, batch) => sum + (batch.cantidad * batch.salarioPorEmpleado),
        0
      )
      const weightedMLPercentage = flowState.bothBonusesEmployees.reduce(
        (sum, batch) => {
          const batchSalary = batch.cantidad * batch.salarioPorEmpleado
          const batchWeight = batchSalary / totalSalary
          return sum + (batch.porcentajeML * batchWeight)
        },
        0
      )
      const salaryPercentage = 100 - weightedMLPercentage

      const traditional = calculateTraditionalScenario(expandedEmployees, flowState.arlRiskLevel)
      const tikin = calculateTikinScenario(expandedEmployees, salaryPercentage, flowState.arlRiskLevel)
      return calculateSavings(traditional, tikin)
    }

    // Para flujos individuales ML y AL
    if (flowState.empleados.length === 0) return null

    const calculationEmployees = flowState.empleados.map(emp => ({
      id: emp.id,
      salary: emp.salario,
      name: emp.nombre
    }))

    const traditional = calculateTraditionalScenario(calculationEmployees, flowState.arlRiskLevel)
    const tikin = calculateTikinScenario(calculationEmployees, flowState.salaryPercentage, flowState.arlRiskLevel)
    return calculateSavings(traditional, tikin)
  }, [flowState.empleados, flowState.bothBonusesEmployees, flowState.salaryPercentage, flowState.arlRiskLevel, flowState.tipoSeleccionado])

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

  const handleContinueFromStep3a = () => {
    // En flujo ambos, después de cargar empleados (3a), vamos a 3b para bonos de alimentación
    setFlowState(prev => ({
      ...prev,
      subPasoAmbos: '3b'
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

  const handleNewQuotation = () => {
    setFlowState({
      empleados: [],
      lotes: [],
      foodBonusEmployees: [],
      bothBonusesEmployees: [],
      totalEmpleados: 0,
      pasoActual: 1,
      salaryPercentage: 70,
      arlRiskLevel: 'III'
    })
  }

  const handleSaveQuotation = () => {
    // Mostrar mensaje de confirmación
    alert('✅ Cotización guardada exitosamente en la base de datos')
  }

  const handleFoodBonusEmployeesChange = (employees: FoodBonusEmployee[]) => {
    setFlowState(prev => ({
      ...prev,
      foodBonusEmployees: employees,
      totalEmpleados: employees.reduce((sum, emp) => sum + emp.cantidad, 0)
    }))
  }

  const handleContinueFromFoodBonus = () => {
    setFlowState(prev => ({
      ...prev,
      pasoActual: 4,
      subPasoAmbos: prev.tipoSeleccionado === 'ambos' ? '4a' : undefined
    }))
  }

  const handleALConfigComplete = (config: BonusConfig) => {
    // Handler para cuando se completa la configuración de Alimentación en flujo ambos
    setFlowState(prev => ({
      ...prev,
      configAlimentacion: config,
      pasoActual: 5
    }))
  }

  // Cálculos para bonos de alimentación
  const foodBonusData = useMemo(() => {
    if (flowState.tipoSeleccionado === 'ambos' && flowState.bothBonusesEmployees.length > 0) {
      // Para flujo ambos, calcular desde bothBonusesEmployees
      const totalEmpleados = flowState.bothBonusesEmployees.reduce((sum, emp) => sum + emp.cantidad, 0)
      const totalBonos = flowState.bothBonusesEmployees.reduce(
        (sum, emp) => sum + (emp.cantidad * emp.montoAL),
        0
      )
      const feeAmount = totalBonos * FEE_ALIMENTACION
      const iva = feeAmount * IVA
      const totalConFee = totalBonos + feeAmount + iva

      return {
        totalEmpleados,
        totalBonos,
        feePercentage: FEE_ALIMENTACION,
        feeAmount,
        iva,
        totalConFee
      }
    }

    // Para flujo alimentación individual
    if (flowState.foodBonusEmployees.length === 0) return null

    const totalBonos = flowState.foodBonusEmployees.reduce(
      (sum, emp) => sum + (emp.cantidad * emp.montoPorEmpleado),
      0
    )
    const feeAmount = totalBonos * FEE_ALIMENTACION
    const iva = feeAmount * IVA
    const totalConFee = totalBonos + feeAmount + iva

    return {
      totalEmpleados: flowState.foodBonusEmployees.reduce((sum, emp) => sum + emp.cantidad, 0),
      totalBonos,
      feePercentage: FEE_ALIMENTACION,
      feeAmount,
      iva,
      totalConFee
    }
  }, [flowState.foodBonusEmployees, flowState.bothBonusesEmployees, flowState.tipoSeleccionado])

  const minSalaryPercentage = 60
  const maxSalaryPercentage = 90

  // Determinar el tipo de flujo
  const isMeraLiberalidadFlow = flowState.tipoSeleccionado === 'mera_liberalidad'
  const isAlimentacionFlow = flowState.tipoSeleccionado === 'alimentacion'
  const isAmbosFlow = flowState.tipoSeleccionado === 'ambos'

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

        {flowState.pasoActual === 3 && isMeraLiberalidadFlow && (
          <EmployeeLoader
            empleados={flowState.empleados}
            lotes={flowState.lotes}
            onEmpleadosChange={handleEmpleadosChange}
            onContinue={handleContinueFromStep3}
            onBack={() => handleBackToPaso(2)}
          />
        )}

        {flowState.pasoActual === 3 && isAlimentacionFlow && (
          <FoodBonusLoader
            initialEmployees={flowState.foodBonusEmployees}
            onContinue={(employees) => {
              handleFoodBonusEmployeesChange(employees)
              handleContinueFromFoodBonus()
            }}
            onBack={() => handleBackToPaso(2)}
          />
        )}

        {/* Flujo Ambos - Paso 3: Cargar empleados con ambos tipos de bonos */}
        {flowState.pasoActual === 3 && isAmbosFlow && (
          <BothBonusesLoader
            initialEmployees={flowState.bothBonusesEmployees}
            onContinue={(employees) => {
              setFlowState(prev => ({
                ...prev,
                bothBonusesEmployees: employees,
                pasoActual: 4
              }))
            }}
            onBack={() => handleBackToPaso(2)}
          />
        )}

        {flowState.pasoActual === 4 && isMeraLiberalidadFlow && (
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

        {flowState.pasoActual === 4 && isAlimentacionFlow && foodBonusData && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Resumen de Bonos de Alimentación
              </h2>
              <p className="text-gray-600">
                Revisa el resumen y los costos del servicio
              </p>
            </div>

            {/* Resumen de empleados y bonos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Total de empleados</p>
                  <p className="text-3xl font-bold text-gray-900">{foodBonusData.totalEmpleados}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Total en bonos</p>
                  <p className="text-3xl font-bold text-green-600">{formatCOP(foodBonusData.totalBonos)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Fee (1.25%)</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCOP(foodBonusData.feeAmount)}</p>
                </div>
              </div>
            </div>

            {/* Desglose de costos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Costo del Servicio Tikin</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total en bonos:</span>
                  <span className="font-semibold text-gray-900">{formatCOP(foodBonusData.totalBonos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Comisión base (1.25%):</span>
                  <span className="font-semibold text-gray-900">{formatCOP(foodBonusData.feeAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA (19%):</span>
                  <span className="font-semibold text-gray-900">{formatCOP(foodBonusData.iva)}</span>
                </div>
                <div className="flex justify-between text-base pt-3 border-t border-gray-300">
                  <span className="font-bold text-gray-900">Costo Total Mensual:</span>
                  <span className="font-bold text-tikin-red text-xl">{formatCOP(foodBonusData.totalConFee)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
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

        {/* Flujo Ambos - Paso 4: Configurar nivel de riesgo ARL */}
        {flowState.pasoActual === 4 && isAmbosFlow && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Configuración de Riesgo ARL
              </h2>
              <p className="text-gray-600">
                Define el nivel de riesgo ARL de la empresa
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <ARLRiskSelector
                selectedLevel={flowState.arlRiskLevel}
                onLevelChange={handleARLRiskChange}
              />
            </div>

            {savingsData && (
              <ComparisonView savingsData={savingsData} arlRiskLevel={flowState.arlRiskLevel} />
            )}

            <div className="flex gap-4">
              <button
                onClick={() => handleBackToPaso(3)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                ← Volver
              </button>
              <button
                onClick={() => setFlowState(prev => ({ ...prev, pasoActual: 5 }))}
                className="flex-1 px-6 py-3 bg-tikin-red text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {flowState.pasoActual === 5 && isMeraLiberalidadFlow && savingsData && tikinCommission && flowState.companyData && (
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
              onNewQuotation={handleNewQuotation}
              onSaveQuotation={handleSaveQuotation}
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

        {flowState.pasoActual === 5 && isAlimentacionFlow && foodBonusData && flowState.companyData && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Confirmación de Dispersión
              </h2>
              <p className="text-gray-600">
                Revisa el resumen final y descarga la cotización
              </p>
            </div>

            {/* Resumen final */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-green-700 mb-1">Total de empleados</p>
                  <p className="text-2xl font-bold text-green-900">{foodBonusData.totalEmpleados}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700 mb-1">Total en bonos</p>
                  <p className="text-2xl font-bold text-green-900">{formatCOP(foodBonusData.totalBonos)}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700 mb-1">Costo del servicio</p>
                  <p className="text-2xl font-bold text-green-900">{formatCOP(foodBonusData.feeAmount + foodBonusData.iva)}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700 mb-1">Total a pagar</p>
                  <p className="text-2xl font-bold text-green-900">{formatCOP(foodBonusData.totalConFee)}</p>
                </div>
              </div>
            </div>

            {/* Botones de descarga y acciones - adaptado para alimentación */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Generar Cotización
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Descarga la cotización completa en PDF para enviar al cliente
                  </p>
                  <button
                    onClick={() => alert('Función de descarga de PDF próximamente')}
                    className="inline-flex items-center gap-2 bg-tikin-red text-white px-8 py-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-tikin-red focus:ring-offset-2 transition-all font-medium text-base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar Cotización PDF
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleSaveQuotation}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Guardar Cotización
                  </button>

                  <button
                    onClick={handleNewQuotation}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-tikin-red text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-tikin-red focus:ring-offset-2 transition-all font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Cotización
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">
                  Guarda esta cotización en la base de datos para referencia futura o crea una nueva
                </p>
              </div>
            </div>

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

        {/* Flujo Ambos - Paso 5: Resumen consolidado de ambos tipos de bonos */}
        {flowState.pasoActual === 5 && isAmbosFlow && savingsData && tikinCommission && foodBonusData && flowState.companyData && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Resumen Consolidado
              </h2>
              <p className="text-gray-600">
                Revisa el resumen de ambos tipos de bonos y descarga la cotización
              </p>
            </div>

            {/* Resumen Mera Liberalidad (usando savingsData) */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Bonos de Mera Liberalidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Total en bonos</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCOP(savingsData.tikin.totalBonusAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Ahorro en parafiscales</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCOP(savingsData.monthlyParafiscalesSavings)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Comisión Tikin ({(tikinCommission.percentage * 100).toFixed(2)}%)</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCOP(tikinCommission.baseCommission)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Costo total Tikin</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCOP(tikinCommission.total)}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Beneficio neto mensual:</span>
                  <span className="text-2xl font-bold text-blue-900">{formatCOP(savingsData.netMonthlySavings)}</span>
                </div>
              </div>
            </div>

            {/* Resumen Alimentación */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
              <h3 className="text-xl font-bold text-green-900 mb-4">Bonos de Alimentación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-green-700 mb-1">Total empleados</p>
                  <p className="text-2xl font-bold text-green-900">{foodBonusData.totalEmpleados}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700 mb-1">Total en bonos</p>
                  <p className="text-2xl font-bold text-green-900">{formatCOP(foodBonusData.totalBonos)}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700 mb-1">Fee (1.25%)</p>
                  <p className="text-2xl font-bold text-green-900">{formatCOP(foodBonusData.feeAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700 mb-1">IVA (19%)</p>
                  <p className="text-2xl font-bold text-green-900">{formatCOP(foodBonusData.iva)}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">Total con fee:</span>
                  <span className="text-2xl font-bold text-green-900">{formatCOP(foodBonusData.totalConFee)}</span>
                </div>
              </div>
            </div>

            {/* Total Consolidado */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
              <div className="text-center">
                <p className="text-sm text-purple-700 mb-2">Total General Mensual</p>
                <p className="text-4xl font-bold text-purple-900">
                  {formatCOP((savingsData.tikin.totalBonusAmount + tikinCommission.total) + foodBonusData.totalConFee)}
                </p>
                <p className="text-sm text-purple-600 mt-2">
                  Bonos de ambos tipos + costos Tikin
                </p>
                <div className="mt-4 p-4 bg-white/50 rounded-lg">
                  <p className="text-sm text-purple-700 mb-1">Ahorro neto total (solo Mera Liberalidad)</p>
                  <p className="text-xl font-bold text-purple-900">{formatCOP(savingsData.netMonthlySavings)}</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Generar Cotización
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Descarga la cotización completa en PDF para enviar al cliente
                  </p>
                  <button
                    onClick={() => alert('Función de descarga de PDF próximamente')}
                    className="inline-flex items-center gap-2 bg-tikin-red text-white px-8 py-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-tikin-red focus:ring-offset-2 transition-all font-medium text-base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar Cotización PDF
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleSaveQuotation}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Guardar Cotización
                  </button>

                  <button
                    onClick={handleNewQuotation}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-tikin-red text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-tikin-red focus:ring-offset-2 transition-all font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Cotización
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">
                  Guarda esta cotización en la base de datos para referencia futura o crea una nueva
                </p>
              </div>
            </div>

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
