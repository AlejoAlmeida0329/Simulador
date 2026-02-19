'use client'

import { ARLRiskLevel } from '@/lib/constants/parafiscales'

const ARL_RISK_LEVELS: { value: ARLRiskLevel; label: string; description: string; tasa: string }[] = [
  { value: 'I', label: 'Nivel I', description: 'Oficina, administración', tasa: '0.522%' },
  { value: 'II', label: 'Nivel II', description: 'Comercio, servicios', tasa: '1.044%' },
  { value: 'III', label: 'Nivel III', description: 'Manufactura, logística', tasa: '2.436%' },
  { value: 'IV', label: 'Nivel IV', description: 'Construcción, agricultura', tasa: '4.350%' },
  { value: 'V', label: 'Nivel V', description: 'Minería, explosivos', tasa: '6.960%' },
]

interface ARLRiskSelectorProps {
  value: ARLRiskLevel
  onChange: (level: ARLRiskLevel) => void
  compact?: boolean
}

/**
 * Selector de nivel de riesgo ARL reutilizable.
 * Se usa en DataInputStep e IntegralDataInputStep al configurar lotes de empleados.
 * Referencia: Decreto 1295/1994, Decreto 1607/2002 — Clasificación de actividades económicas
 */
export function ARLRiskSelector({ value, onChange, compact = false }: ARLRiskSelectorProps) {
  const colorClasses = { selected: 'border-tikin-red bg-red-50', text: 'text-tikin-red', rate: 'text-tikin-red' }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {ARL_RISK_LEVELS.map(arl => (
          <button
            key={arl.value}
            type="button"
            onClick={() => onChange(arl.value)}
            className={`px-3 py-1.5 rounded-lg border-2 text-sm transition-all ${
              value === arl.value
                ? `${colorClasses.selected} shadow-sm`
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className={`font-semibold ${value === arl.value ? colorClasses.text : 'text-gray-700'}`}>
              {arl.value}
            </span>
            <span className={`ml-1.5 text-xs ${value === arl.value ? colorClasses.rate : 'text-gray-400'}`}>
              {arl.tasa}
            </span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ARL_RISK_LEVELS.map(arl => (
          <button
            key={arl.value}
            type="button"
            onClick={() => onChange(arl.value)}
            className={`p-3 rounded-lg border-2 transition-all text-center ${
              value === arl.value
                ? `${colorClasses.selected} shadow-sm`
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className={`font-semibold text-sm ${
              value === arl.value ? colorClasses.text : 'text-gray-900'
            }`}>
              {arl.label}
            </span>
            <p className="text-xs text-gray-500 mt-1 leading-tight">{arl.description}</p>
            <p className={`text-xs font-medium mt-1.5 ${
              value === arl.value ? colorClasses.rate : 'text-gray-400'
            }`}>
              {arl.tasa}
            </p>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Decreto 1295/1994 — Clasificación por actividad económica (CIIU)
      </p>
    </div>
  )
}
