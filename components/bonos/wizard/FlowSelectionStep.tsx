'use client'

import { useState } from 'react'
import { useBonosStore } from '@/store/bonosStore'
import type { FlujoTipo } from '@/lib/bonos/types'

const FLUJOS: {
  id: FlujoTipo
  titulo: string
  subtitulo: string
  descripcion: string
  tag: string
  tagColor: string
  ejemplo: string
  refLegal: string
}[] = [
  {
    id: 'beneficios_actuales',
    titulo: 'Reestructurar Compensacion',
    subtitulo: 'Misma compensacion, mejor estructura',
    descripcion:
      'Toma el salario completo actual de tus empleados y redistribuye una parte como bonos no salariales. El empleado recibe lo mismo, pero la empresa ahorra en parafiscales y prestaciones.',
    tag: 'Sin impacto para el empleado',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    ejemplo: '$10M salario completo → $6M base + $4M bonos',
    refLegal: 'Art. 128 CST — pagos no constitutivos de salario',
  },
  {
    id: 'nuevos_beneficios',
    titulo: 'Agregar Nuevos Beneficios',
    subtitulo: 'Mas beneficios con menor costo',
    descripcion:
      'Mantiene el salario actual intacto y agrega bonos adicionales. Ideal para aumentos salariales, nuevos beneficios o retencion de talento — con un costo menor que un aumento directo.',
    tag: 'Mas beneficios, menor costo',
    tagColor: 'bg-green-50 text-green-700 border-green-200',
    ejemplo: '$6M salario actual + $2M bonos nuevos = $8M total',
    refLegal: 'Art. 128 CST — bonos de mera liberalidad',
  },
  {
    id: 'salario_integral',
    titulo: 'Salario Integral + Bonos',
    subtitulo: 'Mismo sueldo, menos cargas laborales',
    descripcion:
      'Tu empleado sigue ganando lo mismo. Reestructuras como salario integral (minimo legal) + bonos por la diferencia. La empresa paga seguridad social y parafiscales sobre el 70% del integral, no sobre el total. Prestaciones = $0.',
    tag: 'Mismo sueldo, menos cargas',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    ejemplo: '$30M → $22.8M integral + $7.2M bonos = $30M total',
    refLegal: 'Art. 132 CST, Ley 100/1993 Art. 18',
  },
]

const COMPARACION = [
  {
    aspecto: 'El empleado recibe...',
    actuales: 'Lo mismo que hoy',
    nuevos: 'Mas que hoy',
    integral: 'Lo mismo + mas ingreso neto',
  },
  {
    aspecto: 'Costo total para la empresa...',
    actuales: 'Se reduce',
    nuevos: 'Aumenta (pero menos que un aumento directo)',
    integral: 'Se reduce significativamente',
  },
  {
    aspecto: 'Se necesita...',
    actuales: 'El salario completo actual',
    nuevos: 'El salario base actual',
    integral: 'Salarios >= $22.8M (13 SMMLV 2026)',
  },
  {
    aspecto: 'Aplica para...',
    actuales: 'Todos los empleados',
    nuevos: 'Todos los empleados',
    integral: 'Solo salarios altos (>= integral minimo)',
  },
]

export function FlowSelectionStep() {
  const { flujoSeleccionado, setFlujoSeleccionado, siguientePaso, lotes, empleados } = useBonosStore()
  const [showHelp, setShowHelp] = useState(false)
  const [showChangeWarning, setShowChangeWarning] = useState(false)
  const [pendingFlujo, setPendingFlujo] = useState<FlujoTipo | null>(null)

  const hasData = lotes.length > 0 || empleados.length > 0

  const handleSelect = (flujo: FlujoTipo) => {
    if (hasData && flujoSeleccionado && flujo !== flujoSeleccionado) {
      setPendingFlujo(flujo)
      setShowChangeWarning(true)
      return
    }
    setFlujoSeleccionado(flujo)
  }

  const confirmChange = () => {
    if (pendingFlujo) {
      const store = useBonosStore.getState()
      // Limpiar datos de empleados y lotes al cambiar flujo
      store.resetear()
      store.setFlujoSeleccionado(pendingFlujo)
      // Mantener en paso 0
      store.setPasoActual(0)
    }
    setShowChangeWarning(false)
    setPendingFlujo(null)
  }

  const handleContinuar = () => {
    if (flujoSeleccionado) {
      siguientePaso()
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Como quieres cotizar?
        </h2>
        <p className="text-gray-600 mt-2">
          Selecciona el tipo de simulacion que mejor se adapte a tu caso
        </p>
      </div>

      {/* Flow Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        role="radiogroup"
        aria-label="Selecciona el tipo de flujo"
      >
        {FLUJOS.map((flujo) => {
          const isSelected = flujoSeleccionado === flujo.id
          return (
            <button
              key={flujo.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(flujo.id)}
              className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-tikin-red focus-visible:ring-offset-2 ${
                isSelected
                  ? 'border-tikin-red bg-red-50/50 shadow-lg shadow-red-100'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-7 h-7 bg-tikin-red rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Visual Diagram */}
              <div className={`mb-5 p-4 rounded-xl ${
                flujo.id === 'beneficios_actuales'
                  ? 'bg-blue-50'
                  : flujo.id === 'salario_integral'
                    ? 'bg-purple-50'
                    : 'bg-green-50'
              }`}>
                {flujo.id === 'beneficios_actuales' ? (
                  // Split diagram: one bar dividing into two
                  <div className="space-y-3">
                    <div className="h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-600">$10M Salario Completo</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-[6] h-8 bg-blue-400 rounded-l-lg flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">60% Base</span>
                      </div>
                      <div className="flex-[4] h-8 bg-orange-400 rounded-r-lg flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">40% Bonos</span>
                      </div>
                    </div>
                  </div>
                ) : flujo.id === 'salario_integral' ? (
                  // Integral + Bonos diagram: same total, restructured
                  <div className="space-y-3">
                    <div className="h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-600">$30M Salario Actual</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <div className="flex gap-1 items-center">
                      <div className="flex-[3] h-8 bg-purple-500 rounded-l-lg flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">$22.8M Integral</span>
                      </div>
                      <div className="flex-[1] h-8 bg-orange-400 rounded-r-lg flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">$7.2M Bonos</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-green-600">= $30M total — Recibe lo mismo</span>
                    </div>
                  </div>
                ) : (
                  // Stack diagram: base with bonuses on top
                  <div className="space-y-1">
                    <div className="h-8 bg-emerald-400 rounded-t-lg flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">+ $2M Bonos Nuevos</span>
                    </div>
                    <div className="h-8 bg-blue-400 rounded-b-lg flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">$6M Salario Actual</span>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-semibold text-gray-500">= $8M Compensacion Total</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Content */}
              <h3 className="text-lg font-bold text-gray-900 pr-8">{flujo.titulo}</h3>
              <p className="text-sm font-medium text-gray-500 mt-1">{flujo.subtitulo}</p>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{flujo.descripcion}</p>

              {/* Tag */}
              <div className="mt-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${flujo.tagColor}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {flujo.tag}
                </span>
              </div>

              {/* Example */}
              <div className="mt-3 text-xs text-gray-400 italic">{flujo.ejemplo}</div>
              {/* Legal reference */}
              <div className="mt-1.5 text-xs text-gray-400">{flujo.refLegal}</div>
            </button>
          )
        })}
      </div>

      {/* Help Section */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          aria-expanded={showHelp}
          aria-controls="flow-help-panel"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-tikin-red transition-colors min-h-[44px]"
        >
          <svg className={`w-4 h-4 transition-transform ${showHelp ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          No estoy seguro — Ayudame a decidir
        </button>

        {showHelp && (
          <div id="flow-help-panel" className="mt-4 max-w-3xl mx-auto">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Comparacion rapida</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="text-left border-b border-gray-300">
                      <th className="pb-2 pr-4 text-gray-500 font-medium">Aspecto</th>
                      <th className="pb-2 pr-4 text-blue-600 font-medium">Reestructurar</th>
                      <th className="pb-2 pr-4 text-green-600 font-medium">Nuevos Beneficios</th>
                      <th className="pb-2 text-purple-600 font-medium">Integral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARACION.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2.5 pr-4 text-gray-700 font-medium">{row.aspecto}</td>
                        <td className="py-2.5 pr-4 text-gray-600">{row.actuales}</td>
                        <td className="py-2.5 pr-4 text-gray-600">{row.nuevos}</td>
                        <td className="py-2.5 text-gray-600">{row.integral}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-gray-400">
                Si no estas seguro, empieza con &quot;Reestructurar Compensacion&quot; — es el caso mas comun.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="flex justify-center">
        <button
          onClick={handleContinuar}
          disabled={!flujoSeleccionado}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-base transition-all duration-200 ${
            flujoSeleccionado
              ? 'bg-tikin-red text-white hover:bg-red-600 shadow-lg shadow-red-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continuar
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Change Warning Dialog */}
      {showChangeWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="alertdialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Cambiar tipo de flujo</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Cambiar el tipo de flujo borrara los datos de empleados y configuracion de bonos ingresados. Los datos de empresa se conservaran.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowChangeWarning(false); setPendingFlujo(null) }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmChange}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-tikin-red hover:bg-red-600 transition-colors"
              >
                Cambiar Flujo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
