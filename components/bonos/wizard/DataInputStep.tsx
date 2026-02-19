'use client'

import { useState } from 'react'
import { useBonosStore } from '@/store/bonosStore'
import { DataInputMethod, MIN_SALARIO_BONOS } from '@/lib/bonos/constants'
import type { LoteBonos2 } from '@/lib/bonos/types'
import type { ARLRiskLevel } from '@/lib/constants/parafiscales'
import { ARLRiskSelector } from './ARLRiskSelector'
import { ExcelUploadSection } from './ExcelUploadSection'
import { REGULAR_FLOW_CONFIG } from '@/lib/bonos/excel-parser'
import type { ParsedExcelEmployee } from '@/lib/bonos/excel-parser'
import { downloadRegularTemplate } from '@/lib/bonos/excel-template'
import { ValidationEngine } from '@/lib/bonos/validationEngine'

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value)

/**
 * DataInputStep - Paso 2: Ingreso de datos de nomina/empleados
 * Solo captura: nombre, cantidad, salario, ARL.
 * La configuracion de bonos se realiza en BonusSelectionStep (paso 3).
 */
export function DataInputStep() {
  const {
    configuracion,
    flujoSeleccionado,
    lotes,
    empleados,
    addLote,
    removeLote,
    addEmpleado,
    removeEmpleado,
    setDataLoadMethod,
    setEmpleadosFromExcel,
    siguientePaso,
    pasoAnterior
  } = useBonosStore()

  const esNuevosBeneficios = flujoSeleccionado === 'nuevos_beneficios'

  const metodo = configuracion.dataLoad.metodo

  // ---- Lote form state ----
  const [mostrarFormLote, setMostrarFormLote] = useState(false)
  const [loteNombre, setLoteNombre] = useState('')
  const [loteCantidad, setLoteCantidad] = useState<number | ''>('')
  const [loteSalario, setLoteSalario] = useState<number | ''>('')
  const [loteArl, setLoteArl] = useState<ARLRiskLevel>('I')

  // ---- Individual employee form state ----
  const [mostrarFormEmpleado, setMostrarFormEmpleado] = useState(false)
  const [empNombre, setEmpNombre] = useState('')
  const [empSalario, setEmpSalario] = useState<number | ''>('')
  const [empCedula, setEmpCedula] = useState('')
  const [empCargo, setEmpCargo] = useState('')
  const [empArl, setEmpArl] = useState<ARLRiskLevel>('I')

  // ---- Delete confirmation ----
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // ---- Salary validation error ----
  const [salarioError, setSalarioError] = useState<string | null>(null)

  const tieneData = lotes.length > 0 || empleados.length > 0

  // ---- Totals across all lotes ----
  const totalEmpleadosLotes = lotes.reduce((sum, l) => sum + l.cantidad, 0)
  const totalSalariosLotes = lotes.reduce((sum, l) => sum + l.totalSalarios, 0)

  // ---- Totals across individual employees ----
  const totalEmpleadosIndividuales = empleados.filter(e => e.origen === 'manual').length
  const totalSalariosIndividuales = empleados
    .filter(e => e.origen === 'manual')
    .reduce((sum: number, e) => sum + e.salario, 0)

  const totalEmpleados = totalEmpleadosLotes + totalEmpleadosIndividuales
  const totalSalariosGlobal = totalSalariosLotes + totalSalariosIndividuales

  // ---- Handlers ----

  const resetLoteForm = () => {
    setLoteNombre('')
    setLoteCantidad('')
    setLoteSalario('')
    setLoteArl('I')
  }

  const resetEmpleadoForm = () => {
    setEmpNombre('')
    setEmpSalario('')
    setEmpCedula('')
    setEmpCargo('')
    setEmpArl('I')
  }

  const handleAgregarLote = () => {
    if (!loteNombre.trim() || !loteCantidad || !loteSalario) return

    if (Number(loteSalario) < MIN_SALARIO_BONOS) {
      setSalarioError(`El salario debe ser minimo ${formatCOP(MIN_SALARIO_BONOS)}. La base salarial (60%) no puede ser inferior a 1 SMMLV (Ley 1393/2010 Art. 30).`)
      return
    }
    setSalarioError(null)

    addLote({
      nombre: loteNombre.trim(),
      cantidad: Number(loteCantidad),
      salarioPorEmpleado: Number(loteSalario),
      bonos: {},
      arlRiskLevel: loteArl,
      totalSalarios: 0,
      totalBonos: 0,
      totalCompensacion: 0,
      expandido: false
    })

    resetLoteForm()
    setMostrarFormLote(false)
  }

  const handleAgregarEmpleado = () => {
    if (!empNombre.trim() || !empSalario) return

    if (Number(empSalario) < MIN_SALARIO_BONOS) {
      setSalarioError(`El salario debe ser minimo ${formatCOP(MIN_SALARIO_BONOS)}. La base salarial (60%) no puede ser inferior a 1 SMMLV (Ley 1393/2010 Art. 30).`)
      return
    }
    setSalarioError(null)

    addEmpleado({
      nombre: empNombre.trim(),
      salario: Number(empSalario),
      cedula: empCedula.trim() || undefined,
      cargo: empCargo.trim() || undefined,
      origen: 'manual',
      bonos: {},
      arlRiskLevel: empArl
    })

    resetEmpleadoForm()
    setMostrarFormEmpleado(false)
  }

  const handleEliminarLote = (id: string) => {
    removeLote(id)
    setConfirmDeleteId(null)
  }

  const handleEliminarEmpleado = (id: string) => {
    removeEmpleado(id)
    setConfirmDeleteId(null)
  }

  const handleContinuar = () => {
    if (tieneData) {
      siguientePaso()
    }
  }

  const esExcel = metodo === DataInputMethod.EXCEL
  const esLotes = metodo === DataInputMethod.LOTES

  const handleExcelConfirmed = (parsedEmployees: ParsedExcelEmployee[]) => {
    const employees = parsedEmployees.map(pe => {
      const emp = ValidationEngine.normalizeEmployee({
        nombre: pe.nombre,
        salario: pe.salario || 0,
        cedula: pe.cedula,
        cargo: pe.cargo,
        origen: 'excel' as const,
        bonos: {}
      })
      emp.arlRiskLevel = pe.arl
      return emp
    })
    setEmpleadosFromExcel(employees)
  }

  const handleExcelClear = () => {
    setEmpleadosFromExcel([])
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Titulo */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Carga de Datos
        </h2>
        <p className="text-gray-600">
          {esNuevosBeneficios
            ? 'Ingresa el salario actual y datos de tus empleados'
            : 'Ingresa los datos de nomina de tus empleados'
          }
        </p>
      </div>

      {/* ============================================================ */}
      {/* METHOD SELECTION */}
      {/* ============================================================ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Metodo de Carga de Datos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lotes */}
          <button
            onClick={() => setDataLoadMethod(DataInputMethod.LOTES)}
            className={`p-4 rounded-lg border-2 transition-all ${
              metodo === DataInputMethod.LOTES
                ? 'border-tikin-red bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                metodo === DataInputMethod.LOTES
                  ? 'bg-tikin-red text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900">Por Lotes</div>
              <p className="text-sm text-gray-600 mt-1">
                Grupos de empleados con mismo salario
              </p>
            </div>
          </button>

          {/* Excel */}
          <button
            onClick={() => setDataLoadMethod(DataInputMethod.EXCEL)}
            className={`p-4 rounded-lg border-2 transition-all ${
              metodo === DataInputMethod.EXCEL
                ? 'border-tikin-red bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                metodo === DataInputMethod.EXCEL
                  ? 'bg-tikin-red text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900">Desde Excel</div>
              <p className="text-sm text-gray-600 mt-1">
                Carga masiva con archivo Excel
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* EXCEL MODE */}
      {/* ============================================================ */}
      {esExcel && (
        <ExcelUploadSection
          flowConfig={REGULAR_FLOW_CONFIG}
          onDataConfirmed={handleExcelConfirmed}
          onClear={handleExcelClear}
          downloadTemplate={downloadRegularTemplate}
          templateName="plantilla_empleados_bonos.xlsx"
        />
      )}

      {/* ============================================================ */}
      {/* LOTES MODE */}
      {/* ============================================================ */}
      {esLotes && (
        <>
          {/* Empty state */}
          {lotes.length === 0 && !mostrarFormLote && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-tikin-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Agrega tu primer lote de empleados
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Un lote agrupa empleados con el mismo salario y nivel de riesgo ARL.
                  Por ejemplo: &quot;Operarios&quot;, &quot;Administrativos&quot;, &quot;Gerencia&quot;.
                </p>
                <button
                  onClick={() => setMostrarFormLote(true)}
                  className="px-6 py-3 bg-tikin-red text-white rounded-lg hover:bg-red-700 font-medium transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Primer Lote
                </button>
              </div>
            </div>
          )}

          {/* Lote Cards */}
          {lotes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Lotes de Empleados ({lotes.length})
                </h3>
                <button
                  onClick={() => setMostrarFormLote(true)}
                  className="px-4 py-2 bg-tikin-red text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar Lote
                </button>
              </div>

              {lotes.map(lote => (
                <LoteCard
                  key={lote.id}
                  lote={lote}
                  confirmDeleteId={confirmDeleteId}
                  onRequestDelete={(id) => setConfirmDeleteId(id)}
                  onConfirmDelete={handleEliminarLote}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                />
              ))}
            </div>
          )}

          {/* Add Lote Form (inline, toggleable) */}
          {mostrarFormLote && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Nuevo Lote de Empleados
                </h3>
                <button
                  onClick={() => {
                    setMostrarFormLote(false)
                    resetLoteForm()
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Cerrar formulario"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Nombre del lote */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del lote
                  </label>
                  <input
                    type="text"
                    value={loteNombre}
                    onChange={(e) => setLoteNombre(e.target.value)}
                    placeholder="Ej: Operarios, Administrativos"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red text-sm"
                  />
                </div>

                {/* Cantidad de empleados */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad de empleados
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={loteCantidad}
                    onChange={(e) => setLoteCantidad(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ej: 10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red text-sm"
                  />
                </div>

                {/* Salario por empleado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {esNuevosBeneficios ? 'Salario actual por empleado' : 'Salario por empleado'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      value={loteSalario}
                      onChange={(e) => setLoteSalario(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ej: 2.000.000"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* ARL Risk Level per lote */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de Riesgo ARL del lote
                </label>
                <ARLRiskSelector value={loteArl} onChange={setLoteArl} compact />
              </div>

              {/* Preview of lote totals */}
              {loteCantidad && loteSalario && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Vista previa del lote</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Empleados</p>
                      <p className="text-lg font-semibold text-gray-900">{Number(loteCantidad)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Salario por empleado</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCOP(Number(loteSalario))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Nomina</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCOP(Number(loteCantidad) * Number(loteSalario))}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Salary minimum warning */}
              {salarioError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-xs text-red-700">{salarioError}</p>
                </div>
              )}

              {/* Form actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setMostrarFormLote(false)
                    resetLoteForm()
                    setSalarioError(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAgregarLote}
                  disabled={!loteNombre.trim() || !loteCantidad || !loteSalario}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                    loteNombre.trim() && loteCantidad && loteSalario
                      ? 'bg-tikin-red text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar Lote
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* INDIVIDUAL EMPLOYEE MODE (for mixto or as alternative) */}
      {/* ============================================================ */}
      {metodo === DataInputMethod.LOTES && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Empleados Individuales
              {totalEmpleadosIndividuales > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({totalEmpleadosIndividuales})
                </span>
              )}
            </h3>
            {!mostrarFormEmpleado && (
              <button
                onClick={() => setMostrarFormEmpleado(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Agregar Empleado
              </button>
            )}
          </div>

          {/* Individual employee cards */}
          {empleados.filter(e => e.origen === 'manual').length > 0 && (
            <div className="space-y-3">
              {empleados
                .filter(e => e.origen === 'manual')
                .map(emp => (
                  <div key={emp.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{emp.nombre}</p>
                          <p className="text-sm text-gray-500">
                            {emp.cargo && `${emp.cargo} · `}Salario: {formatCOP(emp.salario)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {confirmDeleteId === emp.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEliminarEmpleado(emp.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1 border border-gray-300 text-gray-600 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(emp.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Eliminar empleado"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Add Individual Employee Form */}
          {mostrarFormEmpleado && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-base font-semibold text-gray-900">
                  Nuevo Empleado Individual
                </h4>
                <button
                  onClick={() => {
                    setMostrarFormEmpleado(false)
                    resetEmpleadoForm()
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Cerrar formulario"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={empNombre}
                    onChange={(e) => setEmpNombre(e.target.value)}
                    placeholder="Nombre del empleado"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {esNuevosBeneficios ? 'Salario actual' : 'Salario'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      value={empSalario}
                      onChange={(e) => setEmpSalario(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Salario mensual"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={empCargo}
                    onChange={(e) => setEmpCargo(e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cedula
                  </label>
                  <input
                    type="text"
                    value={empCedula}
                    onChange={(e) => setEmpCedula(e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red text-sm"
                  />
                </div>
              </div>

              {/* ARL Risk Level per employee */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de Riesgo ARL
                </label>
                <ARLRiskSelector value={empArl} onChange={setEmpArl} compact />
              </div>

              {/* Salary minimum warning */}
              {salarioError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-xs text-red-700">{salarioError}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setMostrarFormEmpleado(false)
                    resetEmpleadoForm()
                    setSalarioError(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAgregarEmpleado}
                  disabled={!empNombre.trim() || !empSalario}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                    empNombre.trim() && empSalario
                      ? 'bg-tikin-red text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Agregar Empleado
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SUMMARY BAR */}
      {/* ============================================================ */}
      {tieneData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
            Resumen de Datos Cargados
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Total Empleados</p>
              <p className="text-2xl font-bold text-gray-900">{totalEmpleados}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Nomina</p>
              <p className="text-2xl font-bold text-gray-900">{formatCOP(totalSalariosGlobal)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lotes</p>
              <p className="text-2xl font-bold text-gray-900">{lotes.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* NAVIGATION BUTTONS */}
      {/* ============================================================ */}
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
          disabled={!tieneData}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            tieneData
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

// ============================================================
// LOTE CARD SUBCOMPONENT
// ============================================================

interface LoteCardProps {
  lote: LoteBonos2
  confirmDeleteId: string | null
  onRequestDelete: (id: string) => void
  onConfirmDelete: (id: string) => void
  onCancelDelete: () => void
}

function LoteCard({
  lote,
  confirmDeleteId,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete
}: LoteCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-tikin-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{lote.nombre}</h4>
            <p className="text-sm text-gray-500">
              {lote.cantidad} {lote.cantidad === 1 ? 'empleado' : 'empleados'} &middot; {formatCOP(lote.salarioPorEmpleado)}/empleado
            </p>
          </div>
        </div>

        {/* Delete button / confirmation */}
        {confirmDeleteId === lote.id ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onConfirmDelete(lote.id)}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
            <button
              onClick={onCancelDelete}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => onRequestDelete(lote.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            aria-label={`Eliminar lote ${lote.nombre}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Single metric: Total Nomina */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
        <div>
          <p className="text-xs text-gray-500">Total Nomina</p>
          <p className="text-sm font-semibold text-gray-900">{formatCOP(lote.totalSalarios)}</p>
        </div>
        {lote.arlRiskLevel && (
          <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700">
            ARL Nivel {lote.arlRiskLevel}
          </span>
        )}
      </div>
    </div>
  )
}
