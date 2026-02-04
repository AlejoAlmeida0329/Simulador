'use client'

import { BonusType } from '@/types/bonuses'
import { formatCOP } from '@/lib/formatters'
import { LIMITE_ALIMENTACION_MENSUAL } from '@/types/bonuses'

interface BonusTypeSelectorProps {
  onSelect: (tipo: BonusType) => void
}

export function BonusTypeSelector({ onSelect }: BonusTypeSelectorProps) {
  const options = [
    {
      id: 'mera_liberalidad' as BonusType,
      title: 'Bonos de Mera Liberalidad',
      description: 'Bonos sin limitaciones de monto, ideales para incentivos extraordinarios y reconocimientos especiales.',
      features: [
        'Sin límite de monto por empleado',
        'Fee variable: 1.8% - 4% según monto total',
        'Exento de parafiscales',
        'No constituye salario'
      ],
      icon: '🎁',
      color: 'border-blue-200 hover:border-blue-400 hover:shadow-blue-100'
    },
    {
      id: 'alimentacion' as BonusType,
      title: 'Bonos de Alimentación',
      description: 'Bonos para apoyo alimentario con beneficios tributarios según normativa colombiana.',
      features: [
        `Límite: ${formatCOP(LIMITE_ALIMENTACION_MENSUAL)} por empleado/mes`,
        'Fee fijo: 1.25% sobre monto total',
        'Exento de parafiscales dentro del límite',
        'No constituye factor salarial'
      ],
      icon: '🍽️',
      color: 'border-green-200 hover:border-green-400 hover:shadow-green-100'
    },
    {
      id: 'ambos' as BonusType,
      title: 'Ambos Tipos de Bonos',
      description: 'Combina bonos de mera liberalidad y alimentación en una misma dispersión.',
      features: [
        'Dispersión combinada de ambos tipos',
        'Configuración independiente por tipo',
        'Validaciones automáticas de límites',
        'Resumen consolidado de costos'
      ],
      icon: '🎯',
      color: 'border-tikin-red hover:border-red-600 hover:shadow-red-100'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Selecciona el Tipo de Bono
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Elige el tipo de bono que deseas dispersar a tus empleados.
          Cada tipo tiene características y beneficios tributarios diferentes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`group relative bg-gradient-to-br from-white to-gray-50 border-2 ${option.color} rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-tikin-red focus:ring-opacity-50 overflow-hidden`}
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Content wrapper */}
            <div className="relative z-10">
              {/* Icon with background */}
              <div className="flex justify-center mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                  option.id === 'mera_liberalidad' ? 'bg-blue-100' :
                  option.id === 'alimentacion' ? 'bg-green-100' :
                  'bg-red-100'
                }`}>
                  {option.icon}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center group-hover:text-tikin-red transition-colors">
                {option.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-6 text-center min-h-[4rem] leading-relaxed">
                {option.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {option.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="flex-1">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-auto pt-6 border-t-2 border-gray-200">
                <div className="flex items-center justify-center text-tikin-red font-bold text-base group-hover:gap-3 gap-2 transition-all">
                  <span>Seleccionar</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Legal Notice */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800 text-center">
          <strong>Nota Legal:</strong> Los bonos de mera liberalidad y alimentación están exentos de parafiscales según la normativa colombiana vigente.
          Tikin se encarga de garantizar el cumplimiento de todos los requisitos legales en cada dispersión.
        </p>
      </div>
    </div>
  )
}
