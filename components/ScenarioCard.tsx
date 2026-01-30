'use client'

import { ScenarioResult } from '@/types/scenarios'
import { formatCOP, formatPercentage } from '@/lib/formatters'
import { ARLRiskLevel, ARL_RATES } from '@/lib/constants/parafiscales'

interface ScenarioCardProps {
  scenario: ScenarioResult
  isTraditional?: boolean
  arlRiskLevel: ARLRiskLevel
}

export function ScenarioCard({ scenario, isTraditional = false, arlRiskLevel }: ScenarioCardProps) {
  const accentColor = isTraditional ? 'text-gray-900' : 'text-tikin-red'
  const headerBorder = isTraditional ? 'border-gray-200' : 'border-red-100'

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className={`bg-gray-50 px-6 py-4 border-b ${headerBorder}`}>
        <h3 className={`text-lg font-semibold ${accentColor}`}>
          {scenario.label}
        </h3>
        <div className="text-sm text-gray-600 mt-1">
          {scenario.salaryPercentage === 100 ? (
            <span>100% Salario</span>
          ) : (
            <span>
              {scenario.salaryPercentage}% Salario + {scenario.bonusPercentage}% Bono
            </span>
          )}
        </div>
      </div>

      {/* Composition breakdown */}
      <div className="px-6 py-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Base salarial:</span>
          <span className="font-medium text-gray-900">{formatCOP(scenario.totalSalaryBase)}</span>
        </div>
        {scenario.totalBonusAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Bonos:</span>
            <span className="font-medium text-gray-900">{formatCOP(scenario.totalBonusAmount)}</span>
          </div>
        )}
      </div>

      {/* Parafiscales breakdown */}
      <div className="border-t border-gray-200 px-6 py-4 space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Parafiscales Mensuales:
        </h4>

        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Salud (8.5%):</span>
          <span className="text-gray-900">{formatCOP(scenario.parafiscales.health)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Pensión (12%):</span>
          <span className="text-gray-900">{formatCOP(scenario.parafiscales.pension)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-gray-600">ARL ({formatPercentage(ARL_RATES[arlRiskLevel] * 100)}):</span>
          <span className="text-gray-900">{formatCOP(scenario.parafiscales.arl)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-gray-600">SENA (2%):</span>
          <span className="text-gray-900">{formatCOP(scenario.parafiscales.sena)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-gray-600">ICBF (3%):</span>
          <span className="text-gray-900">{formatCOP(scenario.parafiscales.icbf)}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Caja Compensación (4%):</span>
          <span className="text-gray-900">{formatCOP(scenario.parafiscales.caja)}</span>
        </div>

        <div className="flex justify-between pt-3 mt-2 border-t border-gray-200">
          <span className="font-semibold text-gray-900">Total:</span>
          <span className={`text-lg font-semibold ${accentColor}`}>{formatCOP(scenario.parafiscales.total)}</span>
        </div>
      </div>
    </div>
  )
}
