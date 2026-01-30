'use client'

import { SavingsResult } from '@/types/scenarios'
import { formatCOP, formatPercentage } from '@/lib/formatters'

interface SavingsMetricsProps {
  savingsData: SavingsResult
}

export function SavingsMetrics({ savingsData }: SavingsMetricsProps) {
  const { monthlySavings, percentageReduction } = savingsData

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Ahorro con Tikin
        </h2>
        <p className="text-sm text-gray-600">
          Reducción en costos de parafiscales
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Monthly Savings */}
        <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
          <div className="text-xs font-medium text-gray-600 mb-2">
            Ahorro Mensual
          </div>
          <div className="text-4xl font-semibold text-tikin-red mb-2">
            {formatCOP(monthlySavings)}
          </div>
          <div className="text-xs text-gray-500">
            Reducción en parafiscales cada mes
          </div>
        </div>

        {/* Percentage Reduction */}
        <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
          <div className="text-xs font-medium text-gray-600 mb-2">
            Reducción Porcentual
          </div>
          <div className="text-4xl font-semibold text-tikin-red mb-2">
            {formatPercentage(percentageReduction)}
          </div>
          <div className="text-xs text-gray-500">
            Menos en costos laborales
          </div>
        </div>
      </div>

      {/* Annual projection */}
      <div className="bg-red-50 rounded-lg p-6 text-center border border-red-100">
        <div className="text-xs font-medium text-gray-600 mb-2">
          Proyección Anual
        </div>
        <div className="text-3xl font-semibold text-tikin-red mb-1">
          {formatCOP(monthlySavings * 12)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Ahorro estimado en 12 meses
        </div>
      </div>
    </div>
  )
}
