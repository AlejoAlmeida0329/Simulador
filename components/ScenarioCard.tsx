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
  const headerBg = isTraditional ? 'bg-gradient-to-r from-gray-50 to-gray-100' : 'bg-gradient-to-r from-red-50 to-pink-50'
  const headerBorder = isTraditional ? 'border-gray-300' : 'border-red-200'
  const cardBorder = isTraditional ? 'border-gray-300' : 'border-red-200'

  return (
    <div className={`bg-white border-2 ${cardBorder} rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col transform hover:-translate-y-1`}>
      <div className={`${headerBg} px-6 py-5 border-b-2 ${headerBorder}`}>
        <div className="flex items-center gap-3 mb-2">
          {!isTraditional && (
            <svg className="w-6 h-6 text-tikin-red" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          )}
          <h3 className={`text-xl font-bold ${accentColor}`}>
            {scenario.label}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            isTraditional ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-700'
          }`}>
            {scenario.totalBonusAmount > 0 ? (
              scenario.mlBonusAmount !== undefined && scenario.alBonusAmount !== undefined ? (
                `${scenario.salaryPercentage.toFixed(0)}% Salario + Bonos`
              ) : (
                `${Math.round(scenario.salaryPercentage)}% Salario + ${Math.round(scenario.bonusPercentage)}% Bono`
              )
            ) : (
              '100% Salario'
            )}
          </span>
        </div>
      </div>

      {/* Composition breakdown */}
      <div className="px-6 py-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Base salarial:</span>
          <span className="font-medium text-gray-900">{formatCOP(scenario.totalSalaryBase)}</span>
        </div>
        {scenario.totalBonusAmount > 0 && (
          <>
            {/* Si hay desglose de ML y AL, mostrarlos por separado */}
            {scenario.mlBonusAmount !== undefined && scenario.alBonusAmount !== undefined ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 pl-4">• Bono ML:</span>
                  <span className="font-medium text-gray-900">{formatCOP(scenario.mlBonusAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 pl-4">• Bono AL:</span>
                  <span className="font-medium text-gray-900">{formatCOP(scenario.alBonusAmount)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="text-gray-600 font-medium">Total Bonos:</span>
                  <span className="font-semibold text-gray-900">{formatCOP(scenario.totalBonusAmount)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bonos:</span>
                <span className="font-medium text-gray-900">{formatCOP(scenario.totalBonusAmount)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Parafiscales breakdown */}
      <div className="border-t border-gray-200 px-6 py-4 flex-1 flex flex-col">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Parafiscales Mensuales:
        </h4>

        <div className="space-y-2">
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
        </div>

        <div className={`flex justify-between items-center pt-4 mt-auto border-t-2 ${
          isTraditional ? 'border-gray-300' : 'border-red-200'
        } ${
          isTraditional ? 'bg-gray-50' : 'bg-red-50'
        } -mx-6 px-6 pb-4 mt-4`}>
          <span className="font-bold text-gray-900 text-base">Total Parafiscales:</span>
          <span className={`text-2xl font-bold ${accentColor}`}>{formatCOP(scenario.parafiscales.total)}</span>
        </div>
      </div>
    </div>
  )
}
