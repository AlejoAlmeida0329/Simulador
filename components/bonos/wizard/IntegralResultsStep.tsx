'use client'

import { useEffect, useState } from 'react'
import { useBonosStore } from '@/store/bonosStore'
import { BONUS_TYPES_METADATA, BonusTypeEnum, BonusCategory } from '@/lib/bonos/constants'
import type { TikinCommission, BonusTotals } from '@/lib/bonos/types'

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value)

const tick = () => new Promise(resolve => setTimeout(resolve, 50))

/**
 * IntegralResultsStep — Paso 4 del flujo de Salario Integral
 *
 * Rediseño alineado con ResultsStep UX:
 * 1. Header centrado
 * 2. Estructura de Compensación (SalaryStructureCard style)
 * 3. Desglose de Bonos y Tarifas (BonusBreakdownCard)
 * 4. Comparativo de Costos (accordion detallado)
 * 5. Comisión & Beneficio Neto (CommissionSummary waterfall)
 * 6. Actions + Disclaimer
 */
export function IntegralResultsStep() {
  const {
    resumenIntegral,
    comisionesTikin,
    calcularResumenIntegral,
    pasoAnterior,
    resetear,
  } = useBonosStore()

  const [loading, setLoading] = useState(true)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      await calcularResumenIntegral()
      await tick()
      setLoading(false)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNuevaCotizacion = () => {
    if (showResetConfirm) {
      resetear()
      setShowResetConfirm(false)
      return
    }
    setShowResetConfirm(true)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Resultados de Salario Integral
          </h2>
          <p className="text-gray-600">Calculando resultados...</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20" role="status" aria-label="Calculando resultados">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-tikin-red rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Procesando calculos financieros</p>
        </div>
      </div>
    )
  }

  if (!resumenIntegral) {
    return (
      <div className="max-w-6xl mx-auto text-center py-16">
        <p className="text-gray-500">No se pudieron calcular los resultados. Verifica los datos ingresados.</p>
        <button onClick={pasoAnterior} className="mt-4 px-6 py-2 bg-tikin-red text-white rounded-lg hover:bg-red-700">
          Volver a Datos
        </button>
      </div>
    )
  }

  const r = resumenIntegral
  const firstEligible = r.resultadosPorEmpleado.find(e => e.elegibleParaIntegral)

  // Total actual bonuses selected (from store calculation)
  const totalBonosSeleccionados = r.totalBonos ?? 0
  const totalBonosPorEmpleado = r.empleadosElegibles > 0
    ? totalBonosSeleccionados / r.empleadosElegibles
    : 0

  // Percentages for stacked bar
  const integralMinimo = firstEligible?.estructuraPropuesta.salarioIntegral ?? 0
  const compensacionPorEmpleado = integralMinimo + totalBonosPorEmpleado
  const pctIntegral = compensacionPorEmpleado > 0
    ? (integralMinimo / compensacionPorEmpleado) * 100
    : 0
  const pctBonos = compensacionPorEmpleado > 0
    ? (totalBonosPorEmpleado / compensacionPorEmpleado) * 100
    : 0

  // Aggregate employee impact
  const totalImpactoEmpleados = r.resultadosPorEmpleado
    .filter(e => e.elegibleParaIntegral)
    .reduce((sum, e) => sum + e.impactoEmpleado.ahorroSsEmpleado, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* =========================================== */}
      {/* Header                                      */}
      {/* =========================================== */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Resultados de Salario Integral
        </h2>
        <p className="text-gray-600">
          Reestructuracion de salario integral: misma compensacion, menores aportes patronales
        </p>
      </div>

      {/* No eligible employees fallback */}
      {r.empleadosElegibles === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-amber-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-amber-800">Ningun empleado es elegible</h3>
          <p className="text-sm text-amber-600 mt-2">
            Todos los salarios ingresados son menores al minimo integral. Verifica los datos e intenta de nuevo.
          </p>
          <button onClick={pasoAnterior} className="mt-4 px-6 py-2 bg-tikin-red text-white rounded-lg hover:bg-red-700">
            Volver a Datos
          </button>
        </div>
      )}

      {/* =========================================== */}
      {/* SECTION 1: Estructura de Compensación        */}
      {/* =========================================== */}
      {r.empleadosElegibles > 0 && firstEligible && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Estructura de Compensacion Propuesta</h3>
            <p className="text-sm text-gray-500 mt-1">
              {r.empleadosElegibles === 1
                ? `Como se distribuye la compensacion de ${firstEligible.empleadoNombre}`
                : `Promedio por empleado elegible (${r.empleadosElegibles} de ${r.totalEmpleados})`
              }
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Total compensation */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Compensacion Total Mensual {r.empleadosElegibles > 1 ? '(promedio)' : ''}</p>
              <p className="text-3xl font-bold text-gray-900">{formatCOP(compensacionPorEmpleado)}</p>
              <p className="text-xs text-gray-400 mt-1">El empleado recibe exactamente la misma compensacion total</p>
            </div>

            {/* Stacked bar */}
            <div className="w-full h-8 rounded-full overflow-hidden flex bg-gray-100">
              <div
                className="h-full bg-indigo-500 transition-all duration-500 flex items-center justify-center"
                style={{ width: `${pctIntegral}%` }}
              >
                {pctIntegral >= 15 && (
                  <span className="text-xs font-semibold text-white">{pctIntegral.toFixed(0)}%</span>
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
              {/* Salario Integral */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <h4 className="text-sm font-semibold text-indigo-900">Salario Integral ({pctIntegral.toFixed(0)}%)</h4>
                </div>
                <p className="text-2xl font-bold text-indigo-700 mb-2">{formatCOP(integralMinimo)}</p>
                <p className="text-xs text-indigo-600/80 leading-relaxed">
                  Minimo integral legal (13 SMMLV). IBC = 70% ({formatCOP(firstEligible.estructuraPropuesta.factorSalarial)}) + factor prestacional 30%
                </p>
              </div>

              {/* Bonos */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h4 className="text-sm font-semibold text-emerald-900">Bonos Art. 128 ({pctBonos.toFixed(0)}%)</h4>
                </div>
                <p className="text-2xl font-bold text-emerald-700 mb-2">{formatCOP(totalBonosPorEmpleado)}</p>
                <p className="text-xs text-emerald-600/80 leading-relaxed">
                  No salarial &mdash; no genera aportes, parafiscales ni prestaciones adicionales
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
                    <span className="font-medium">Antes:</span> salario integral de <span className="font-semibold text-gray-900">{formatCOP(firstEligible.salarioActual)}</span>, aportes sobre IBC de <span className="font-semibold text-gray-900">{formatCOP(Math.round(firstEligible.salarioActual * 0.7))}</span> (70%).
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">Ahora:</span> integral minimo de <span className="font-semibold text-indigo-700">{formatCOP(integralMinimo)}</span>, aportes sobre IBC de <span className="font-semibold text-indigo-700">{formatCOP(firstEligible.estructuraPropuesta.factorSalarial)}</span> (70%). La diferencia de <span className="font-semibold text-emerald-600">{formatCOP(firstEligible.salarioActual - integralMinimo)}</span> va como bonos no salariales.
                  </p>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Art. 132 CST (salario integral), Art. 18 Ley 100/1993 (IBC = factor salarial 70%), Art. 128 CST (pagos no constitutivos de salario).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================== */}
      {/* SECTION 2: Desglose de Bonos y Tarifas      */}
      {/* =========================================== */}
      {r.empleadosElegibles > 0 && r.desglosePorTipo && r.desglosePorTipo.length > 0 && comisionesTikin && (
        <IntegralBonusBreakdown desglose={r.desglosePorTipo} comisiones={comisionesTikin} />
      )}


      {/* =========================================== */}
      {/* SECTION 3: Comparativo de Costos (accordion) */}
      {/* =========================================== */}
      {r.empleadosElegibles > 0 && (
        <IntegralComparisonCards resumen={r} />
      )}

      {/* =========================================== */}
      {/* SECTION 4: Beneficio empleado (compact)      */}
      {/* =========================================== */}
      {r.empleadosElegibles > 0 && firstEligible && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="text-sm text-blue-800 text-center sm:text-left">
            <span className="font-semibold">Tu empleado tambien gana:</span>{' '}
            {r.empleadosElegibles === 1 ? (
              <>
                sus descuentos de seguridad social bajan de {formatCOP(firstEligible.impactoEmpleado.descuentoSsActual)} a {formatCOP(firstEligible.impactoEmpleado.descuentoSsPropuesto)}.
                Resultado: <span className="font-bold text-green-700">+{formatCOP(firstEligible.impactoEmpleado.diferenciaIngreso)}/mes</span> mas de ingreso neto.
              </>
            ) : (
              <>
                descuentos de seguridad social se reducen al calcularse sobre el 70% del integral.
                Resultado: <span className="font-bold text-green-700">+{formatCOP(totalImpactoEmpleados)}/mes</span> combinados en mayor ingreso neto.
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================== */}
      {/* SECTION 5: Comisión & Beneficio Neto         */}
      {/* =========================================== */}
      {r.empleadosElegibles > 0 && comisionesTikin && (
        <IntegralCommissionSummary
          ahorroMensual={r.ahorroTotalMensual}
          ahorroAnual={r.ahorroTotalAnual}
          comisiones={comisionesTikin}
          beneficioNetoMensual={r.beneficioNetoMensual}
          beneficioNetoAnual={r.beneficioNetoAnual}
        />
      )}


      {/* =========================================== */}
      {/* Disclaimer legal                             */}
      {/* =========================================== */}
      <p className="text-xs text-gray-400 text-center leading-relaxed px-4">
        Simulacion basada en valores legales 2026 (SMMLV: $1.750.905). Las prestaciones quedan incluidas en el factor prestacional del 30%. Consulte con un abogado laboralista antes de implementar.
      </p>

      {/* =========================================== */}
      {/* Navigation                                   */}
      {/* =========================================== */}
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
              ? 'bg-amber-500 text-white hover:bg-amber-600'
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
// Comparison Cards — Accordion (3 categories)
// ============================================

function IntegralComparisonCards({
  resumen
}: {
  resumen: NonNullable<ReturnType<typeof useBonosStore.getState>['resumenIntegral']>
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const pctSaving = (a: number, b: number) => a > 0 ? Math.round(((a - b) / a) * 100) : 0

  // Get first eligible employee for rate-based sub-item calculations
  const firstEligible = resumen.resultadosPorEmpleado.find(e => e.elegibleParaIntegral)
  const numElegibles = resumen.empleadosElegibles || 1
  const salarioBase = firstEligible?.salarioActual ?? 0
  const ibcActual = Math.round(salarioBase * 0.7) // IBC actual = 70% del salario integral actual
  const ibc = firstEligible?.estructuraPropuesta.factorSalarial ?? 0 // IBC propuesto = 70% del integral minimo

  // Sub-item breakdown rows for each category
  type SubItem = { label: string; ratePct: string; actual: number; propuesto: number; note?: string }

  const ssSubItems: SubItem[] = [
    {
      label: 'Salud (empleador)',
      ratePct: '8.5%',
      actual: ibcActual * 0.085 * numElegibles,
      propuesto: ibc * 0.085 * numElegibles,
    },
    {
      label: 'Pension',
      ratePct: '12%',
      actual: ibcActual * 0.12 * numElegibles,
      propuesto: ibc * 0.12 * numElegibles,
    },
    {
      label: 'ARL',
      ratePct: '0.5-7%',
      actual: resumen.resultadosPorEmpleado.filter(e => e.elegibleParaIntegral).reduce((s, e) => s + e.costoActual.seguridadSocial, 0) - (ibcActual * (0.085 + 0.12) * numElegibles),
      propuesto: resumen.resultadosPorEmpleado.filter(e => e.elegibleParaIntegral).reduce((s, e) => s + e.costoPropuesto.seguridadSocial, 0) - (ibc * (0.085 + 0.12) * numElegibles),
      note: 'Varia segun nivel de riesgo'
    }
  ]

  // Integral NUNCA aplica exoneración (Art. 114-1 E.T.: integral ≥ 13 SMMLV > 10 SMMLV)
  const parafSubItems: SubItem[] = [
    {
      label: 'SENA',
      ratePct: '2%',
      actual: ibcActual * 0.02 * numElegibles,
      propuesto: ibc * 0.02 * numElegibles,
      note: 'Sin exoneracion (integral > 10 SMMLV)'
    },
    {
      label: 'ICBF',
      ratePct: '3%',
      actual: ibcActual * 0.03 * numElegibles,
      propuesto: ibc * 0.03 * numElegibles,
      note: 'Sin exoneracion (integral > 10 SMMLV)'
    },
    {
      label: 'Caja de Compensacion',
      ratePct: '4%',
      actual: ibcActual * 0.04 * numElegibles,
      propuesto: ibc * 0.04 * numElegibles,
    }
  ]

  const categories = [
    {
      key: 'ss',
      title: 'Seguridad Social',
      accentColor: 'blue' as const,
      tradTotal: resumen.resultadosPorEmpleado
        .filter(e => e.elegibleParaIntegral)
        .reduce((s, e) => s + e.costoActual.seguridadSocial, 0),
      tikinTotal: resumen.resultadosPorEmpleado
        .filter(e => e.elegibleParaIntegral)
        .reduce((s, e) => s + e.costoPropuesto.seguridadSocial, 0),
      explanation: 'Se calculan sobre el IBC (70% del integral). Al bajar el integral de ' + formatCOP(salarioBase) + ' al minimo de ' + formatCOP(firstEligible?.estructuraPropuesta.salarioIntegral ?? 0) + ', el IBC se reduce.',
      legalRef: 'Art. 18, Ley 100/1993',
      baseActual: `IBC actual: ${formatCOP(ibcActual)} (70% de ${formatCOP(salarioBase)})`,
      basePropuesto: `IBC propuesto: ${formatCOP(ibc)} (70% de ${formatCOP(firstEligible?.estructuraPropuesta.salarioIntegral ?? 0)})`,
      subItems: ssSubItems,
    },
    {
      key: 'paraf',
      title: 'Aportes Parafiscales',
      accentColor: 'amber' as const,
      tradTotal: resumen.resultadosPorEmpleado
        .filter(e => e.elegibleParaIntegral)
        .reduce((s, e) => s + e.costoActual.parafiscales, 0),
      tikinTotal: resumen.resultadosPorEmpleado
        .filter(e => e.elegibleParaIntegral)
        .reduce((s, e) => s + e.costoPropuesto.parafiscales, 0),
      explanation: 'Se calculan sobre el IBC (70% del integral). Integral siempre paga SENA + ICBF + Caja (Art. 114-1 E.T. no aplica exoneracion porque integral > 10 SMMLV).',
      legalRef: 'Ley 789/2002 Art. 49, Art. 114-1 E.T.',
      baseActual: `IBC actual: ${formatCOP(ibcActual)} (70% de ${formatCOP(salarioBase)})`,
      basePropuesto: `IBC propuesto: ${formatCOP(ibc)} (70% de ${formatCOP(firstEligible?.estructuraPropuesta.salarioIntegral ?? 0)})`,
      subItems: parafSubItems,
    },
  ]

  const colorStyles = {
    blue: { borderL: 'border-l-blue-500', dot: 'bg-blue-500', bg: 'bg-blue-50' },
    amber: { borderL: 'border-l-amber-500', dot: 'bg-amber-500', bg: 'bg-amber-50' },
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5">
        <h3 className="text-lg font-semibold text-gray-900">Comparativo de Cargas del Empleador</h3>
        <p className="text-sm text-gray-500 mt-1">Cuanto paga el empleador en aportes: esquema actual vs reestructuracion con integral minimo + bonos</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50/60 rounded-lg border border-red-100">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
            <span className="text-xs text-red-700">Actual &mdash; integral de {formatCOP(salarioBase)}, IBC {formatCOP(ibcActual)}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-xs text-emerald-700">Propuesto &mdash; integral minimo + bonos, IBC {formatCOP(ibc)}</span>
          </div>
        </div>
      </div>

      {/* Category cards */}
      {categories.map((cat, idx) => {
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
              aria-expanded={isOpen}
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
                    &minus;{pct}%
                  </span>
                )}
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                <p className="text-xs text-gray-500">{cat.explanation} <span className="text-gray-400">({cat.legalRef})</span></p>

                {/* Base comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="px-3 py-2 bg-red-50/50 rounded-lg border border-red-100">
                    <p className="text-[11px] font-medium text-red-600 uppercase tracking-wide mb-0.5">Actual</p>
                    <p className="text-xs text-red-700">{cat.baseActual}</p>
                  </div>
                  <div className="px-3 py-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                    <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wide mb-0.5">Propuesto</p>
                    <p className="text-xs text-emerald-700">{cat.basePropuesto}</p>
                  </div>
                </div>

                {/* Sub-item table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm" role="table">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="text-left px-3 py-2 font-medium" scope="col">Concepto</th>
                        <th className="text-center px-3 py-2 font-medium" scope="col">Tasa</th>
                        <th className="text-right px-3 py-2 font-medium" scope="col">
                          <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Actual</span>
                        </th>
                        <th className="text-right px-3 py-2 font-medium" scope="col">
                          <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Propuesto</span>
                        </th>
                        <th className="text-right px-3 py-2 font-medium" scope="col">Ahorro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cat.subItems.map((item, i) => {
                        const itemSaving = item.actual - item.propuesto
                        return (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 text-gray-700">
                              {item.label}
                              {item.note && <span className="block text-[10px] text-gray-400">{item.note}</span>}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-500 tabular-nums text-xs">{item.ratePct}</td>
                            <td className="px-3 py-2 text-right text-gray-600 tabular-nums">{formatCOP(item.actual)}</td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900">
                              {item.propuesto === 0 ? <span className="text-emerald-600">$0</span> : formatCOP(item.propuesto)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {itemSaving > 0 ? (
                                <span className="text-emerald-600 font-medium">&minus;{formatCOP(itemSaving)}</span>
                              ) : (
                                <span className="text-gray-400">$0</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold text-sm">
                        <td className="px-3 py-2.5 text-gray-900" colSpan={2}>Subtotal</td>
                        <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums">{formatCOP(cat.tradTotal)}</td>
                        <td className="px-3 py-2.5 text-right text-gray-900 tabular-nums">{formatCOP(cat.tikinTotal)}</td>
                        <td className="px-3 py-2.5 text-right text-emerald-600 tabular-nums">
                          {saving > 0 ? <>&minus;{formatCOP(saving)}</> : '$0'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {numElegibles > 1 && (
                  <p className="text-[11px] text-gray-400">Montos totales para {numElegibles} empleados elegibles.</p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Total Ahorro Patronal */}
      {(() => {
        const totalActual = categories.reduce((s, c) => s + c.tradTotal, 0)
        const totalPropuesto = categories.reduce((s, c) => s + c.tikinTotal, 0)
        const totalSaving = totalActual - totalPropuesto
        const totalPct = pctSaving(totalActual, totalPropuesto)
        return totalSaving > 0 ? (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900">Ahorro Total en Aportes Patronales</p>
                <p className="text-xs text-emerald-600">Seguridad Social + Parafiscales (al reducir el IBC de 70% de {formatCOP(salarioBase)} a 70% de {formatCOP(firstEligible?.estructuraPropuesta.salarioIntegral ?? 0)})</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-emerald-700">{formatCOP(totalSaving)}<span className="text-sm font-normal text-emerald-500">/mes</span></p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-800">
                &minus;{totalPct}%
              </span>
            </div>
          </div>
        ) : null
      })()}

    </div>
  )
}

// ============================================
// Bonus Breakdown Card (desglose por bono + tarifa)
// ============================================

function IntegralBonusBreakdown({
  desglose,
  comisiones
}: {
  desglose: BonusTotals[]
  comisiones: TikinCommission
}) {
  // Build per-category fee info
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
    const pct = (comisiones.feeBaseAlimentacion / comisiones.montoBaseAlimentacion) * 100
    categoryFees.push({
      label: 'Alimentacion',
      monto: comisiones.montoBaseAlimentacion,
      feePct: pct,
      feeAmount: comisiones.feeBaseAlimentacion,
      color: 'yellow'
    })
  }
  if (comisiones.montoBaseViaticos > 0) {
    const pct = (comisiones.feeBaseViaticos / comisiones.montoBaseViaticos) * 100
    categoryFees.push({
      label: 'Viaticos',
      monto: comisiones.montoBaseViaticos,
      feePct: pct,
      feeAmount: comisiones.feeBaseViaticos,
      color: 'indigo'
    })
  }
  if (comisiones.montoBaseReparticionUtilidades > 0) {
    const pct = (comisiones.feeBaseReparticionUtilidades / comisiones.montoBaseReparticionUtilidades) * 100
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

  const tipoBreakdown = desglose.filter(d => d.montoTotal > 0)
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
        {/* Per-type detail */}
        {tipoBreakdown.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detalle por tipo de bono</p>
            <div className="space-y-2">
              {tipoBreakdown.map(item => {
                const meta = BONUS_TYPES_METADATA[item.tipoBono]
                if (!meta) return null
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

        {/* Category summary */}
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
// Commission Summary (waterfall: Ahorro − Comision = Beneficio)
// ============================================

function IntegralCommissionSummary({
  ahorroMensual,
  ahorroAnual,
  comisiones,
  beneficioNetoMensual,
  beneficioNetoAnual
}: {
  ahorroMensual: number
  ahorroAnual: number
  comisiones: TikinCommission
  beneficioNetoMensual: number
  beneficioNetoAnual: number
}) {
  const roi = comisiones.totalConIva > 0
    ? (ahorroMensual / comisiones.totalConIva).toFixed(1)
    : '0'
  const isPositive = beneficioNetoMensual >= 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Beneficio Neto para tu Empresa</h3>
        <p className="text-sm text-gray-500 mt-1">Del ahorro en aportes patronales (SS + Parafiscales) se descuenta la comision Tikin por gestion de bonos</p>
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
              <span className="text-sm font-semibold text-indigo-900">Ahorro en Aportes</span>
            </div>
            <p className="text-2xl font-bold text-indigo-700">{formatCOP(ahorroMensual)}</p>
            <p className="text-xs text-indigo-500 mt-1">{formatCOP(ahorroAnual)} / ano</p>
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
            <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>{formatCOP(beneficioNetoMensual)}</p>
            <p className={`text-xs mt-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>{formatCOP(beneficioNetoAnual)} / ano</p>
          </div>
        </div>

        {/* ROI indicator */}
        {comisiones.totalConIva > 0 && ahorroMensual > 0 && (
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

