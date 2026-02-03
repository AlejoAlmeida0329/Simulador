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
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Selecciona el Tipo de Bono
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Elige el tipo de bono que deseas dispersar a tus empleados.
          Cada tipo tiene características y beneficios tributarios diferentes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`group relative bg-white border-2 ${option.color} rounded-xl p-6 text-left transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-tikin-red focus:ring-offset-2`}
          >
            {/* Icon */}
            <div className="text-5xl mb-4 text-center">
              {option.icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              {option.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 text-center min-h-[3rem]">
              {option.description}
            </p>

            {/* Features */}
            <ul className="space-y-2 mb-4">
              {option.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <span className="text-green-500 mr-2 mt-0.5 flex-shrink-0">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <span className="text-tikin-red font-semibold text-sm group-hover:underline">
                Seleccionar →
              </span>
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
