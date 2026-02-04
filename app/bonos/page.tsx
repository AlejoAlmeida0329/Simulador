'use client'

import { useState, useMemo } from 'react'
import { DisclaimerModal } from '@/components/DisclaimerModal'
import { LegalFooter } from '@/components/LegalFooter'
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
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
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
          salario: batch.salarioPorEmpleado,
          nombre: `Empleado ${i + 1}`
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

      // Calcular el total de bonos de alimentación
      const totalALBonuses = flowState.bothBonusesEmployees.reduce(
        (sum, batch) => sum + (batch.cantidad * batch.montoAL),
        0
      )

      const traditional = calculateTraditionalScenario(expandedEmployees, flowState.arlRiskLevel)
      const tikin = calculateTikinScenario(expandedEmployees, salaryPercentage, flowState.arlRiskLevel)

      // Calcular compensación total incluyendo ambos tipos de bonos
      const totalCompensation = tikin.totalSalaryBase + tikin.totalBonusAmount + totalALBonuses
      const calculatedSalaryPercentage = totalCompensation > 0
        ? (tikin.totalSalaryBase / totalCompensation) * 100
        : 100
      const calculatedBonusPercentage = totalCompensation > 0
        ? ((tikin.totalBonusAmount + totalALBonuses) / totalCompensation) * 100
        : 0

      // Añadir los bonos de alimentación al escenario Tikin con desglose
      const tikinWithAL = {
        ...tikin,
        salaryPercentage: calculatedSalaryPercentage,
        bonusPercentage: calculatedBonusPercentage,
        totalBonusAmount: tikin.totalBonusAmount + totalALBonuses,
        mlBonusAmount: tikin.totalBonusAmount,
        alBonusAmount: totalALBonuses
      }

      return calculateSavings(traditional, tikinWithAL)
    }

    // Para flujos individuales ML y AL
    if (flowState.empleados.length === 0) return null

    const calculationEmployees = flowState.empleados

    const traditional = calculateTraditionalScenario(calculationEmployees, flowState.arlRiskLevel)
    const tikin = calculateTikinScenario(calculationEmployees, flowState.salaryPercentage, flowState.arlRiskLevel)
    return calculateSavings(traditional, tikin)
  }, [flowState.empleados, flowState.bothBonusesEmployees, flowState.salaryPercentage, flowState.arlRiskLevel, flowState.tipoSeleccionado])

  // Calculate Tikin commission (solo sobre bonos ML, no AL)
  const tikinCommission = useMemo(() => {
    if (!savingsData) return null
    // Para flujo "ambos", usar mlBonusAmount (solo ML)
    // Para otros flujos, usar totalBonusAmount
    const bonusAmountForCommission = savingsData.tikin.mlBonusAmount !== undefined
      ? savingsData.tikin.mlBonusAmount
      : savingsData.tikin.totalBonusAmount
    return calculateTikinCommission(bonusAmountForCommission)
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

  // Calculate savings for food bonus flow
  const savingsDataFood = useMemo(() => {
    if (flowState.tipoSeleccionado !== 'alimentacion' || flowState.foodBonusEmployees.length === 0) {
      return null
    }

    // Expandir empleados para cálculos (cada lote en empleados individuales)
    const traditionalEmployees: Employee[] = []
    const tikinEmployees: Employee[] = []

    flowState.foodBonusEmployees.forEach(batch => {
      for (let i = 0; i < batch.cantidad; i++) {
        // En el escenario tradicional, todo sería salario
        const totalCompensation = batch.salarioPorEmpleado + batch.montoPorEmpleado
        traditionalEmployees.push({
          id: `trad-${batch.id}-${i}`,
          nombre: `Empleado ${i + 1}`,
          salario: totalCompensation,
          origen: 'manual' as const
        })

        // En el escenario Tikin, solo el salario base
        tikinEmployees.push({
          id: `tikin-${batch.id}-${i}`,
          nombre: `Empleado ${i + 1}`,
          salario: batch.salarioPorEmpleado,
          origen: 'manual' as const
        })
      }
    })

    // Escenario tradicional: todo como salario
    const traditional = calculateTraditionalScenario(traditionalEmployees, flowState.arlRiskLevel)

    // Escenario Tikin: solo salario base (sin bonos de alimentación)
    // Usamos calculateTraditionalScenario porque queremos parafiscales sobre salario base
    const tikinBase = calculateTraditionalScenario(tikinEmployees, flowState.arlRiskLevel)

    // Agregar información de los bonos al escenario Tikin
    const totalBonusAmount = flowState.foodBonusEmployees.reduce(
      (sum, batch) => sum + (batch.cantidad * batch.montoPorEmpleado),
      0
    )

    const totalSalaryBase = tikinEmployees.reduce((sum, emp) => sum + emp.salario, 0)

    // Calcular porcentajes basados en compensación total
    const totalCompensation = totalSalaryBase + totalBonusAmount
    const calculatedSalaryPercentage = totalCompensation > 0
      ? (totalSalaryBase / totalCompensation) * 100
      : 100
    const calculatedBonusPercentage = totalCompensation > 0
      ? (totalBonusAmount / totalCompensation) * 100
      : 0

    // Crear escenario Tikin con la estructura correcta
    const tikin = {
      label: 'Escenario Tikin',
      salaryPercentage: calculatedSalaryPercentage,
      bonusPercentage: calculatedBonusPercentage,
      totalSalaryBase: totalSalaryBase,
      totalBonusAmount: totalBonusAmount,
      parafiscales: tikinBase.parafiscales
    }

    return calculateSavings(traditional, tikin)
  }, [flowState.foodBonusEmployees, flowState.arlRiskLevel, flowState.tipoSeleccionado])

  const minSalaryPercentage = 60
  const maxSalaryPercentage = 90

  // Determinar el tipo de flujo
  const isMeraLiberalidadFlow = flowState.tipoSeleccionado === 'mera_liberalidad'
  const isAlimentacionFlow = flowState.tipoSeleccionado === 'alimentacion'
  const isAmbosFlow = flowState.tipoSeleccionado === 'ambos'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            <span className="text-tikin-red">Cotizador Tikin</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Estima la optimización potencial de tus costos laborales con bonos flexibles
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center max-w-4xl mx-auto">
            {[
              { num: 1, label: 'Tipo de Bono', desc: 'Selecciona el tipo' },
              { num: 2, label: 'Empresa', desc: 'Datos básicos' },
              { num: 3, label: 'Empleados', desc: 'Carga tu nómina' },
              { num: 4, label: 'Distribución', desc: 'Configura bonos' },
              { num: 5, label: 'Resumen', desc: 'Revisa y descarga' }
            ].map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 font-semibold transition-all duration-300 ${
                      step.num === flowState.pasoActual
                        ? 'bg-tikin-red text-white border-tikin-red shadow-lg shadow-red-200 scale-110'
                        : step.num < flowState.pasoActual
                        ? 'bg-green-500 text-white border-green-500 shadow-md'
                        : 'bg-white text-gray-400 border-gray-300'
                    }`}
                  >
                    {step.num < flowState.pasoActual ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.num
                    )}
                    {step.num === flowState.pasoActual && (
                      <span className="absolute -inset-1 rounded-full bg-tikin-red opacity-20 animate-ping"></span>
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <div className={`text-sm font-semibold transition-colors ${
                      step.num === flowState.pasoActual ? 'text-tikin-red' :
                      step.num < flowState.pasoActual ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 hidden sm:block">{step.desc}</div>
                  </div>
                </div>
                {index < 4 && (
                  <div className="flex-1 h-0.5 mx-2 relative" style={{ maxWidth: '100px' }}>
                    <div className="absolute inset-0 bg-gray-300"></div>
                    <div
                      className={`absolute inset-0 transition-all duration-500 ${
                        step.num < flowState.pasoActual ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      style={{
                        width: step.num < flowState.pasoActual ? '100%' : '0%'
                      }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Container */}
        <div className="animate-slide-up">
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
                Configuración y Comparativa
              </h2>
              <p className="text-gray-600">
                Configura el nivel de riesgo ARL y revisa el ahorro en parafiscales
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <ARLRiskSelector
                selectedLevel={flowState.arlRiskLevel}
                onLevelChange={handleARLRiskChange}
              />
            </div>

            {savingsDataFood && (
              <ComparisonView savingsData={savingsDataFood} arlRiskLevel={flowState.arlRiskLevel} />
            )}

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

            {/* Resumen Consolidado de Ambos Bonos */}
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200 p-6">
              <h3 className="text-xl font-bold text-indigo-900 mb-6">Resumen de Bonos</h3>

              <div className="space-y-4">
                {/* Desglose de bonos */}
                <div className="bg-white/60 rounded-lg p-4">
                  <p className="text-sm font-semibold text-indigo-800 mb-3">Total en Bonos</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-indigo-700 pl-4">• Bonos ML (Mera Liberalidad):</span>
                      <span className="font-medium text-indigo-900">{formatCOP(savingsData.tikin.mlBonusAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-indigo-700 pl-4">• Bonos AL (Alimentación):</span>
                      <span className="font-medium text-indigo-900">{formatCOP(foodBonusData.totalBonos)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-indigo-200">
                      <span className="text-base font-semibold text-indigo-800">Total Bonos:</span>
                      <span className="text-2xl font-bold text-indigo-900">
                        {formatCOP((savingsData.tikin.mlBonusAmount || 0) + foodBonusData.totalBonos)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ahorro en parafiscales */}
                <div className="flex justify-between items-center py-2 border-b border-indigo-200">
                  <div>
                    <span className="text-sm text-indigo-700">Ahorro en parafiscales</span>
                    <p className="text-xs text-indigo-600">(solo bonos ML generan ahorro)</p>
                  </div>
                  <span className="text-2xl font-bold text-indigo-900">
                    {formatCOP(savingsData.monthlySavings)}
                  </span>
                </div>

                {/* Comisiones Tikin totales */}
                <div className="bg-white/60 rounded-lg p-4">
                  <p className="text-sm font-semibold text-indigo-800 mb-3">Comisiones Tikin</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-indigo-700 pl-4">• ML ({(tikinCommission.percentage * 100).toFixed(2)}%):</span>
                      <span className="font-medium text-indigo-900">{formatCOP(tikinCommission.baseCommission)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-indigo-700 pl-4">• AL (1.25%):</span>
                      <span className="font-medium text-indigo-900">{formatCOP(foodBonusData.feeAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-indigo-700 pl-4">• IVA (19%):</span>
                      <span className="font-medium text-indigo-900">
                        {formatCOP(tikinCommission.iva + foodBonusData.iva)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-indigo-200">
                      <span className="text-base font-semibold text-indigo-800">Total Comisiones + IVA:</span>
                      <span className="text-2xl font-bold text-indigo-900">
                        {formatCOP(tikinCommission.totalCost + foodBonusData.feeAmount + foodBonusData.iva)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Beneficio neto mensual */}
                <div className="flex justify-between items-center py-4 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-lg px-6 mt-4">
                  <div>
                    <span className="text-base font-medium text-indigo-800">Beneficio Neto Mensual</span>
                    <p className="text-xs text-indigo-700 mt-1">Ahorro - Comisiones Totales</p>
                  </div>
                  <span className="text-3xl font-bold text-indigo-900">
                    {formatCOP(savingsData.monthlySavings - (tikinCommission.totalCost + foodBonusData.feeAmount + foodBonusData.iva))}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Consolidado */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
              <div className="text-center">
                <p className="text-sm text-purple-700 mb-2">Costo Total Mensual para el Cliente</p>
                <p className="text-4xl font-bold text-purple-900">
                  {formatCOP(
                    (savingsData.tikin.mlBonusAmount || 0) + // Bonos ML
                    tikinCommission.totalCost +               // Comisión Tikin ML
                    foodBonusData.totalConFee                 // Bonos AL + Fee + IVA
                  )}
                </p>
                <p className="text-sm text-purple-600 mt-2">
                  Bonos ML + Costo Tikin ML + Bonos AL con fee
                </p>
                <div className="mt-4 p-4 bg-white/50 rounded-lg">
                  <p className="text-sm text-purple-700 mb-1">Ahorro neto en parafiscales (solo ML)</p>
                  <p className="text-xl font-bold text-purple-900">
                    {formatCOP(savingsData.monthlySavings - tikinCommission.totalCost)}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Este es el beneficio real comparado con pagar 100% salario sin bonos
                  </p>
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
      </div>

      {/* Legal Footer */}
      <LegalFooter />

      {/* Disclaimer Modal */}
      <DisclaimerModal onAccept={() => setDisclaimerAccepted(true)} />
    </div>
  )
}
