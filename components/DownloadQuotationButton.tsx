'use client'

import { CompanyData, TikinCommission } from '@/types/company'
import { SavingsResult } from '@/types/scenarios'
import { ARLRiskLevel } from '@/lib/constants/parafiscales'
import { generateQuotationPDF } from '@/lib/pdf/generate-quotation'

interface DownloadQuotationButtonProps {
  companyData: CompanyData
  savingsData: SavingsResult
  tikinCommission: TikinCommission
  arlRiskLevel: ARLRiskLevel
  employeeCount: number
  totalPayroll: number
}

export function DownloadQuotationButton({
  companyData,
  savingsData,
  tikinCommission,
  arlRiskLevel,
  employeeCount,
  totalPayroll,
}: DownloadQuotationButtonProps) {
  const handleDownload = async () => {
    await generateQuotationPDF({
      companyData,
      savingsData,
      tikinCommission,
      arlRiskLevel,
      employeeCount,
      totalPayroll,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Generar Cotización
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Descarga la cotización completa en PDF para enviar al cliente
        </p>

        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 bg-tikin-red text-white px-8 py-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-tikin-red focus:ring-offset-2 transition-all font-medium text-base"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Descargar Cotización PDF
        </button>

        <p className="text-xs text-gray-500 mt-4">
          El PDF incluye datos del cliente, comparación de escenarios, ahorros y costos del servicio
        </p>
      </div>
    </div>
  )
}
