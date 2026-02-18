'use client'

import { useEffect, useState } from 'react'
import { useBonosStore } from '@/store/bonosStore'
import { FEE_SALARIO_INTEGRAL } from '@/lib/bonos/constants'
import type { IntegralEmployeeResult } from '@/lib/bonos/types'

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value)

const formatPercent = (value: number) =>
  `${value.toFixed(1)}%`

const tick = () => new Promise(resolve => setTimeout(resolve, 50))

/**
 * IntegralResultsStep — Paso 3 del flujo de Salario Integral
 *
 * Rediseno con narrativa clara:
 * 1. Hero: "Asi queda" — estructura propuesta visual
 * 2. Ahorro total — el numero que importa
 * 3. De donde viene — 3 tarjetas simples
 * 4. Beneficio empleado — una fila compacta
 * 5. Comision Tikin — compacto
 * 6. Detalle por empleado — colapsado
 * 7. Disclaimer — compacto
 */
export function IntegralResultsStep() {
  const {
    resumenIntegral,
    calcularResumenIntegral,
    pasoAnterior,
    resetear,
  } = useBonosStore()

  const [loading, setLoading] = useState(true)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      calcularResumenIntegral()
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
      <div className="flex flex-col items-center justify-center py-16" role="status" aria-label="Calculando resultados">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <p className="mt-4 text-gray-600 font-medium">Calculando resultados...</p>
      </div>
    )
  }

  if (!resumenIntegral) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No se pudieron calcular los resultados. Verifica los datos ingresados.</p>
        <button onClick={pasoAnterior} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Volver a Datos
        </button>
      </div>
    )
  }

  const r = resumenIntegral
  const firstEligible = r.resultadosPorEmpleado.find(e => e.elegibleParaIntegral)

  // Aggregate employee impact for the summary line
  const totalImpactoEmpleados = r.resultadosPorEmpleado
    .filter(e => e.elegibleParaIntegral)
    .reduce((sum, e) => sum + e.impactoEmpleado.ahorroSsEmpleado, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* =========================================== */}
      {/* SECTION 1: Hero — "Asi queda la estructura" */}
      {/* =========================================== */}
      {firstEligible && (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Asi queda la nueva estructura
            </h2>
            {r.empleadosElegibles > 1 && (
              <p className="text-sm text-gray-500 mt-1">
                Ejemplo con el primer empleado elegible ({firstEligible.empleadoNombre})
              </p>
            )}
          </div>

          {/* Before */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 mb-2">Hoy gana</p>
            <div className="inline-block bg-gray-100 rounded-xl px-6 py-3">
              <p className="text-2xl font-bold text-gray-800">{formatCOP(firstEligible.salarioActual)}</p>
              <p className="text-xs text-gray-400">Salario ordinario</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center my-3">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          {/* After — the 3 boxes */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl px-5 py-4 text-center min-w-[140px]">
              <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide">Integral</p>
              <p className="text-xl font-bold text-purple-800 mt-1">{formatCOP(firstEligible.estructuraPropuesta.salarioIntegral)}</p>
              <p className="text-xs text-purple-400 mt-0.5">Minimo legal</p>
            </div>
            <span className="text-2xl font-bold text-purple-300">+</span>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl px-5 py-4 text-center min-w-[140px]">
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Bonos</p>
              <p className="text-xl font-bold text-orange-700 mt-1">{formatCOP(firstEligible.estructuraPropuesta.montoBonos)}</p>
              <p className="text-xs text-orange-400 mt-0.5">La diferencia</p>
            </div>
            <span className="text-2xl font-bold text-gray-300">=</span>
            <div className="bg-green-50 border-2 border-green-200 rounded-xl px-5 py-4 text-center min-w-[140px]">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Total</p>
              <p className="text-xl font-bold text-green-700 mt-1">{formatCOP(firstEligible.estructuraPropuesta.compensacionTotal)}</p>
              <p className="text-xs text-green-500 mt-0.5 font-medium">Recibe lo mismo</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            El empleado recibe exactamente la misma compensacion total.
          </p>
        </div>
      )}

      {/* No eligible employees fallback */}
      {r.empleadosElegibles === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <svg className="w-12 h-12 text-amber-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-amber-800">Ningun empleado es elegible</h3>
          <p className="text-sm text-amber-600 mt-2">
            Todos los salarios ingresados son menores al minimo integral. Verifica los datos e intenta de nuevo.
          </p>
          <button onClick={pasoAnterior} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Volver a Datos
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION 2: "Tu empresa ahorra" — big number */}
      {/* ============================================ */}
      {r.empleadosElegibles > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 sm:p-8 text-center">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Tu empresa ahorra</p>
          <p className="text-4xl sm:text-5xl font-bold text-green-700 mt-2">
            {formatCOP(r.ahorroTotalMensual)}
            <span className="text-lg font-normal text-green-500">/mes</span>
          </p>
          <p className="text-lg font-semibold text-green-600 mt-1">
            {formatCOP(r.ahorroTotalAnual)}<span className="text-sm font-normal">/ano</span>
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            -{formatPercent(r.ahorroPorcentaje)} en costos laborales
          </div>
          {r.empleadosElegibles > 1 && (
            <p className="text-xs text-green-500 mt-3">
              Para {r.empleadosElegibles} empleados elegibles de {r.totalEmpleados} total
            </p>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION 3: "De donde viene el ahorro?"      */}
      {/* ============================================ */}
      {r.empleadosElegibles > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">De donde viene el ahorro?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* SS */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Seguridad Social</p>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Antes: sobre el 100% del salario<br />
                Ahora: sobre el 70% del integral<br />
                <span className="text-gray-400">(Art. 18, Ley 100/1993 — IBC = factor salarial 70%)</span>
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatCOP(r.ahorroDetalle.seguridadSocial)}<span className="text-xs font-normal text-green-400">/mes</span>
              </p>
            </div>

            {/* Parafiscales */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Parafiscales</p>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Antes: SENA + ICBF + Caja sobre 100%<br />
                Ahora: sobre el 70% del integral<br />
                <span className="text-gray-400">(Ley 789/2002 Art. 49)</span>
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatCOP(r.ahorroDetalle.parafiscales)}<span className="text-xs font-normal text-green-400">/mes</span>
              </p>
            </div>

            {/* Prestaciones */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Prestaciones</p>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Antes: ~22% (prima, cesantias, etc.)<br />
                Ahora: $0 — incluidas en el factor prestacional 30%<br />
                <span className="text-gray-400">(Art. 132 CST — prestaciones incluidas en el integral)</span>
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatCOP(r.ahorroDetalle.prestaciones)}<span className="text-xs font-normal text-green-400">/mes</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION 4: Beneficio empleado (compact)      */}
      {/* ============================================ */}
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

      {/* ============================================ */}
      {/* SECTION 5: Comision Tikin + Beneficio neto   */}
      {/* ============================================ */}
      {r.empleadosElegibles > 0 && (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Comision Tikin:</span>{' '}
                {(FEE_SALARIO_INTEGRAL * 100).toFixed(0)}% del ahorro ={' '}
                <span className="font-semibold">{formatCOP(r.comisionTikin.feeMensual)}/mes</span>
                {' '}+ IVA ={' '}
                <span className="font-semibold">{formatCOP(r.comisionTikin.totalConIvaMensual)}/mes</span>
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs text-gray-500">Tu beneficio neto real</p>
              <p className="text-xl font-bold text-emerald-700">{formatCOP(r.beneficioNetoMensual)}<span className="text-sm font-normal text-emerald-500">/mes</span></p>
              <p className="text-sm font-semibold text-emerald-600">{formatCOP(r.beneficioNetoAnual)}<span className="text-xs font-normal">/ano</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION 6: Detalle por empleado (collapsed)  */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100">
        <button
          type="button"
          onClick={() => setShowDetail(!showDetail)}
          className="w-full flex items-center justify-between p-5 text-left"
          aria-expanded={showDetail}
        >
          <div className="flex items-center gap-2">
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${showDetail ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-semibold text-gray-900">Detalle por empleado</span>
            <span className="text-sm text-gray-400">({r.totalEmpleados} {r.totalEmpleados === 1 ? 'empleado' : 'empleados'})</span>
          </div>
          <span className="text-xs text-gray-400">{showDetail ? 'Ocultar' : 'Ver detalle'}</span>
        </button>

        {showDetail && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-2 pr-4 text-gray-500 font-medium">Empleado</th>
                    <th className="pb-2 pr-4 text-gray-500 font-medium text-right">Salario</th>
                    <th className="pb-2 pr-4 text-gray-500 font-medium text-right">Ahorro/mes</th>
                    <th className="pb-2 text-gray-500 font-medium text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {r.resultadosPorEmpleado.map((emp) => (
                    <EmployeeRow
                      key={emp.empleadoId}
                      emp={emp}
                      isExpanded={expandedEmployee === emp.empleadoId}
                      onToggle={() => setExpandedEmployee(
                        expandedEmployee === emp.empleadoId ? null : emp.empleadoId
                      )}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* SECTION 7: Disclaimer legal (compact)        */}
      {/* ============================================ */}
      <p className="text-xs text-gray-400 text-center leading-relaxed px-4">
        Simulacion basada en valores legales 2025 (SMMLV: $1.423.500). Las prestaciones quedan incluidas en el factor prestacional del 30%. Consulte con un abogado laboralista antes de implementar.
      </p>

      {/* ============================================ */}
      {/* Navigation                                   */}
      {/* ============================================ */}
      <div className="flex gap-4">
        <button
          onClick={pasoAnterior}
          className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Datos
        </button>
        <button
          onClick={handleNuevaCotizacion}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            showResetConfirm
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {showResetConfirm ? 'Confirmar — Iniciar Nueva Cotizacion' : 'Nueva Cotizacion'}
        </button>
      </div>
    </div>
  )
}

/**
 * Expandable employee row — simplified
 */
function EmployeeRow({
  emp,
  isExpanded,
  onToggle
}: {
  emp: IntegralEmployeeResult
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
        role="button"
        aria-expanded={isExpanded}
      >
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2">
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium text-gray-900">{emp.empleadoNombre}</span>
          </div>
        </td>
        <td className="py-3 pr-4 text-right text-gray-600">{formatCOP(emp.salarioActual)}</td>
        <td className="py-3 pr-4 text-right">
          {emp.elegibleParaIntegral ? (
            <span className="font-semibold text-green-600">{formatCOP(emp.ahorroEmpleador.totalMensual)}</span>
          ) : <span className="text-gray-400">—</span>}
        </td>
        <td className="py-3 text-center">
          {emp.elegibleParaIntegral ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Elegible
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              No elegible
            </span>
          )}
        </td>
      </tr>

      {/* Expanded — eligible */}
      {isExpanded && emp.elegibleParaIntegral && (
        <tr>
          <td colSpan={4} className="pb-4 pt-1 px-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Proposed structure */}
              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center text-sm">
                <div className="text-center px-3 py-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-500">Integral</p>
                  <p className="font-bold text-purple-800">{formatCOP(emp.estructuraPropuesta.salarioIntegral)}</p>
                </div>
                <span className="text-purple-300 font-bold">+</span>
                <div className="text-center px-3 py-2 bg-orange-50 rounded-lg">
                  <p className="text-xs text-orange-500">Bonos</p>
                  <p className="font-bold text-orange-700">{formatCOP(emp.estructuraPropuesta.montoBonos)}</p>
                </div>
                <span className="text-gray-300 font-bold">=</span>
                <div className="text-center px-3 py-2 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600">Total</p>
                  <p className="font-bold text-green-700">{formatCOP(emp.estructuraPropuesta.compensacionTotal)}</p>
                </div>
              </div>

              {/* Cost comparison grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Costo Actual</p>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span className="text-gray-500">SS</span><span className="text-gray-700">{formatCOP(emp.costoActual.seguridadSocial)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Parafiscales</span><span className="text-gray-700">{formatCOP(emp.costoActual.parafiscales)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Prestaciones</span><span className="text-gray-700">{formatCOP(emp.costoActual.prestaciones)}</span></div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-gray-200"><span>Total</span><span>{formatCOP(emp.costoActual.total)}</span></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-2">Costo Propuesto</p>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span className="text-gray-500">SS (70%)</span><span className="text-purple-700">{formatCOP(emp.costoPropuesto.seguridadSocial)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Parafiscales (70%)</span><span className="text-purple-700">{formatCOP(emp.costoPropuesto.parafiscales)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Prestaciones</span><span className="text-purple-700">$0</span></div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-purple-200"><span className="text-purple-700">Total</span><span className="text-purple-800">{formatCOP(emp.costoPropuesto.total)}</span></div>
                  </div>
                </div>
              </div>

              {/* Savings summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-sm">
                <span className="text-green-700">Ahorro: </span>
                <span className="font-bold text-green-700">{formatCOP(emp.ahorroEmpleador.totalMensual)}/mes</span>
                <span className="text-green-600"> | {formatCOP(emp.ahorroEmpleador.totalAnual)}/ano</span>
                <span className="text-green-500 ml-1">(-{formatPercent(emp.ahorroEmpleador.porcentaje)})</span>
              </div>

              {/* Employee impact */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <span className="font-medium">Para el empleado:</span>{' '}
                ingreso neto pasa de {formatCOP(emp.impactoEmpleado.ingresoNetoActual)} a{' '}
                <span className="font-bold text-green-700">{formatCOP(emp.impactoEmpleado.ingresoNetoPropuesto)}</span>{' '}
                (+{formatCOP(emp.impactoEmpleado.diferenciaIngreso)}/mes)
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Expanded — not eligible */}
      {isExpanded && !emp.elegibleParaIntegral && (
        <tr>
          <td colSpan={4} className="pb-4 pt-1 px-4">
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-sm text-amber-800">{emp.razonNoElegible}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
