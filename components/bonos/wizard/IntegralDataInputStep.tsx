'use client'

import { useState, useRef, useEffect } from 'react'
import { useBonosStore } from '@/store/bonosStore'
import { SALARIO_INTEGRAL_MINIMO } from '@/lib/bonos/constants'
import type { ARLRiskLevel } from '@/lib/constants/parafiscales'
import { ARLRiskSelector } from './ARLRiskSelector'

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value)

/**
 * IntegralDataInputStep — Paso 2 del flujo de Salario Integral
 * Entrada simplificada: solo salario actual por empleado/lote
 * No hay selección de bonos — el integral reemplaza prestaciones.
 */
export function IntegralDataInputStep() {
  const {
    empleadosIntegral,
    lotesIntegral,
    addEmpleadoIntegral,
    removeEmpleadoIntegral,
    addLoteIntegral,
    removeLoteIntegral,
    siguientePaso,
    pasoAnterior
  } = useBonosStore()

  const [modo, setModo] = useState<'lotes' | 'individual'>('lotes')

  // Lote form
  const [loteNombre, setLoteNombre] = useState('')
  const [loteCantidad, setLoteCantidad] = useState<number | ''>('')
  const [loteSalario, setLoteSalario] = useState<number | ''>('')
  const [loteArl, setLoteArl] = useState<ARLRiskLevel>('I')

  // Individual form
  const [empNombre, setEmpNombre] = useState('')
  const [empSalario, setEmpSalario] = useState<number | ''>('')
  const [empCedula, setEmpCedula] = useState('')
  const [empCargo, setEmpCargo] = useState('')
  const [empArl, setEmpArl] = useState<ARLRiskLevel>('I')

  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstInputRef.current?.focus()
  }, [modo])

  const totalEmpleados = lotesIntegral.reduce((sum, l) => sum + l.cantidad, 0) + empleadosIntegral.length
  const hasData = totalEmpleados > 0

  // Lote handlers
  const handleAddLote = () => {
    if (!loteCantidad || !loteSalario) return
    addLoteIntegral({
      nombre: loteNombre.trim() || `Lote ${lotesIntegral.length + 1}`,
      cantidad: Number(loteCantidad),
      salarioActualPorEmpleado: Number(loteSalario),
      arlRiskLevel: loteArl,
      expandido: false
    })
    setLoteNombre('')
    setLoteCantidad('')
    setLoteSalario('')
    setLoteArl('I')
    firstInputRef.current?.focus()
  }

  // Individual handlers
  const handleAddEmpleado = () => {
    if (!empSalario) return
    addEmpleadoIntegral({
      nombre: empNombre.trim() || `Empleado ${empleadosIntegral.length + 1}`,
      salarioActual: Number(empSalario),
      cedula: empCedula.trim() || undefined,
      cargo: empCargo.trim() || undefined,
      origen: 'manual',
      arlRiskLevel: empArl
    })
    setEmpNombre('')
    setEmpSalario('')
    setEmpCedula('')
    setEmpCargo('')
    setEmpArl('I')
    firstInputRef.current?.focus()
  }

  const handleContinuar = () => {
    if (hasData) {
      siguientePaso()
    }
  }

  const salarioMinIntegral = SALARIO_INTEGRAL_MINIMO

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Empleados para Salario Integral
        </h2>
        <p className="text-gray-600 mt-2">
          Ingresa los salarios actuales de los empleados que deseas evaluar para conversion a integral
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-purple-800">
            <p className="font-medium mb-1">Requisito de elegibilidad</p>
            <p>
              Solo empleados con salario actual igual o superior a{' '}
              <span className="font-semibold">{formatCOP(salarioMinIntegral)}</span>{' '}
              (13 SMMLV 2026) son elegibles para salario integral (Art. 132 CST). Empleados con salario menor seran marcados como no elegibles en los resultados.
            </p>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setModo('lotes')}
          className={`flex-1 p-3 rounded-lg border-2 transition-all text-center ${
            modo === 'lotes'
              ? 'border-tikin-red bg-red-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-sm font-semibold text-gray-900">Por Lotes</div>
          <p className="text-xs text-gray-500 mt-0.5">Grupos de empleados con el mismo salario</p>
        </button>
        <button
          type="button"
          onClick={() => setModo('individual')}
          className={`flex-1 p-3 rounded-lg border-2 transition-all text-center ${
            modo === 'individual'
              ? 'border-tikin-red bg-red-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-sm font-semibold text-gray-900">Individual</div>
          <p className="text-xs text-gray-500 mt-0.5">Un empleado a la vez</p>
        </button>
      </div>

      {/* Input form */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        {modo === 'lotes' ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Lote</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="lote-nombre" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre del lote
                </label>
                <input
                  ref={firstInputRef}
                  id="lote-nombre"
                  type="text"
                  value={loteNombre}
                  onChange={(e) => setLoteNombre(e.target.value)}
                  placeholder="Ej: Gerentes"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red"
                />
              </div>
              <div>
                <label htmlFor="lote-cantidad" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cantidad de empleados *
                </label>
                <input
                  id="lote-cantidad"
                  type="number"
                  min={1}
                  value={loteCantidad}
                  onChange={(e) => setLoteCantidad(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Ej: 5"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red"
                />
              </div>
              <div>
                <label htmlFor="lote-salario" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Salario actual por empleado *
                </label>
                <input
                  id="lote-salario"
                  type="number"
                  min={0}
                  value={loteSalario}
                  onChange={(e) => setLoteSalario(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Ej: 25000000"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red"
                />
              </div>
            </div>

            {/* Eligibility warning */}
            {loteSalario && Number(loteSalario) > 0 && Number(loteSalario) < salarioMinIntegral && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Nota:</span> Este salario ({formatCOP(Number(loteSalario))}) es menor al minimo integral ({formatCOP(salarioMinIntegral)}). Estos empleados seran marcados como no elegibles.
                </p>
              </div>
            )}

            {/* ARL Risk Level per lote */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Riesgo ARL del lote
              </label>
              <ARLRiskSelector value={loteArl} onChange={setLoteArl} compact accentColor="purple" />
            </div>

            <button
              type="button"
              onClick={handleAddLote}
              disabled={!loteCantidad || !loteSalario}
              className={`mt-4 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                loteCantidad && loteSalario
                  ? 'bg-tikin-red text-white hover:bg-red-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Agregar Lote
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Empleado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emp-nombre" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre
                </label>
                <input
                  ref={firstInputRef}
                  id="emp-nombre"
                  type="text"
                  value={empNombre}
                  onChange={(e) => setEmpNombre(e.target.value)}
                  placeholder="Nombre del empleado"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red"
                />
              </div>
              <div>
                <label htmlFor="emp-salario" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Salario actual *
                </label>
                <input
                  id="emp-salario"
                  type="number"
                  min={0}
                  value={empSalario}
                  onChange={(e) => setEmpSalario(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Ej: 40000000"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red"
                />
              </div>
              <div>
                <label htmlFor="emp-cedula" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cedula
                </label>
                <input
                  id="emp-cedula"
                  type="text"
                  value={empCedula}
                  onChange={(e) => setEmpCedula(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red"
                />
              </div>
              <div>
                <label htmlFor="emp-cargo" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cargo
                </label>
                <input
                  id="emp-cargo"
                  type="text"
                  value={empCargo}
                  onChange={(e) => setEmpCargo(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-tikin-red/20 focus:border-tikin-red"
                />
              </div>
            </div>

            {/* Eligibility warning */}
            {empSalario && Number(empSalario) > 0 && Number(empSalario) < salarioMinIntegral && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Nota:</span> Este salario ({formatCOP(Number(empSalario))}) es menor al minimo integral ({formatCOP(salarioMinIntegral)}). Este empleado sera marcado como no elegible.
                </p>
              </div>
            )}

            {/* ARL Risk Level per employee */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Riesgo ARL
              </label>
              <ARLRiskSelector value={empArl} onChange={setEmpArl} compact accentColor="purple" />
            </div>

            <button
              type="button"
              onClick={handleAddEmpleado}
              disabled={!empSalario}
              className={`mt-4 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                empSalario
                  ? 'bg-tikin-red text-white hover:bg-red-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Agregar Empleado
            </button>
          </div>
        )}
      </div>

      {/* Current data summary */}
      {(lotesIntegral.length > 0 || empleadosIntegral.length > 0) && (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Empleados Ingresados ({totalEmpleados})
          </h3>

          {/* Lotes list */}
          {lotesIntegral.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Lotes</h4>
              {lotesIntegral.map(lote => {
                const elegible = lote.salarioActualPorEmpleado >= salarioMinIntegral
                return (
                  <div key={lote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${elegible ? 'bg-green-500' : 'bg-amber-500'}`} />
                      <div>
                        <span className="font-medium text-gray-900">{lote.nombre}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {lote.cantidad} empleados × {formatCOP(lote.salarioActualPorEmpleado)}
                        </span>
                        {!elegible && (
                          <span className="text-amber-600 text-xs ml-2">(No elegible)</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLoteIntegral(lote.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      aria-label={`Eliminar lote ${lote.nombre}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Individual employees list */}
          {empleadosIntegral.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Individuales</h4>
              {empleadosIntegral.map(emp => {
                const elegible = emp.salarioActual >= salarioMinIntegral
                return (
                  <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${elegible ? 'bg-green-500' : 'bg-amber-500'}`} />
                      <div>
                        <span className="font-medium text-gray-900">{emp.nombre}</span>
                        <span className="text-gray-500 text-sm ml-2">{formatCOP(emp.salarioActual)}</span>
                        {emp.cargo && <span className="text-gray-400 text-xs ml-2">({emp.cargo})</span>}
                        {!elegible && (
                          <span className="text-amber-600 text-xs ml-2">(No elegible)</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEmpleadoIntegral(emp.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      aria-label={`Eliminar empleado ${emp.nombre}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Total summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total empleados:</span>
              <span className="font-semibold text-gray-900">{totalEmpleados}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Elegibles ({'>='} {formatCOP(salarioMinIntegral)}):</span>
              <span className="font-semibold text-green-600">
                {lotesIntegral.filter(l => l.salarioActualPorEmpleado >= salarioMinIntegral).reduce((s, l) => s + l.cantidad, 0) +
                 empleadosIntegral.filter(e => e.salarioActual >= salarioMinIntegral).length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={pasoAnterior}
          className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <button
          onClick={handleContinuar}
          disabled={!hasData}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            hasData
              ? 'bg-tikin-red text-white hover:bg-red-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Ver Resultados
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
