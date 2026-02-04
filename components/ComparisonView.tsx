'use client'

import { SavingsResult } from '@/types/scenarios'
import { ScenarioCard } from './ScenarioCard'
import { ARLRiskLevel } from '@/lib/constants/parafiscales'

interface ComparisonViewProps {
  savingsData: SavingsResult
  arlRiskLevel: ARLRiskLevel
}

export function ComparisonView({ savingsData, arlRiskLevel }: ComparisonViewProps) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-200 animate-slide-up">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Comparación de Escenarios
        </h2>
        <p className="text-base text-gray-600">
          Modelo Tradicional vs Modelo Tikin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ScenarioCard
          scenario={savingsData.traditional}
          isTraditional={true}
          arlRiskLevel={arlRiskLevel}
        />

        <ScenarioCard
          scenario={savingsData.tikin}
          isTraditional={false}
          arlRiskLevel={arlRiskLevel}
        />
      </div>

      {/* Savings highlight bar */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-left">
            <p className="text-sm font-medium text-green-800 mb-1">
              Optimización Estimada en Costos
            </p>
            <p className="text-3xl font-bold text-green-600">
              ${savingsData.monthlySavings.toLocaleString('es-CO')}
            </p>
            <p className="text-xs text-green-700 mt-1">
              Reducción potencial del {savingsData.percentageReduction.toFixed(1)}% mensual
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer sutil */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800 text-center leading-relaxed">
          <strong>Nota:</strong> Los valores mostrados son estimaciones basadas en la información ingresada.
          Los costos finales pueden variar según circunstancias específicas.
          Esta herramienta no constituye asesoría legal, contable o laboral.
        </p>
      </div>
    </div>
  )
}
