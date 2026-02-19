'use client'

import { useState, useMemo } from 'react'
import { useBonosStore } from '@/store/bonosStore'
import { BONUS_TYPES_METADATA, BonusTypeEnum, BonusCategory, SALARIO_INTEGRAL_MINIMO } from '@/lib/bonos/constants'
import { calcularCapMaximo } from '@/lib/bonos/integral-cap'
import type { BonusConfigItem } from '@/lib/bonos/types'

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value)

function resolveBonus(config: BonusConfigItem, salarioPromedio: number): number {
  if (config.mode === 'fijo') return config.valor
  return salarioPromedio * config.valor / 100
}

const CATEGORIES_THAT_COUNT = new Set([
  BonusCategory.MERA_LIBERALIDAD,
  BonusCategory.ALIMENTACION
])

interface CategorySection {
  key: string
  category: BonusCategory
  title: string
  subtitle: string
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  rulesColor: { bg: string; border: string; text: string }
  countsToward40: boolean
}

const CATEGORY_SECTIONS: CategorySection[] = [
  {
    key: 'mera_liberalidad',
    category: BonusCategory.MERA_LIBERALIDAD,
    title: 'Bonos de Mera Liberalidad',
    subtitle: 'Sin parafiscales',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    rulesColor: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
    countsToward40: true
  },
  {
    key: 'reparticion_utilidades',
    category: BonusCategory.REPARTICION_UTILIDADES,
    title: 'Reparticion de Utilidades',
    subtitle: 'No suma al 40% — Art. 128 CST',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    rulesColor: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
    countsToward40: false
  },
  {
    key: 'alimentacion',
    category: BonusCategory.ALIMENTACION,
    title: 'Bono de Alimentacion',
    subtitle: 'Max 41 UVT/mes ($2.147.334 en 2026) — Art. 387-1 E.T.',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    rulesColor: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
    countsToward40: true
  },
  {
    key: 'dotacion',
    category: BonusCategory.DOTACION,
    title: 'Dotacion (Obligatoria)',
    subtitle: 'Obligatoria si salario <= 2 SMMLV ($3.501.810) — Art. 230 CST',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    rulesColor: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
    countsToward40: false
  },
  {
    key: 'viaticos',
    category: BonusCategory.VIATICOS,
    title: 'Viaticos',
    subtitle: 'Requiere soporte documental para deduccion fiscal',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    rulesColor: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800' },
    countsToward40: false
  }
]

export function BonusSelectionStep() {
  const {
    configuracion,
    lotes,
    empleados,
    lotesIntegral,
    empleadosIntegral,
    flujoSeleccionado,
    toggleBonusType,
    setBonusConfig,
    aplicarBonosALotes,
    siguientePaso,
    pasoAnterior
  } = useBonosStore()

  const isIntegral = flujoSeleccionado === 'salario_integral'
  const tiposSeleccionados = configuracion.bonusSelection.tiposSeleccionados

  // Initialize local config from store
  const [localConfig, setLocalConfig] = useState<Record<string, BonusConfigItem>>(() => {
    const initial: Record<string, BonusConfigItem> = {}
    for (const tipo of tiposSeleccionados) {
      initial[tipo] = configuracion.bonusConfig[tipo] ?? { mode: 'fijo', valor: 0 }
    }
    return initial
  })

  // Group bonuses by category
  const bonosPorCategoria = useMemo(() => {
    const grouped: Record<string, typeof BONUS_TYPES_METADATA[BonusTypeEnum][]> = {}
    for (const section of CATEGORY_SECTIONS) {
      grouped[section.key] = Object.values(BONUS_TYPES_METADATA).filter(
        b => b.categoria === section.category
      )
    }
    return grouped
  }, [])

  // Computed payroll values — adapt for integral flow
  const totalNomina = useMemo(() => {
    if (isIntegral) {
      const lotesTotal = lotesIntegral.reduce((sum, l) => sum + l.salarioActualPorEmpleado * l.cantidad, 0)
      const manualesTotal = empleadosIntegral.reduce((sum, e) => sum + e.salarioActual, 0)
      return lotesTotal + manualesTotal
    }
    const lotesTotal = lotes.reduce((sum, l) => sum + l.totalSalarios, 0)
    const manualesTotal = empleados
      .filter(e => e.origen === 'manual')
      .reduce((sum, e) => sum + e.salario, 0)
    return lotesTotal + manualesTotal
  }, [isIntegral, lotes, empleados, lotesIntegral, empleadosIntegral])

  const totalEmpleados = useMemo(() => {
    if (isIntegral) {
      const lotesCount = lotesIntegral.reduce((sum, l) => sum + l.cantidad, 0)
      return lotesCount + empleadosIntegral.length
    }
    const lotesCount = lotes.reduce((sum, l) => sum + l.cantidad, 0)
    const manualesCount = empleados.filter(e => e.origen === 'manual').length
    return lotesCount + manualesCount
  }, [isIntegral, lotes, empleados, lotesIntegral, empleadosIntegral])

  const salarioPromedio = useMemo(
    () => (totalEmpleados > 0 ? totalNomina / totalEmpleados : 0),
    [totalNomina, totalEmpleados]
  )

  // Budget calculation — integral uses difference from minimum, others use 40% split
  const pctBonos = configuracion.split.porcentajeBonos
  const pctSalario = configuracion.split.porcentajeSalario

  const presupuestoBonos = useMemo(() => {
    if (isIntegral) {
      // Budget = sum of (salario - integral minimo) for eligible employees only
      let total = 0
      for (const lote of lotesIntegral) {
        if (lote.salarioActualPorEmpleado >= SALARIO_INTEGRAL_MINIMO) {
          total += (lote.salarioActualPorEmpleado - SALARIO_INTEGRAL_MINIMO) * lote.cantidad
        }
      }
      for (const emp of empleadosIntegral) {
        if (emp.salarioActual >= SALARIO_INTEGRAL_MINIMO) {
          total += emp.salarioActual - SALARIO_INTEGRAL_MINIMO
        }
      }
      return total
    }
    return totalNomina * (pctBonos / 100)
  }, [isIntegral, totalNomina, pctBonos, lotesIntegral, empleadosIntegral])

  // Calculate total assigned to budget
  // For integral: ALL bonuses count toward total budget (difference from minimum integral)
  // For non-integral: only categories that count toward the percentage split
  const totalAsignado40 = useMemo(() => {
    let sum = 0
    for (const [tipo, cfg] of Object.entries(localConfig)) {
      if (!cfg || cfg.valor <= 0) continue
      const meta = BONUS_TYPES_METADATA[tipo as BonusTypeEnum]
      if (!meta) continue
      if (!isIntegral && !CATEGORIES_THAT_COUNT.has(meta.categoria)) continue
      const resolved = resolveBonus(cfg, salarioPromedio)
      sum += resolved * totalEmpleados
    }
    return sum
  }, [localConfig, salarioPromedio, totalEmpleados, isIntegral])

  const restante40 = presupuestoBonos - totalAsignado40
  const progressPct = presupuestoBonos > 0 ? Math.min((totalAsignado40 / presupuestoBonos) * 100, 100) : 0
  const excedido = totalAsignado40 > presupuestoBonos && presupuestoBonos > 0

  // Integral 40% cap zones — Ley 1393/2010 Art. 30
  const integralZones = useMemo(() => {
    if (!isIntegral) return null

    let totalCapado = 0   // ML + Alimentación (subject to 40% cap)
    let totalExento = 0   // Repartición + Viáticos + Dotación (exempt)

    for (const [tipo, cfg] of Object.entries(localConfig)) {
      if (!cfg || cfg.valor <= 0) continue
      const meta = BONUS_TYPES_METADATA[tipo as BonusTypeEnum]
      if (!meta) continue
      const resolved = resolveBonus(cfg, salarioPromedio)
      const total = resolved * totalEmpleados

      if (CATEGORIES_THAT_COUNT.has(meta.categoria)) {
        totalCapado += total
      } else {
        totalExento += total
      }
    }

    const numEmpleados = totalEmpleados || 1
    const exentoPorEmpleado = totalExento / numEmpleados
    const capMaximoPorEmpleado = calcularCapMaximo(SALARIO_INTEGRAL_MINIMO, exentoPorEmpleado)
    const capMaximoTotal = capMaximoPorEmpleado * numEmpleados

    const excede40 = Math.round(totalCapado) > Math.round(capMaximoTotal)
    const capPctUsado = capMaximoTotal > 0
      ? Math.min((totalCapado / capMaximoTotal) * 100, 100)
      : 0
    const holguraLey = Math.max(0, capMaximoTotal - totalCapado)
    const budgetRestante = Math.max(0, presupuestoBonos - totalCapado - totalExento)
    // Effective available = min(room in 40% cap, room in total budget)
    const holguraEfectiva = Math.min(holguraLey, budgetRestante)

    return {
      totalCapado,
      totalExento,
      capMaximoTotal,
      capMaximoPorEmpleado,
      excede40,
      capPctUsado,
      holgura: holguraEfectiva,
      holguraLey,
      exceso: Math.max(0, Math.round(totalCapado - capMaximoTotal)),
      budgetRestante
    }
  }, [isIntegral, localConfig, salarioPromedio, totalEmpleados, presupuestoBonos])

  // Handle toggling a bonus type
  const handleToggleBono = (tipo: BonusTypeEnum) => {
    toggleBonusType(tipo)

    setLocalConfig(prev => {
      const updated = { ...prev }
      if (tiposSeleccionados.includes(tipo)) {
        // Was selected, now being toggled OFF — remove config
        delete updated[tipo]
      } else {
        // Was not selected, now being toggled ON — add default config
        updated[tipo] = configuracion.bonusConfig[tipo] ?? { mode: 'fijo', valor: 0 }
      }
      return updated
    })
  }

  // Handle changing mode (fijo/variable) for a bonus
  const handleModeChange = (tipo: string, mode: 'fijo' | 'variable') => {
    setLocalConfig(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], mode, valor: 0 }
    }))
  }

  // Handle changing the value for a bonus
  const handleValueChange = (tipo: string, rawValue: string) => {
    const valor = parseFloat(rawValue) || 0
    setLocalConfig(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], valor }
    }))
  }

  // Can the user advance?
  const puedeAvanzar = useMemo(() => {
    if (tiposSeleccionados.length === 0) return false
    if (excedido) return false
    if (isIntegral && integralZones?.excede40) return false
    for (const tipo of tiposSeleccionados) {
      const cfg = localConfig[tipo]
      if (!cfg || cfg.valor <= 0) return false
    }
    return true
  }, [tiposSeleccionados, localConfig, excedido, isIntegral, integralZones])

  const handleContinuar = () => {
    if (!puedeAvanzar) return
    setBonusConfig(localConfig)
    aplicarBonosALotes()
    siguientePaso()
  }

  const hasAnySelected = tiposSeleccionados.length > 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Configura los Bonos
        </h2>
        <p className="text-gray-600">
          {isIntegral
            ? 'Selecciona y configura los bonos que complementaran el salario integral de tus empleados'
            : flujoSeleccionado === 'nuevos_beneficios'
              ? 'Selecciona los bonos que quieres agregar y configura el monto de cada uno'
              : 'Selecciona y configura los bonos para reestructurar la compensacion de tus empleados'}
        </p>
        {hasAnySelected && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-700 font-medium">
              {tiposSeleccionados.length} {tiposSeleccionados.length === 1 ? 'tipo seleccionado' : 'tipos seleccionados'}
            </span>
          </div>
        )}
      </div>

      {/* Integral context banner */}
      {isIntegral && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-indigo-800 font-medium">
                Salario Integral + Bonos complementarios
              </p>
              <p className="text-xs text-indigo-700 mt-1">
                Los bonos seleccionados complementan la compensacion total del empleado. El factor prestacional del 30% ya esta incluido en el salario integral (Art. 132 CST). Los bonos son pagos no constitutivos de salario (Art. 128 CST).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compact info banner */}
      {totalNomina > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Total nomina:</span>
              <span className="font-semibold text-gray-900">{formatCOP(totalNomina)}</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Empleados:</span>
              <span className="font-semibold text-gray-900">{totalEmpleados}</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-500">
                {isIntegral ? 'Monto disponible para bonos:' : `Presupuesto bonos (${pctBonos}%):`}
              </span>
              <span className="font-semibold text-gray-900">{formatCOP(presupuestoBonos)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Budget progress section */}
      {hasAnySelected && presupuestoBonos > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {isIntegral && integralZones ? (
            <>
              {/* ZONE A: 40% Cap — ML + Alimentación (Ley 1393/2010) */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 className="text-base font-semibold text-gray-900">
                    Limite Ley 1393 — ML + Alimentacion
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Limite Ley 1393</span>
                      <span className="font-semibold text-gray-900">{formatCOP(integralZones.capMaximoTotal)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">ML + Alim. asignado</span>
                      <span className={`font-semibold ${integralZones.excede40 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {formatCOP(integralZones.totalCapado)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Disponible</span>
                      <span className={`font-semibold ${integralZones.excede40 ? 'text-amber-600' : integralZones.holgura === 0 ? 'text-gray-500' : 'text-emerald-600'}`}>
                        {integralZones.excede40 ? `-${formatCOP(integralZones.exceso)}` : formatCOP(integralZones.holgura)}
                      </span>
                      {!integralZones.excede40 && integralZones.holgura < integralZones.holguraLey && integralZones.budgetRestante <= 0 && (
                        <span className="text-xs text-gray-400 block">Presupuesto agotado</span>
                      )}
                    </div>
                  </div>

                  {/* Effective limit progress bar — use effective cap considering budget */}
                  {(() => {
                    const effectiveCap = Math.min(integralZones.capMaximoTotal, integralZones.totalCapado + integralZones.budgetRestante)
                    const effectivePct = effectiveCap > 0 ? Math.min((integralZones.totalCapado / effectiveCap) * 100, 100) : 0
                    return (
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            integralZones.excede40 ? 'bg-amber-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${Math.min(effectivePct, 100)}%` }}
                        />
                      </div>
                    )
                  })()}

                  <p className="text-xs text-gray-500">
                    Ley 1393/2010 Art. 30: Factor prestacional (30%) + ML + Alimentacion ≤ 40% del total devengado.
                    {integralZones.totalExento > 0 && integralZones.holguraLey > integralZones.holgura && (
                      <span className="text-emerald-600 font-medium">
                        {' '}Limite legal: {formatCOP(integralZones.capMaximoTotal)} (aumentado por Reparticion).
                      </span>
                    )}
                    {integralZones.totalExento === 0 && (
                      <span className="text-emerald-600 font-medium">
                        {' '}Al asignar Reparticion de Utilidades, este limite aumenta dinamicamente.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 my-4" />

              {/* ZONE B: Total Budget */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <h3 className="text-base font-semibold text-gray-900">
                    Presupuesto Total de Bonos
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Presupuesto</span>
                      <span className="font-semibold text-gray-900">{formatCOP(presupuestoBonos)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Asignado</span>
                      <span className={`font-semibold ${excedido ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCOP(totalAsignado40)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Restante</span>
                      <span className={`font-semibold ${restante40 < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCOP(restante40)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        excedido ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                    />
                  </div>

                  <p className="text-xs text-gray-400">
                    Diferencia entre salario actual y salario integral minimo — disponible para distribuir como bonos (Art. 128 CST).
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                {`Presupuesto ${pctBonos}%`}
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block">Presupuesto</span>
                    <span className="font-semibold text-gray-900">{formatCOP(presupuestoBonos)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Asignado</span>
                    <span className={`font-semibold ${excedido ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCOP(totalAsignado40)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Restante</span>
                    <span className={`font-semibold ${restante40 < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCOP(restante40)}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      excedido ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(progressPct, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span className={`font-medium ${excedido ? 'text-red-600' : 'text-gray-700'}`}>
                    {progressPct.toFixed(1)}% utilizado
                  </span>
                  <span>100%</span>
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  {`Solo suman al ${pctBonos}%: Mera Liberalidad y Alimentacion. Viaticos y Dotacion no cuentan.`}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Warning: 40% cap exceeded (integral only) */}
      {isIntegral && integralZones?.excede40 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-amber-800">
              ML + Alimentacion excede el tope del 40% (Ley 1393/2010)
            </p>
            <p className="text-sm text-amber-700 mt-1">
              El exceso es de {formatCOP(integralZones.exceso)}.
              Reasigna el monto excedente a <strong>Reparticion de Utilidades</strong>, que no cuenta hacia el 40% y puede absorber la mayor parte del presupuesto.
            </p>
          </div>
        </div>
      )}

      {/* Prominent warning when budget exceeded */}
      {excedido && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 flex items-start gap-3 animate-pulse-once">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-red-800">
              {isIntegral
                ? 'El total de bonos supera el presupuesto disponible'
                : `El total de bonos supera el presupuesto del ${pctBonos}%`}
            </p>
            <p className="text-sm text-red-600 mt-1">
              Reduce los montos o elimina bonos hasta que el total asignado ({formatCOP(totalAsignado40)}) no supere el presupuesto ({formatCOP(presupuestoBonos)}). No puedes continuar hasta resolverlo.
            </p>
          </div>
        </div>
      )}

      {/* Category sections */}
      {CATEGORY_SECTIONS.map(section => {
        const bonos = bonosPorCategoria[section.key] || []
        if (bonos.length === 0) return null

        return (
          <div key={section.key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Category header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-lg ${section.iconBg} flex items-center justify-center ${section.iconColor}`}>
                {section.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </h3>
                  {section.countsToward40 ? (
                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${
                      isIntegral
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {isIntegral ? 'Suma al 40% (Ley 1393)' : `Suma al ${pctBonos}%`}
                    </span>
                  ) : (
                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${
                      isIntegral
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isIntegral ? 'No suma al 40%' : `No suma al ${pctBonos}%`}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {section.subtitle}
                </p>
              </div>
            </div>

            {/* Bonus cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bonos.map(bono => {
                const isSelected = tiposSeleccionados.includes(bono.id)
                const cfg = localConfig[bono.id]
                const isDotacion = bono.categoria === BonusCategory.DOTACION
                const meta = BONUS_TYPES_METADATA[bono.id as BonusTypeEnum]

                return (
                  <div
                    key={bono.id}
                    className={`rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-tikin-red bg-red-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Clickable toggle area */}
                    <button
                      type="button"
                      onClick={() => handleToggleBono(bono.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                          isSelected
                            ? 'bg-tikin-red border-tikin-red'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{bono.icono}</span>
                            <span className="font-semibold text-gray-900 text-sm truncate">
                              {bono.nombre}
                            </span>
                            {isDotacion && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                                Obligatoria
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {bono.descripcion}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Special rules (always visible) */}
                    {bono.reglasEspeciales && bono.reglasEspeciales.length > 0 && (
                      <div className={`mx-4 mb-3 ${section.rulesColor.bg} border ${section.rulesColor.border} rounded-lg p-3`}>
                        <ul className="space-y-1">
                          {bono.reglasEspeciales.map((regla, idx) => (
                            <li key={idx} className={`text-xs ${section.rulesColor.text} flex items-start gap-2`}>
                              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              {regla}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Configuration panel (visible when selected) */}
                    {isSelected && cfg && (
                      <div className="px-4 pb-4 pt-1 border-t border-red-100">
                        <div className="space-y-3">
                          {/* Mode toggle */}
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleModeChange(bono.id, 'fijo')
                              }}
                              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                cfg.mode === 'fijo'
                                  ? 'bg-white text-gray-900 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              $ Fijo
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleModeChange(bono.id, 'variable')
                              }}
                              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                cfg.mode === 'variable'
                                  ? 'bg-white text-gray-900 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              % del salario
                            </button>
                          </div>

                          {/* Value input */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-400 text-sm">
                                {cfg.mode === 'fijo' ? '$' : '%'}
                              </span>
                            </div>
                            <input
                              type="number"
                              min={0}
                              step={cfg.mode === 'fijo' ? 1000 : 1}
                              value={cfg.valor || ''}
                              onChange={(e) => handleValueChange(bono.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder={cfg.mode === 'fijo' ? 'Monto en COP' : 'Porcentaje'}
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red outline-none transition-colors bg-white"
                            />
                          </div>

                          {/* Resolved amount display */}
                          {cfg.valor > 0 && (
                            <div className="text-xs text-gray-500">
                              {cfg.mode === 'variable' && salarioPromedio > 0 ? (
                                <span>
                                  = {formatCOP(resolveBonus(cfg, salarioPromedio))} por empleado
                                  <span className="text-gray-400 ml-1">(salario promedio {formatCOP(salarioPromedio)})</span>
                                </span>
                              ) : cfg.mode === 'fijo' ? (
                                <span>
                                  = {formatCOP(cfg.valor)} por empleado
                                </span>
                              ) : null}
                            </div>
                          )}

                          {/* Inline cap enforcement warning */}
                          {cfg.valor > 0 && isIntegral && integralZones?.excede40 && meta && CATEGORIES_THAT_COUNT.has(meta.categoria) && (
                            <p className="text-xs text-amber-600 font-medium mt-1">
                              Contribuye al exceso del 40% (Ley 1393)
                            </p>
                          )}
                          {cfg.valor > 0 && excedido && meta && (isIntegral || CATEGORIES_THAT_COUNT.has(meta.categoria)) && (
                            <p className="text-xs text-red-600 font-medium mt-1">
                              {isIntegral ? 'Excede el presupuesto total de bonos' : `Excede el presupuesto del ${pctBonos}%`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Validation hint when not all bonuses are configured */}
      {hasAnySelected && !puedeAvanzar && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-700">
            Configura un monto mayor a 0 para cada bono seleccionado antes de continuar.
          </p>
        </div>
      )}

      {/* Navigation buttons */}
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
          onClick={handleContinuar}
          disabled={!puedeAvanzar}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            puedeAvanzar
              ? 'bg-tikin-red text-white hover:bg-red-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continuar
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
