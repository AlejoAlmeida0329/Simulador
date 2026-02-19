'use client'

import { useEffect, useState } from 'react'
import { useBonosStore } from '@/store/bonosStore'
import { generateQuotationPDF } from '@/lib/pdf/generate-quotation'
import { saveCotizacion } from '@/lib/supabase/quotations'
import { notify } from '@/lib/utils/notifications'
import type { TikinCommission, SavingsEstimate, FinancialSummary, BonusTotals } from '@/lib/bonos/types'
import type { ParafiscalesBreakdown } from '@/types/calculations'
import { BONUS_TYPES_METADATA, BonusCategory } from '@/lib/bonos/constants'

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value)

/**
 * ResultsStep - Paso 4: Resultados con tabla comparativa detallada,
 * comisiones Tikin y acciones.
 */
export function ResultsStep() {
  const {
    validacion,
    resumenFinanciero,
    comisionesTikin,
    ahorrosEstimados,
    ejecutarValidacion,
    calcularResumenFinanciero,
    calcularComisiones,
    calcularAhorros,
    pasoAnterior,
    resetear,
    marcarComoGuardado,
    guardadoEnBD,
    datosEmpresa,
    configuracion,
    flujoSeleccionado,
    lotes,
    empleados
  } = useBonosStore()

  const esNuevosBeneficios = flujoSeleccionado === 'nuevos_beneficios'

  const [loading, setLoading] = useState(true)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(guardadoEnBD)
  const [notLoggedIn, setNotLoggedIn] = useState(false)

  // Run calculations sequentially on mount
  useEffect(() => {
    const runCalculations = async () => {
      setLoading(true)
      ejecutarValidacion()
      await tick()
      calcularResumenFinanciero()
      await tick()
      await calcularComisiones()
      await tick()
      calcularAhorros()
      await tick()
      setLoading(false)
    }
    runCalculations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNuevaCotizacion = () => {
    if (showResetConfirm) {
      resetear()
      setShowResetConfirm(false)
    } else {
      setShowResetConfirm(true)
    }
  }

  const handleDownloadPDF = async () => {
    if (!resumenFinanciero || !comisionesTikin || !ahorrosEstimados || !validacion) return
    setDownloading(true)
    try {
      await generateQuotationPDF({
        datosEmpresa: datosEmpresa,
        arlRiskLevel: lotes[0]?.arlRiskLevel || empleados[0]?.arlRiskLevel || 'I',
        tiposBonoSeleccionados: configuracion.bonusSelection.tiposSeleccionados,
        lotes: lotes.map(l => ({
          nombre: l.nombre,
          cantidad: l.cantidad,
          salarioPorEmpleado: l.salarioPorEmpleado,
          bonos: l.bonos as Record<string, number>,
          totalSalarios: l.totalSalarios,
          totalBonos: l.totalBonos,
          totalCompensacion: l.totalCompensacion
        })),
        resumenFinanciero,
        validacion,
        comisionesTikin,
        ahorrosEstimados,
        totalEmpleados: validacion.totalEmpleados
      })
      setDownloaded(true)
    } catch {
      notify.error('Error al generar el PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleSave = async () => {
    if (!resumenFinanciero || !comisionesTikin || !validacion) return
    setSaving(true)
    setNotLoggedIn(false)

    const result = await saveCotizacion({
      company_name: datosEmpresa?.razonSocial || 'Sin nombre',
      contact_name: datosEmpresa?.contactoNombre || null,
      email: datosEmpresa?.contactoEmail || null,
      phone: datosEmpresa?.contactoTelefono || null,
      nit: datosEmpresa?.nit || null,
      arl_risk_level: lotes[0]?.arlRiskLevel || empleados[0]?.arlRiskLevel || 'I',
      obligado_parafiscales: datosEmpresa?.obligadoParafiscales ?? true,
      split_salary_pct: configuracion.split.porcentajeSalario,
      split_bonus_pct: configuracion.split.porcentajeBonos,
      bonus_types_selected: configuracion.bonusSelection.tiposSeleccionados,
      data_input_method: configuracion.dataLoad.metodo,
      total_employees: validacion.totalEmpleados,
      total_salary: resumenFinanciero.totalSalarios,
      total_bonuses: resumenFinanciero.totalBonosTotal,
      total_compensation: resumenFinanciero.totalCompensacion,
      financial_summary: resumenFinanciero as unknown as Record<string, unknown>,
      tikin_commission: comisionesTikin as unknown as Record<string, unknown>,
      savings_estimate: ahorrosEstimados as unknown as Record<string, unknown>,
      lotes_data: lotes.map(l => ({
        nombre: l.nombre,
        cantidad: l.cantidad,
        salarioPorEmpleado: l.salarioPorEmpleado,
        bonos: l.bonos,
        totalSalarios: l.totalSalarios,
        totalBonos: l.totalBonos,
        totalCompensacion: l.totalCompensacion
      })) as unknown as Record<string, unknown>[],
      status: 'pending',
      notes: null,
      pdf_filename: null
    })

    setSaving(false)

    if (result.success && result.data) {
      setSaved(true)
      marcarComoGuardado(result.data.id)
      notify.success('Cotizacion guardada exitosamente')
    } else if (result.error?.includes('no autenticado')) {
      setNotLoggedIn(true)
    } else {
      notify.error(result.error || 'Error al guardar la cotizacion')
    }
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Resultados de la Cotizacion
          </h2>
          <p className="text-gray-600">
            Calculando resultados...
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-tikin-red rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Procesando validaciones y calculos financieros</p>
        </div>
      </div>
    )
  }

  const trad = ahorrosEstimados?.detalleTradicional
  const tikin = ahorrosEstimados?.detalleTikin
  const hasDetail = !!trad && !!tikin

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Resultados de la Cotizacion
        </h2>
        <p className="text-gray-600">
          {esNuevosBeneficios
            ? 'Revisa el costo de los nuevos beneficios y la eficiencia vs un aumento directo'
            : 'Revisa los resultados, valida el cumplimiento legal y analiza el ahorro estimado'
          }
        </p>
      </div>

      {/* Main Results — differentiated by flow */}
      {hasDetail ? (
        esNuevosBeneficios ? (
          <NuevosBeneficiosView
            trad={trad}
            tikin={tikin}
            ahorros={ahorrosEstimados!}
            resumen={resumenFinanciero!}
            comisiones={comisionesTikin!}
            regimen={datosEmpresa?.regimenParafiscales || 'general'}
          />
        ) : (
          <>
            {resumenFinanciero && (
              <SalaryStructureCard resumenFinanciero={resumenFinanciero} />
            )}
            {resumenFinanciero && comisionesTikin && (
              <BonusBreakdownCard resumen={resumenFinanciero} comisiones={comisionesTikin} />
            )}
            <ComparisonTable
              trad={trad}
              tikin={tikin}
              ahorros={ahorrosEstimados!}
              regimen={datosEmpresa?.regimenParafiscales || 'general'}
            />
          </>
        )
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Datos detallados no disponibles</p>
        </div>
      )}

      {/* Tikin Commission Summary */}
      {comisionesTikin && ahorrosEstimados && (
        <CommissionSummary
          comisiones={comisionesTikin}
          ahorros={ahorrosEstimados}
        />
      )}

      {/* Actions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mb-4">
            <svg className="w-7 h-7 text-tikin-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Cotizacion Lista</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Descarga el PDF o guarda la cotizacion en tu cuenta para consultarla despues
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-2 bg-tikin-red text-white px-8 py-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-tikin-red focus:ring-offset-2 transition-all font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar PDF
                </>
              )}
            </button>
            {/* Save to DB */}
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-lg font-medium text-base transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed ${
                saved
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900 disabled:opacity-50'
              }`}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : saved ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardada
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Guardar Cotizacion
                </>
              )}
            </button>
          </div>
          {/* Status messages */}
          {downloaded && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-700 font-medium">PDF descargado exitosamente</span>
            </div>
          )}
          {notLoggedIn && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm text-amber-700 font-medium">
                Inicia sesion para guardar la cotizacion.{' '}
                <a href="/login" className="underline hover:text-amber-900">Ir a login</a>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={pasoAnterior}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <button
          onClick={handleNuevaCotizacion}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            showResetConfirm
              ? 'bg-red-700 text-white hover:bg-red-800'
              : 'bg-tikin-red text-white hover:bg-red-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {showResetConfirm ? 'Confirmar Nueva Cotizacion' : 'Nueva Cotizacion'}
        </button>
        <button
          onClick={() => { resetear(); window.location.href = '/' }}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Ir al Inicio
        </button>
      </div>

      {showResetConfirm && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-sm text-amber-800">
            Se borraran todos los datos de la cotizacion actual. Esta accion no se puede deshacer.
          </p>
          <button
            onClick={() => setShowResetConfirm(false)}
            className="mt-2 text-sm text-amber-700 underline hover:text-amber-900"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// Salary Structure Card (beneficios_actuales flow)
// ============================================

function SalaryStructureCard({ resumenFinanciero }: { resumenFinanciero: FinancialSummary }) {
  const pctSalario = resumenFinanciero.porcentajeSalarios
  const pctBonos = resumenFinanciero.porcentajeBonos

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Estructura de Compensacion</h3>
        <p className="text-sm text-gray-500 mt-1">Como se distribuye la compensacion total mensual de tus empleados</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Total compensation */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Compensacion Total Mensual</p>
          <p className="text-3xl font-bold text-gray-900">{formatCOP(resumenFinanciero.totalCompensacion)}</p>
        </div>

        {/* Stacked bar */}
        <div className="w-full h-8 rounded-full overflow-hidden flex bg-gray-100">
          <div
            className="h-full bg-indigo-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${pctSalario}%` }}
          >
            {pctSalario >= 15 && (
              <span className="text-xs font-semibold text-white">{pctSalario.toFixed(0)}%</span>
            )}
          </div>
          <div
            className="h-full bg-emerald-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${pctBonos}%` }}
          >
            {pctBonos >= 10 && (
              <span className="text-xs font-semibold text-white">{pctBonos.toFixed(0)}%</span>
            )}
          </div>
        </div>

        {/* Two metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Salary card */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <h4 className="text-sm font-semibold text-indigo-900">Salario ({pctSalario.toFixed(0)}%)</h4>
            </div>
            <p className="text-2xl font-bold text-indigo-700 mb-2">{formatCOP(resumenFinanciero.totalSalarios)}</p>
            <p className="text-xs text-indigo-600/80 leading-relaxed">
              Ingreso Base de Cotizacion (IBC) para seguridad social, parafiscales y prestaciones
            </p>
          </div>

          {/* Bonuses card */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <h4 className="text-sm font-semibold text-emerald-900">Bonos ({pctBonos.toFixed(0)}%)</h4>
            </div>
            <p className="text-2xl font-bold text-emerald-700 mb-2">{formatCOP(resumenFinanciero.totalBonosTotal)}</p>
            <p className="text-xs text-emerald-600/80 leading-relaxed">
              No salarial &mdash; Art. 128 CST. No genera aportes ni prestaciones
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Antes:</span> el 100% de la compensacion constituia salario, generando aportes a seguridad social, parafiscales y prestaciones sobre el total.
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-medium">Ahora:</span> solo el <span className="font-semibold text-indigo-700">{pctSalario.toFixed(0)}%</span> es base de cotizacion (IBC). El <span className="font-semibold text-emerald-700">{pctBonos.toFixed(0)}%</span> se entrega como pagos no constitutivos de salario (Art. 128 CST).
              </p>
              <p className="text-xs text-gray-500 mt-2 italic">
                Ley 1393/2010, Art. 30: los pagos no constitutivos de salario no pueden superar el 40% de la remuneracion total. El IBC minimo legal es el 60%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Comparison Table
// ============================================

function ComparisonTable({
  trad,
  tikin,
  ahorros,
  regimen
}: {
  trad: ParafiscalesBreakdown
  tikin: ParafiscalesBreakdown
  ahorros: SavingsEstimate
  regimen?: string
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const isExonerado = regimen === 'exonerado'
  const pctSaving = (a: number, b: number) => a > 0 ? Math.round(((a - b) / a) * 100) : 0
  const totalPct = pctSaving(ahorros.costoTradicionalMensual, ahorros.costoConTikinMensual)
  const tikinBarPct = ahorros.costoTradicionalMensual > 0
    ? (ahorros.costoConTikinMensual / ahorros.costoTradicionalMensual) * 100
    : 0

  const categories = [
    {
      key: 'ss',
      title: 'Seguridad Social',
      accentColor: 'blue' as const,
      tradTotal: trad.subtotalSeguridadSocial,
      tikinTotal: tikin.subtotalSeguridadSocial,
      items: [
        { label: 'Salud (8.5%)', trad: trad.health, tikin: tikin.health, exonerado: isExonerado },
        { label: 'Pension (12%)', trad: trad.pension, tikin: tikin.pension },
        { label: 'ARL', trad: trad.arl, tikin: tikin.arl },
      ]
    },
    {
      key: 'paraf',
      title: 'Aportes Parafiscales',
      accentColor: 'amber' as const,
      tradTotal: trad.subtotalParafiscales,
      tikinTotal: tikin.subtotalParafiscales,
      items: [
        { label: 'SENA (2%)', trad: trad.sena, tikin: tikin.sena, exonerado: isExonerado },
        { label: 'ICBF (3%)', trad: trad.icbf, tikin: tikin.icbf, exonerado: isExonerado },
        { label: 'Caja Comp. (4%)', trad: trad.caja, tikin: tikin.caja },
      ]
    },
    {
      key: 'prest',
      title: 'Prestaciones Sociales',
      accentColor: 'purple' as const,
      tradTotal: trad.subtotalPrestaciones,
      tikinTotal: tikin.subtotalPrestaciones,
      items: [
        { label: 'Prima (8.33%)', trad: trad.prima, tikin: tikin.prima },
        { label: 'Cesantias (8.33%)', trad: trad.cesantias, tikin: tikin.cesantias },
        { label: 'Int. Cesantias (1%)', trad: trad.interesesCesantias, tikin: tikin.interesesCesantias },
        { label: 'Vacaciones (4.17%)', trad: trad.vacaciones, tikin: tikin.vacaciones },
      ]
    }
  ]

  const colorStyles = {
    blue: { borderL: 'border-l-blue-500', dot: 'bg-blue-500' },
    amber: { borderL: 'border-l-amber-500', dot: 'bg-amber-500' },
    purple: { borderL: 'border-l-purple-500', dot: 'bg-purple-500' }
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Comparativo de Costos Patronales</h3>
            <p className="text-sm text-gray-500 mt-1">Aportes mensuales del empleador: esquema tradicional vs estructura con bonos Tikin</p>
          </div>
          {isExonerado && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs font-medium text-emerald-700">Exonerado (Art. 114-1 E.T.) | IBC min. 60% (Ley 1393/2010)</span>
            </div>
          )}
        </div>
        {/* Legend */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50/60 rounded-lg border border-red-100">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
            <span className="text-xs text-red-700">Tradicional &mdash; 100% de la compensacion es IBC</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-xs text-emerald-700">Con Tikin &mdash; IBC reducido + bonos no salariales</span>
          </div>
        </div>
      </div>

      {/* Category cards */}
      {categories.map(cat => {
        const saving = cat.tradTotal - cat.tikinTotal
        const pct = pctSaving(cat.tradTotal, cat.tikinTotal)
        const isOpen = openSections[cat.key]
        const styles = colorStyles[cat.accentColor]

        return (
          <div key={cat.key} className={`bg-white rounded-xl shadow-sm border border-gray-200 ${styles.borderL} border-l-4 overflow-hidden`}>
            {/* Clickable header */}
            <button
              type="button"
              onClick={() => toggleSection(cat.key)}
              className="w-full px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full ${styles.dot} flex-shrink-0`} />
                <span className="font-semibold text-gray-900 text-sm">{cat.title}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Trad → Tikin (desktop) */}
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span className="text-gray-400 tabular-nums">{formatCOP(cat.tradTotal)}</span>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="font-medium text-gray-900 tabular-nums">{formatCOP(cat.tikinTotal)}</span>
                </div>
                {/* Savings badge */}
                {saving > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    {pct}%
                  </span>
                )}
                {/* Chevron */}
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded detail items */}
            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {cat.items.map(item => {
                  const itemSaving = item.trad - item.tikin
                  return (
                    <div key={item.label} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {item.label}
                          {'exonerado' in item && item.exonerado && item.trad === 0 && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                              Exonerado
                            </span>
                          )}
                        </span>
                        {itemSaving > 0 && (
                          <span className="text-xs font-semibold text-emerald-600">&minus;{formatCOP(itemSaving)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="w-2 h-2 rounded-full bg-red-300 flex-shrink-0" />
                          <span className="text-gray-500 tabular-nums">{formatCOP(item.trad)}</span>
                        </div>
                        <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          <span className="font-medium text-gray-700 tabular-nums">{formatCOP(item.tikin)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Grand Total Card */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-200 overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Tradicional */}
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start mb-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Tradicional</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCOP(ahorros.costoTradicionalMensual)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatCOP(ahorros.costoTradicionalMensual * 12)} / ano</p>
            </div>
            {/* Con Tikin */}
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Con Tikin</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCOP(ahorros.costoConTikinMensual)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatCOP(ahorros.costoConTikinMensual * 12)} / ano</p>
            </div>
            {/* Ahorro */}
            <div className="text-center sm:text-right">
              <p className="text-xs text-emerald-600 uppercase tracking-wide font-semibold mb-1">Ahorro Total</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCOP(ahorros.ahorroMensualEstimado)}</p>
              <div className="flex items-center justify-center sm:justify-end gap-2 mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  &minus;{totalPct}%
                </span>
                <span className="text-xs text-emerald-500">{formatCOP(ahorros.ahorroAnualEstimado)} / ano</span>
              </div>
            </div>
          </div>

          {/* Visual comparison bars */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">Tradicional</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-red-400/70 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">Con Tikin</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${tikinBarPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Nuevos Beneficios View — Redesigned with card/accordion UX
// ============================================

function NuevosBeneficiosView({
  trad,
  tikin,
  ahorros,
  resumen,
  comisiones,
  regimen
}: {
  trad: ParafiscalesBreakdown
  tikin: ParafiscalesBreakdown
  ahorros: SavingsEstimate
  resumen: FinancialSummary
  comisiones: TikinCommission
  regimen: string
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const totalBonos = resumen.totalBonosTotal
  const salarioActual = resumen.totalSalarios
  const totalComp = resumen.totalCompensacion
  const pctSalario = resumen.porcentajeSalarios
  const pctBonos = resumen.porcentajeBonos
  const isExonerado = regimen === 'exonerado'

  const pctSaving = (a: number, b: number) => a > 0 ? Math.round(((a - b) / a) * 100) : 0

  // Accordion categories
  const categories = [
    {
      key: 'ss',
      title: 'Seguridad Social',
      accentColor: 'blue' as const,
      tradTotal: trad.subtotalSeguridadSocial,
      tikinTotal: tikin.subtotalSeguridadSocial,
      items: [
        { label: 'Salud (8.5%)', aumento: trad.health, bono: tikin.health, exonerado: isExonerado },
        { label: 'Pension (12%)', aumento: trad.pension, bono: tikin.pension },
        { label: 'ARL', aumento: trad.arl, bono: tikin.arl },
      ]
    },
    {
      key: 'paraf',
      title: 'Aportes Parafiscales',
      accentColor: 'amber' as const,
      tradTotal: trad.subtotalParafiscales,
      tikinTotal: tikin.subtotalParafiscales,
      items: [
        { label: 'SENA (2%)', aumento: trad.sena, bono: tikin.sena, exonerado: isExonerado },
        { label: 'ICBF (3%)', aumento: trad.icbf, bono: tikin.icbf, exonerado: isExonerado },
        { label: 'Caja Comp. (4%)', aumento: trad.caja, bono: tikin.caja },
      ]
    },
    {
      key: 'prest',
      title: 'Prestaciones Sociales',
      accentColor: 'purple' as const,
      tradTotal: trad.subtotalPrestaciones,
      tikinTotal: tikin.subtotalPrestaciones,
      items: [
        { label: 'Prima (8.33%)', aumento: trad.prima, bono: tikin.prima },
        { label: 'Cesantias (8.33%)', aumento: trad.cesantias, bono: tikin.cesantias },
        { label: 'Int. Cesantias (1%)', aumento: trad.interesesCesantias, bono: tikin.interesesCesantias },
        { label: 'Vacaciones (4.17%)', aumento: trad.vacaciones, bono: tikin.vacaciones },
      ]
    }
  ]

  const colorStyles = {
    blue: { borderL: 'border-l-blue-500', dot: 'bg-blue-500' },
    amber: { borderL: 'border-l-amber-500', dot: 'bg-amber-500' },
    purple: { borderL: 'border-l-purple-500', dot: 'bg-purple-500' }
  }

  return (
    <div className="space-y-4">
      {/* ── 1. Compensation Overview Card ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Nueva Estructura de Compensacion</h3>
          <p className="text-sm text-gray-500 mt-1">Tu empleado mantiene su salario actual y recibe bonos adicionales como beneficio no salarial</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Total compensation */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Compensacion Total Mensual</p>
            <p className="text-3xl font-bold text-gray-900">{formatCOP(totalComp)}</p>
          </div>

          {/* Stacked bar */}
          <div className="w-full h-8 rounded-full overflow-hidden flex bg-gray-100">
            <div
              className="h-full bg-indigo-500 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${pctSalario}%` }}
            >
              {pctSalario >= 15 && (
                <span className="text-xs font-semibold text-white">{pctSalario.toFixed(0)}%</span>
              )}
            </div>
            <div
              className="h-full bg-emerald-500 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${pctBonos}%` }}
            >
              {pctBonos >= 10 && (
                <span className="text-xs font-semibold text-white">{pctBonos.toFixed(0)}%</span>
              )}
            </div>
          </div>

          {/* Two metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <h4 className="text-sm font-semibold text-indigo-900">Salario Actual ({pctSalario.toFixed(0)}%)</h4>
              </div>
              <p className="text-2xl font-bold text-indigo-700 mb-2">{formatCOP(salarioActual)}</p>
              <p className="text-xs text-indigo-600/80 leading-relaxed">
                Se mantiene intacto &mdash; es la base de cotizacion (IBC) para seguridad social, parafiscales y prestaciones
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <h4 className="text-sm font-semibold text-emerald-900">Nuevos Bonos ({pctBonos.toFixed(0)}%)</h4>
              </div>
              <p className="text-2xl font-bold text-emerald-700 mb-2">{formatCOP(totalBonos)}</p>
              <p className="text-xs text-emerald-600/80 leading-relaxed">
                Beneficio adicional no salarial &mdash; Art. 128 CST. No genera aportes ni prestaciones
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Propuesta:</span> ademas del salario actual de <span className="font-semibold text-indigo-700">{formatCOP(salarioActual)}</span>, el empleado recibe <span className="font-semibold text-emerald-700">{formatCOP(totalBonos)}</span> en bonos no salariales.
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Ventaja:</span> el bono no genera cargas laborales adicionales (seguridad social, parafiscales ni prestaciones), lo que lo hace mas eficiente que un aumento salarial directo por el mismo monto.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  <span className="font-medium">Fundamento legal:</span> Art. 128 CST (pagos no constitutivos de salario), Ley 1393/2010 Art. 30 (limite del 40%), Art. 127 CST (definicion de salario).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Bonus Breakdown ── */}
      <BonusBreakdownCard resumen={resumen} comisiones={comisiones} />

      {/* ── 3. Accordion Breakdown (same pattern as ComparisonTable) ── */}
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5">
          <h3 className="text-lg font-semibold text-gray-900">Desglose de Cargas Laborales</h3>
          <p className="text-sm text-gray-500 mt-1">Comparativo mensual: aumento salarial de {formatCOP(totalBonos)} vs bono no salarial por el mismo monto</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              Art. 128 CST &mdash; Pagos no constitutivos de salario
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              Ley 1393/2010, Art. 30 &mdash; Limite 40% no salarial
            </span>
            {isExonerado && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Art. 114-1 E.T. &mdash; Exoneracion de aportes (Ley 1607/2012)
              </span>
            )}
          </div>
        </div>

        {/* Category cards */}
        {categories.map(cat => {
          const saving = cat.tradTotal - cat.tikinTotal
          const pct = pctSaving(cat.tradTotal, cat.tikinTotal)
          const isOpen = openSections[cat.key]
          const styles = colorStyles[cat.accentColor]

          return (
            <div key={cat.key} className={`bg-white rounded-xl shadow-sm border border-gray-200 ${styles.borderL} border-l-4 overflow-hidden`}>
              <button
                type="button"
                onClick={() => toggleSection(cat.key)}
                className="w-full px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${styles.dot} flex-shrink-0`} />
                  <span className="font-semibold text-gray-900 text-sm">{cat.title}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="hidden sm:flex items-center gap-2 text-sm">
                    <span className="text-gray-400 tabular-nums">{formatCOP(cat.tradTotal)}</span>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="font-medium text-gray-900 tabular-nums">{formatCOP(cat.tikinTotal)}</span>
                  </div>
                  {saving > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      {pct}%
                    </span>
                  )}
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {cat.items.map(item => {
                    const itemSaving = item.aumento - item.bono
                    return (
                      <div key={item.label} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">
                            {item.label}
                            {'exonerado' in item && item.exonerado && item.aumento === 0 && (
                              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                                Exonerado
                              </span>
                            )}
                          </span>
                          {itemSaving > 0 && (
                            <span className="text-xs font-semibold text-emerald-600">&minus;{formatCOP(itemSaving)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1.5 text-xs">
                            <div className="w-2 h-2 rounded-full bg-red-300 flex-shrink-0" />
                            <span className="text-gray-500 tabular-nums">{formatCOP(item.aumento)}</span>
                          </div>
                          <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <div className="flex items-center gap-1.5 text-xs">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                            <span className="font-medium text-gray-700 tabular-nums">{formatCOP(item.bono)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Grand Total Card */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-200 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-1.5 justify-center sm:justify-start mb-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Con Aumento</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCOP(ahorros.costoTradicionalMensual)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatCOP(ahorros.costoTradicionalMensual * 12)} / ano</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1.5 justify-center mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Con Bono</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCOP(ahorros.costoConTikinMensual)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatCOP(ahorros.costoConTikinMensual * 12)} / ano</p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-xs text-emerald-600 uppercase tracking-wide font-semibold mb-1">Ahorro en Cargas</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCOP(ahorros.costoTradicionalMensual - ahorros.costoConTikinMensual)}</p>
                <div className="flex items-center justify-center sm:justify-end gap-2 mt-0.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    &minus;{pctSaving(ahorros.costoTradicionalMensual, ahorros.costoConTikinMensual)}%
                  </span>
                  <span className="text-xs text-emerald-500">{formatCOP((ahorros.costoTradicionalMensual - ahorros.costoConTikinMensual) * 12)} / ano</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Bonus Breakdown Card (desglose por bono + tarifa)
// ============================================

function BonusBreakdownCard({
  resumen,
  comisiones
}: {
  resumen: FinancialSummary
  comisiones: TikinCommission
}) {
  // Build per-category fee info: monto, fee%, fee amount
  const categoryFees: Array<{
    label: string
    monto: number
    feePct: number
    feeAmount: number
    color: string
  }> = []

  if (comisiones.montoBaseMeraLiberalidad > 0) {
    categoryFees.push({
      label: 'Mera Liberalidad',
      monto: comisiones.montoBaseMeraLiberalidad,
      feePct: comisiones.porcentajeFee * 100,
      feeAmount: comisiones.feeBaseMeraLiberalidad,
      color: 'blue'
    })
  }
  if (comisiones.montoBaseAlimentacion > 0) {
    const pct = comisiones.montoBaseAlimentacion > 0
      ? (comisiones.feeBaseAlimentacion / comisiones.montoBaseAlimentacion) * 100
      : 0
    categoryFees.push({
      label: 'Alimentacion',
      monto: comisiones.montoBaseAlimentacion,
      feePct: pct,
      feeAmount: comisiones.feeBaseAlimentacion,
      color: 'yellow'
    })
  }
  if (comisiones.montoBaseViaticos > 0) {
    const pct = comisiones.montoBaseViaticos > 0
      ? (comisiones.feeBaseViaticos / comisiones.montoBaseViaticos) * 100
      : 0
    categoryFees.push({
      label: 'Viaticos',
      monto: comisiones.montoBaseViaticos,
      feePct: pct,
      feeAmount: comisiones.feeBaseViaticos,
      color: 'indigo'
    })
  }
  if (comisiones.montoBaseReparticionUtilidades > 0) {
    const pct = comisiones.montoBaseReparticionUtilidades > 0
      ? (comisiones.feeBaseReparticionUtilidades / comisiones.montoBaseReparticionUtilidades) * 100
      : 0
    categoryFees.push({
      label: 'Reparticion de Utilidades',
      monto: comisiones.montoBaseReparticionUtilidades,
      feePct: pct,
      feeAmount: comisiones.feeBaseReparticionUtilidades,
      color: 'emerald'
    })
  }
  if (comisiones.montoDotacion > 0) {
    categoryFees.push({
      label: 'Dotacion',
      monto: comisiones.montoDotacion,
      feePct: 0,
      feeAmount: 0,
      color: 'gray'
    })
  }

  // Per-type breakdown from resumen
  const tipoBreakdown = resumen.desglosePorTipo.filter(d => d.montoTotal > 0)

  const totalMonto = categoryFees.reduce((s, c) => s + c.monto, 0)
  const totalFee = categoryFees.reduce((s, c) => s + c.feeAmount, 0)

  const colorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' }
  }

  if (categoryFees.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Desglose de Bonos y Tarifas</h3>
        <p className="text-sm text-gray-500 mt-1">Monto asignado por categoria de bono y la tarifa Tikin que aplica</p>
      </div>

      <div className="p-6">
        {/* Per-type detail (individual bonuses) */}
        {tipoBreakdown.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detalle por tipo de bono</p>
            <div className="space-y-2">
              {tipoBreakdown.map(item => {
                const meta = BONUS_TYPES_METADATA[item.tipoBono]
                if (!meta) return null
                // Get fee % for this type based on its category
                const catFee = categoryFees.find(c => {
                  if (meta.categoria === BonusCategory.MERA_LIBERALIDAD) return c.label === 'Mera Liberalidad'
                  if (meta.categoria === BonusCategory.ALIMENTACION) return c.label === 'Alimentacion'
                  if (meta.categoria === BonusCategory.VIATICOS) return c.label === 'Viaticos'
                  if (meta.categoria === BonusCategory.REPARTICION_UTILIDADES) return c.label === 'Reparticion de Utilidades'
                  if (meta.categoria === BonusCategory.DOTACION) return c.label === 'Dotacion'
                  return false
                })
                const feePct = catFee?.feePct ?? 0

                return (
                  <div key={item.tipoBono} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg flex-shrink-0">{meta.icono}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{meta.nombre}</p>
                        <p className="text-xs text-gray-400">{item.totalEmpleados} empleado{item.totalEmpleados !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatCOP(item.montoTotal)}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                        feePct === 0
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {feePct === 0 ? 'Sin fee' : `${feePct.toFixed(feePct % 1 === 0 ? 0 : 2)}%`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Category summary table */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Resumen por categoria</p>
          <div className="space-y-2">
            {categoryFees.map(cat => {
              const styles = colorMap[cat.color] || colorMap.gray
              return (
                <div key={cat.label} className={`flex items-center justify-between rounded-lg px-4 py-3 border ${styles.border} ${styles.bg}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
                    <span className={`text-sm font-medium ${styles.text}`}>{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatCOP(cat.monto)}</span>
                    <div className="text-right min-w-[80px]">
                      <span className="text-xs text-gray-500">
                        {cat.feePct === 0 ? 'Sin fee' : `Fee ${cat.feePct.toFixed(cat.feePct % 1 === 0 ? 0 : 2)}%`}
                      </span>
                      {cat.feeAmount > 0 && (
                        <p className="text-xs font-medium text-gray-700 tabular-nums">{formatCOP(cat.feeAmount)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totals row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 px-4">
            <span className="text-sm font-bold text-gray-900">Total Bonos</span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-gray-900 tabular-nums">{formatCOP(totalMonto)}</span>
              <div className="text-right min-w-[80px]">
                <span className="text-xs text-gray-500">Fee total</span>
                <p className="text-xs font-bold text-gray-900 tabular-nums">{formatCOP(totalFee)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Commission Summary (card-based redesign)
// ============================================

function CommissionSummary({
  comisiones,
  ahorros
}: {
  comisiones: TikinCommission
  ahorros: SavingsEstimate
}) {
  const roi = comisiones.totalConIva > 0
    ? (ahorros.ahorroMensualEstimado / comisiones.totalConIva).toFixed(1)
    : '0'
  const isPositive = ahorros.beneficioNetoMensual >= 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Comision &amp; Beneficio Neto</h3>
        <p className="text-sm text-gray-500 mt-1">Del ahorro en cargas laborales se descuenta la comision Tikin</p>
      </div>

      <div className="p-6">
        {/* Waterfall: Ahorro − Comision = Beneficio */}
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          {/* Ahorro Bruto */}
          <div className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-indigo-900">Ahorro Bruto</span>
            </div>
            <p className="text-2xl font-bold text-indigo-700">{formatCOP(ahorros.ahorroMensualEstimado)}</p>
            <p className="text-xs text-indigo-500 mt-1">{formatCOP(ahorros.ahorroAnualEstimado)} / ano</p>
          </div>

          {/* Minus operator */}
          <div className="flex items-center justify-center py-1 md:py-0">
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
              <span className="text-gray-500 font-bold text-lg leading-none">&minus;</span>
            </div>
          </div>

          {/* Comision Tikin */}
          <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Comision Tikin</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatCOP(comisiones.totalConIva)}</p>
            <p className="text-xs text-gray-500 mt-1">Fee {formatCOP(comisiones.feeTotal)} + IVA {formatCOP(comisiones.iva)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatCOP(comisiones.totalConIva * 12)} / ano</p>
          </div>

          {/* Equals operator */}
          <div className="flex items-center justify-center py-1 md:py-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPositive ? 'bg-emerald-100 border border-emerald-200' : 'bg-red-100 border border-red-200'}`}>
              <span className={`font-bold text-lg leading-none ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>=</span>
            </div>
          </div>

          {/* Beneficio Neto */}
          <div className={`flex-1 rounded-xl border p-5 ${
            isPositive ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isPositive ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {isPositive ? (
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                )}
              </div>
              <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-900' : 'text-red-900'}`}>Beneficio Neto</span>
            </div>
            <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>{formatCOP(ahorros.beneficioNetoMensual)}</p>
            <p className={`text-xs mt-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>{formatCOP(ahorros.beneficioNetoAnual)} / ano</p>
          </div>
        </div>

        {/* ROI indicator */}
        {comisiones.totalConIva > 0 && ahorros.ahorroMensualEstimado > 0 && (
          <div className="mt-5 flex items-center gap-3 bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-200">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm text-emerald-800">
              <span className="font-bold">ROI {roi}x</span> &mdash; Por cada $1 de comision, tu empresa ahorra ${roi} en cargas laborales
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Utility: yield to the event loop so Zustand state updates propagate
function tick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}
