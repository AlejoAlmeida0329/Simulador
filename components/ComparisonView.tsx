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
    <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Comparación de Escenarios
        </h2>
        <p className="text-sm text-gray-600">
          Modelo Tradicional vs Modelo Tikin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
    </div>
  )
}
