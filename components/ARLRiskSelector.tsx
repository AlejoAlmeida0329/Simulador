'use client'

import { ARLRiskLevel, ARL_RATES } from '@/lib/constants/parafiscales'
import { formatPercentage } from '@/lib/formatters'

interface ARLRiskSelectorProps {
  selectedLevel: ARLRiskLevel
  onLevelChange: (level: ARLRiskLevel) => void
}

const RISK_LEVELS: Array<{ level: ARLRiskLevel; description: string }> = [
  { level: 'I', description: 'Riesgo Mínimo (Oficinas)' },
  { level: 'II', description: 'Riesgo Bajo (Comercio)' },
  { level: 'III', description: 'Riesgo Medio (Manufactura)' },
  { level: 'IV', description: 'Riesgo Alto (Construcción)' },
  { level: 'V', description: 'Riesgo Máximo (Minería)' },
]

export function ARLRiskSelector({
  selectedLevel,
  onLevelChange,
}: ARLRiskSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Nivel de Riesgo ARL
      </h3>

      <div className="space-y-3">
        {RISK_LEVELS.map(({ level, description }) => (
          <label
            key={level}
            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
              selectedLevel === level
                ? 'border-tikin-red bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="arl-risk-level"
                value={level}
                checked={selectedLevel === level}
                onChange={() => onLevelChange(level)}
                className="w-4 h-4 text-tikin-red focus:ring-tikin-red"
              />
              <div>
                <div className="font-semibold text-gray-900">
                  Clase {level}
                </div>
                <div className="text-sm text-gray-600">{description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {formatPercentage(ARL_RATES[level] * 100)}
              </div>
              <div className="text-xs text-gray-500">tasa ARL</div>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-gray-700">
        <p>
          <strong>Nota:</strong> El nivel de riesgo ARL se aplica a toda la
          empresa y determina la tasa de contribución por Riesgos Laborales.
        </p>
      </div>
    </div>
  )
}
