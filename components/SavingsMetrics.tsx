'use client'

import { SavingsResult } from '@/types/scenarios'
import { formatCOP, formatPercentage } from '@/lib/formatters'

interface SavingsMetricsProps {
  savingsData: SavingsResult
}

export function SavingsMetrics({ savingsData }: SavingsMetricsProps) {
  const { monthlySavings, percentageReduction } = savingsData

  return (
    <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-xl p-8 border-2 border-green-200 animate-slide-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Optimización Estimada
        </h2>
        <p className="text-base text-gray-600">
          Potencial reducción en costos laborales obligatorios
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Monthly Savings */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center border-2 border-green-300 hover:shadow-lg transition-shadow">
          <div className="flex justify-center mb-3">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-green-700 mb-2">
            Optimización Mensual Estimada
          </div>
          <div className="text-4xl font-bold text-green-600 mb-2">
            {formatCOP(monthlySavings)}
          </div>
          <div className="text-xs text-green-700">
            Potencial reducción en costos cada mes
          </div>
        </div>

        {/* Percentage Reduction */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center border-2 border-blue-300 hover:shadow-lg transition-shadow">
          <div className="flex justify-center mb-3">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-blue-700 mb-2">
            Reducción Porcentual
          </div>
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {formatPercentage(percentageReduction)}
          </div>
          <div className="text-xs text-blue-700">
            Menos en costos laborales
          </div>
        </div>
      </div>

      {/* Annual projection */}
      <div className="relative overflow-hidden bg-gradient-to-r from-tikin-red to-red-600 rounded-xl p-8 text-center shadow-lg">
        <div className="absolute inset-0 bg-white opacity-10"></div>
        <div className="relative z-10">
          <div className="flex justify-center mb-3">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm font-bold text-white mb-2">
            Proyección Anual Estimada
          </div>
          <div className="text-5xl font-bold text-white mb-2">
            {formatCOP(monthlySavings * 12)}
          </div>
          <div className="text-sm text-red-100 mt-2">
            Potencial optimización en 12 meses con Tikin
          </div>
        </div>
      </div>
    </div>
  )
}
