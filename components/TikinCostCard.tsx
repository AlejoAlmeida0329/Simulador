'use client'

import { TikinCommission, COMMISSION_LEVELS } from '@/types/company'
import { formatCOP, formatPercentage } from '@/lib/formatters'

interface TikinCostCardProps {
  commission: TikinCommission
}

export function TikinCostCard({ commission }: TikinCostCardProps) {
  const levelInfo = COMMISSION_LEVELS[commission.level as keyof typeof COMMISSION_LEVELS]

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Costo del Servicio Tikin
        </h2>
        <p className="text-sm text-gray-600">
          Inversión mensual
        </p>
      </div>

      {/* Nivel de comisión */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">
              Nivel de Comisión Aplicable
            </p>
            <p className="text-lg font-semibold text-tikin-red">
              {levelInfo.label} - {formatPercentage(commission.percentage * 100)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Bonos mensuales</p>
            <p className="text-sm font-medium text-gray-900">
              {formatCOP(commission.monthlyBonusTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Desglose de costos */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <span className="text-sm text-gray-600">Comisión base:</span>
          <span className="text-lg font-medium text-gray-900">
            {formatCOP(commission.baseCommission)}
          </span>
        </div>

        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <span className="text-sm text-gray-600">IVA (19%):</span>
          <span className="text-lg font-medium text-gray-900">
            {formatCOP(commission.iva)}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-base font-semibold text-gray-900">
            Costo Total Mensual:
          </span>
          <span className="text-2xl font-semibold text-tikin-red">
            {formatCOP(commission.totalCost)}
          </span>
        </div>
      </div>
    </div>
  )
}
