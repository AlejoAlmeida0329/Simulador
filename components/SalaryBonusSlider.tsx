'use client'

import { formatCOP } from '@/lib/formatters'

interface SalaryBonusSliderProps {
  salaryPercentage: number
  onSalaryPercentageChange: (value: number) => void
  totalCompensation: number
  minPercentage: number
  maxPercentage: number
}

export function SalaryBonusSlider({
  salaryPercentage,
  onSalaryPercentageChange,
  totalCompensation,
  minPercentage,
  maxPercentage,
}: SalaryBonusSliderProps) {
  const bonusPercentage = 100 - salaryPercentage
  const salaryAmount = (totalCompensation * salaryPercentage) / 100
  const bonusAmount = (totalCompensation * bonusPercentage) / 100

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        División Salario / Bono
      </h3>

      <div className="space-y-6">
        {/* Slider */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Mínimo {minPercentage}%</span>
            <span>Máximo {maxPercentage}%</span>
          </div>
          <input
            type="range"
            min={minPercentage}
            max={maxPercentage}
            step={1}
            value={salaryPercentage}
            onChange={(e) => onSalaryPercentageChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-tikin-red"
          />
        </div>

        {/* Percentages Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-1">
              Salario Base
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">
              {salaryPercentage}%
            </div>
            <div className="text-sm text-gray-600">
              {formatCOP(salaryAmount)}
            </div>
            {salaryPercentage === minPercentage && (
              <div className="text-xs text-orange-600 mt-2">
                ⚠️ Mínimo legal
              </div>
            )}
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <div className="text-xs font-medium text-gray-600 mb-1">
              Bono
            </div>
            <div className="text-3xl font-semibold text-tikin-red mb-1">
              {bonusPercentage}%
            </div>
            <div className="text-sm text-gray-600">
              {formatCOP(bonusAmount)}
            </div>
          </div>
        </div>

        {/* Info text */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-gray-700">
          <p>
            <strong>Importante:</strong> Los parafiscales se calculan únicamente sobre el{' '}
            <span className="font-semibold">salario base</span>.
            El bono está exento de estas contribuciones.
          </p>
        </div>
      </div>
    </div>
  )
}
