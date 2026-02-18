'use client'

import { useBonosStore } from '@/store/bonosStore'

const PASOS_BONOS = [
  { numero: 0, nombre: 'Empresa', descripcion: 'Datos de la empresa' },
  { numero: 1, nombre: 'Cotización', descripcion: 'Tipo de cotización' },
  { numero: 2, nombre: 'Empleados', descripcion: 'Carga empleados' },
  { numero: 3, nombre: 'Bonos', descripcion: 'Selecciona los bonos' },
  { numero: 4, nombre: 'Resultados', descripcion: 'Revisa y descarga' },
]

const PASOS_INTEGRAL = [
  { numero: 0, nombre: 'Empresa', descripcion: 'Datos de la empresa' },
  { numero: 1, nombre: 'Cotización', descripcion: 'Tipo de cotización' },
  { numero: 2, nombre: 'Empleados', descripcion: 'Salarios actuales' },
  { numero: 3, nombre: 'Bonos', descripcion: 'Selecciona los bonos' },
  { numero: 4, nombre: 'Resultados', descripcion: 'Comparación integral' },
]

export function WizardStepper() {
  const { pasoActual, setPasoActual, flujoSeleccionado } = useBonosStore()

  const isIntegral = flujoSeleccionado === 'salario_integral'
  const PASOS = isIntegral ? PASOS_INTEGRAL : PASOS_BONOS

  const handlePasoClick = (paso: number) => {
    // Solo permitir retroceder, no avanzar
    if (paso < pasoActual) {
      setPasoActual(paso)
    }
  }

  return (
    <div className="flex items-center justify-center max-w-4xl mx-auto">
      {PASOS.map((paso, index) => (
        <div key={paso.numero} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            {/* Círculo del paso */}
            <button
              onClick={() => handlePasoClick(paso.numero)}
              disabled={paso.numero > pasoActual}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 font-semibold transition-all duration-300 ${
                paso.numero === pasoActual
                  ? isIntegral
                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200 scale-110 cursor-default'
                    : 'bg-tikin-red text-white border-tikin-red shadow-lg shadow-red-200 scale-110 cursor-default'
                  : paso.numero < pasoActual
                  ? 'bg-green-500 text-white border-green-500 shadow-md cursor-pointer'
                  : 'bg-white text-gray-400 border-gray-300 cursor-not-allowed'
              }`}
            >
              {paso.numero < pasoActual ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                paso.numero
              )}
              {paso.numero === pasoActual && (
                <span className={`absolute -inset-1 rounded-full opacity-20 animate-pulse ${
                  isIntegral ? 'bg-purple-600' : 'bg-tikin-red'
                }`}></span>
              )}
            </button>

            {/* Label */}
            <div className="mt-3 text-center">
              <div className={`text-sm font-semibold transition-colors ${
                paso.numero === pasoActual
                  ? isIntegral ? 'text-purple-600' : 'text-tikin-red'
                  : paso.numero < pasoActual ? 'text-green-600' : 'text-gray-500'
              }`}>
                {paso.nombre}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 hidden sm:block">{paso.descripcion}</div>
            </div>
          </div>

          {/* Línea conectora */}
          {index < PASOS.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 relative" style={{ maxWidth: '100px' }}>
              <div className="absolute inset-0 bg-gray-300"></div>
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  paso.numero < pasoActual ? 'bg-green-500' : 'bg-gray-300'
                }`}
                style={{
                  width: paso.numero < pasoActual ? '100%' : '0%'
                }}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
