'use client'

import { useState } from 'react'
import { CompanyData, TikinCommission } from '@/types/company'
import { SavingsResult } from '@/types/scenarios'
import { ARLRiskLevel } from '@/lib/constants/parafiscales'
import { generateQuotationPDF } from '@/lib/pdf/generate-quotation'
import { saveQuotation } from '@/lib/supabase/quotations'
import { QuotationInsert } from '@/types/quotation'

interface DownloadQuotationButtonProps {
  companyData: CompanyData
  savingsData: SavingsResult
  tikinCommission: TikinCommission
  arlRiskLevel: ARLRiskLevel
  employeeCount: number
  totalPayroll: number
  onNewQuotation?: () => void
  onSaveQuotation?: () => void
}

export function DownloadQuotationButton({
  companyData,
  savingsData,
  tikinCommission,
  arlRiskLevel,
  employeeCount,
  totalPayroll,
  onNewQuotation,
  onSaveQuotation,
}: DownloadQuotationButtonProps) {
  const [downloaded, setDownloaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleDownload = async () => {
    await generateQuotationPDF({
      companyData,
      savingsData,
      tikinCommission,
      arlRiskLevel,
      employeeCount,
      totalPayroll,
    })
    setDownloaded(true)
  }

  const handleSaveQuotation = async () => {
    setSaving(true)
    setSaveError(null)

    try {
      // Construir el objeto de cotización para Supabase
      const quotationData: QuotationInsert = {
        // Datos de la empresa
        company_name: companyData.companyName,
        contact_name: companyData.contactName,
        email: companyData.email,
        phone: companyData.phone || '',
        nit: companyData.nit,

        // Datos de empleados y nómina
        employee_count: employeeCount,
        total_payroll: totalPayroll,
        arl_risk_level: arlRiskLevel,

        // Datos del escenario Tikin
        salary_percentage: savingsData.tikin.salaryPercentage,
        bonus_percentage: savingsData.tikin.bonusPercentage,
        monthly_bonus_total: savingsData.tikin.totalBonusAmount,

        // Ahorros
        monthly_savings: savingsData.monthlyParafiscalesSavings,
        annual_savings: savingsData.annualParafiscalesSavings,
        percentage_reduction: savingsData.percentageReduction,

        // Comisión Tikin
        commission_level: tikinCommission.level,
        commission_percentage: tikinCommission.percentage,
        base_commission: tikinCommission.baseCommission,
        iva: tikinCommission.iva,
        total_commission: tikinCommission.total,

        // Beneficio neto
        net_monthly_savings: savingsData.netMonthlySavings,
        net_annual_savings: savingsData.netAnnualSavings,

        // Metadata
        generated_by: 'Simulador Tikin',
        pdf_filename: `cotizacion_${companyData.companyName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`
      }

      const result = await saveQuotation(quotationData)

      if (result.success) {
        if (onSaveQuotation) {
          onSaveQuotation()
        }
      } else {
        setSaveError(result.error || 'Error al guardar la cotización')
      }
    } catch (error) {
      console.error('Error saving quotation:', error)
      setSaveError('Error inesperado al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleNewQuotation = () => {
    setDownloaded(false)
    if (onNewQuotation) {
      onNewQuotation()
    }
  }

  if (!downloaded) {
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-green-100 rounded-full p-3">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Cotización Generada
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          El PDF ha sido descargado exitosamente
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleSaveQuotation}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Guardando...
              </>
            ) : (
              <>
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
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Guardar Cotización
              </>
            )}
          </button>

          <button
            onClick={handleNewQuotation}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-tikin-red text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-tikin-red focus:ring-offset-2 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nueva Cotización
          </button>
        </div>

        {saveError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <span className="font-semibold">Error:</span> {saveError}
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          Puedes guardar esta cotización en la base de datos para referencia futura o crear una nueva
        </p>
      </div>
    </div>
  )
}
