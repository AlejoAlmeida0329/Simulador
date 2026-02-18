'use client'

import { useBonosStore } from '@/store/bonosStore'
import { WizardStepper } from '@/components/bonos/wizard/WizardStepper'
import { FlowSelectionStep } from '@/components/bonos/wizard/FlowSelectionStep'
import { CompanyDataStep } from '@/components/bonos/wizard/CompanyDataStep'
import { BonusSelectionStep } from '@/components/bonos/wizard/BonusSelectionStep'
import { DataInputStep } from '@/components/bonos/wizard/DataInputStep'
import { ResultsStep } from '@/components/bonos/wizard/ResultsStep'
import { IntegralDataInputStep } from '@/components/bonos/wizard/IntegralDataInputStep'
import { IntegralResultsStep } from '@/components/bonos/wizard/IntegralResultsStep'
import { LegalFooter } from '@/components/LegalFooter'

/**
 * Cotizador de Bonos Tikin
 * Flujo robusto con validaciones, múltiples tipos de bonos y carga masiva.
 *
 * Nuevo orden de pasos (ambos flujos, 5 pasos: 0–4):
 *   0: Empresa → 1: Tipo cotización → 2: Empleados → 3: Bonos → 4: Resultados
 */
export default function BonosPage() {
  const { pasoActual, flujoSeleccionado } = useBonosStore()

  const isIntegral = flujoSeleccionado === 'salario_integral'

  /**
   * Render the correct step component based on flow type and current step.
   *
   * All flows (5 steps):
   *   0: Company → 1: FlowSelection → 2: DataInput → 3: BonusSelection → 4: Results
   */
  const renderStep = () => {
    if (pasoActual === 0) return <CompanyDataStep />
    if (pasoActual === 1) return <FlowSelectionStep />

    if (isIntegral) {
      if (pasoActual === 2) return <IntegralDataInputStep />
      if (pasoActual === 3) return <BonusSelectionStep />
      if (pasoActual === 4) return <IntegralResultsStep />
    } else {
      if (pasoActual === 2) return <DataInputStep />
      if (pasoActual === 3) return <BonusSelectionStep />
      if (pasoActual === 4) return <ResultsStep />
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            <span className="text-tikin-red">Cotizador Tikin</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {!flujoSeleccionado
              ? 'Cotiza bonos y optimiza la compensacion de tus empleados con cumplimiento legal garantizado'
              : isIntegral
              ? 'Simula la conversion a salario integral y calcula el ahorro para tu empresa'
              : 'Cotiza bonos para tus empleados con validaciones en tiempo real y cumplimiento legal garantizado'
            }
          </p>
          {flujoSeleccionado && !isIntegral && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-blue-700 font-medium">
                10 tipos de bonos con validaciones y cumplimiento legal
              </span>
            </div>
          )}
          {isIntegral && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-purple-700 font-medium">
                Salario Integral — Art. 132 CST, Ley 100/1993
              </span>
            </div>
          )}
        </div>

        {/* Wizard Stepper */}
        <WizardStepper />

        {/* Content Container */}
        <div className="mt-8 animate-slide-up">
          {renderStep()}
        </div>
      </div>

      {/* Legal Footer */}
      <LegalFooter />
    </div>
  )
}
