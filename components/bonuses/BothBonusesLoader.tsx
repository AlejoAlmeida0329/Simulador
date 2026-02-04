'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { formatCOP } from '@/lib/formatters'
import { LIMITE_ALIMENTACION_MENSUAL } from '@/types/bonuses'
import { downloadBothBonusesTemplate } from '@/lib/excel/bothBonusesTemplate'
import { parseBothBonusesExcel, validateBothBonusesExcelFile } from '@/lib/excel/bothBonusesParser'

const MAX_TOTAL_BONUS_PERCENTAGE = 40 // ML + AL no puede superar 40% del salario

export interface BothBonusesEmployee {
  id: string
  cantidad: number
  salarioPorEmpleado: number
  porcentajeML: number  // 0-40
  montoAL: number
}

interface BothBonusesLoaderProps {
  onContinue: (employees: BothBonusesEmployee[]) => void
  onBack: () => void
  initialEmployees?: BothBonusesEmployee[]
}

export function BothBonusesLoader({ onContinue, onBack, initialEmployees = [] }: BothBonusesLoaderProps) {
  const [employees, setEmployees] = useState<BothBonusesEmployee[]>(initialEmployees)
  const [cantidad, setCantidad] = useState<string>('')
  const [salarioPorEmpleado, setSalarioPorEmpleado] = useState<string>('')
  const [porcentajeML, setPorcentajeML] = useState<number>(25)
  const [montoAL, setMontoAL] = useState<string>('')

  // Estados para carga de archivo Excel
  const [fileError, setFileError] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const totalEmpleados = employees.reduce((sum, emp) => sum + emp.cantidad, 0)
  const totalNomina = employees.reduce((sum, emp) => sum + (emp.cantidad * emp.salarioPorEmpleado), 0)
  const totalBonosML = employees.reduce((sum, emp) => sum + (emp.cantidad * emp.salarioPorEmpleado * emp.porcentajeML / 100), 0)
  const totalBonosAL = employees.reduce((sum, emp) => sum + (emp.cantidad * emp.montoAL), 0)

  // Validación en tiempo real para el formulario actual
  const salarioNum = parseFloat(salarioPorEmpleado)
  const montoALNum = parseFloat(montoAL)
  const montoMLCalculado = salarioNum * (porcentajeML / 100)
  const porcentajeTotal = salarioNum > 0 ? ((montoMLCalculado + montoALNum) / salarioNum) * 100 : 0
  const excede40Percent = porcentajeTotal > MAX_TOTAL_BONUS_PERCENTAGE
  const excedeUVT = montoALNum > LIMITE_ALIMENTACION_MENSUAL

  const handleAddBatch = () => {
    const cantidadNum = parseInt(cantidad)
    const salarioNum = parseFloat(salarioPorEmpleado)
    const montoALNum = parseFloat(montoAL)

    if (!cantidadNum || cantidadNum <= 0) {
      alert('Ingresa una cantidad válida de empleados')
      return
    }

    if (!salarioNum || salarioNum <= 0) {
      alert('Ingresa un salario válido por empleado')
      return
    }

    if (porcentajeML < 0 || porcentajeML > MAX_TOTAL_BONUS_PERCENTAGE) {
      alert(`El porcentaje de ML debe estar entre 0% y ${MAX_TOTAL_BONUS_PERCENTAGE}%`)
      return
    }

    if (!montoALNum || montoALNum < 0) {
      alert('Ingresa un monto válido de alimentación (puede ser 0)')
      return
    }

    const montoML = salarioNum * (porcentajeML / 100)
    const porcentajeTotal = ((montoML + montoALNum) / salarioNum) * 100

    if (porcentajeTotal > MAX_TOTAL_BONUS_PERCENTAGE) {
      alert(`⚠️ Los bonos totales (${porcentajeTotal.toFixed(1)}%) exceden el límite legal del ${MAX_TOTAL_BONUS_PERCENTAGE}%.\n\nPuedes agregarlo, pero se mostrará como exceso en el resumen.`)
    }

    if (montoALNum > LIMITE_ALIMENTACION_MENSUAL) {
      alert(`⚠️ El bono de alimentación excede el límite legal de ${formatCOP(LIMITE_ALIMENTACION_MENSUAL)} (41 UVT).\n\nPuedes agregarlo, pero se mostrará como exceso en el resumen.`)
    }

    const newBatch: BothBonusesEmployee = {
      id: uuidv4(),
      cantidad: cantidadNum,
      salarioPorEmpleado: salarioNum,
      porcentajeML: porcentajeML,
      montoAL: montoALNum
    }

    setEmployees([...employees, newBatch])
    setCantidad('')
    setSalarioPorEmpleado('')
    setPorcentajeML(25)
    setMontoAL('')
  }

  const handleRemoveBatch = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id))
  }

  const handleContinue = () => {
    if (employees.length === 0) {
      alert('Debes agregar al menos un lote de empleados')
      return
    }
    onContinue(employees)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError('')
    setUploadSuccess(false)
    setUploading(true)

    // Validar archivo
    const validation = validateBothBonusesExcelFile(file)
    if (!validation.valid) {
      setFileError(validation.error!)
      setUploading(false)
      e.target.value = ''
      return
    }

    // Parsear archivo
    const result = await parseBothBonusesExcel(file)

    if (!result.success || !result.batches) {
      setFileError(result.errors?.join(', ') || 'Error al procesar el archivo')
      setUploading(false)
      e.target.value = ''
      return
    }

    // Agregar lotes parseados
    setEmployees([...employees, ...result.batches])
    setUploadSuccess(true)
    setUploading(false)
    e.target.value = ''

    // Limpiar mensaje de éxito después de 3 segundos
    setTimeout(() => setUploadSuccess(false), 3000)
  }

  const getBatchValidation = (emp: BothBonusesEmployee) => {
    const montoML = emp.salarioPorEmpleado * (emp.porcentajeML / 100)
    const porcentajeTotal = ((montoML + emp.montoAL) / emp.salarioPorEmpleado) * 100
    const excedeTotal = porcentajeTotal > MAX_TOTAL_BONUS_PERCENTAGE
    const excedeUVT = emp.montoAL > LIMITE_ALIMENTACION_MENSUAL

    return { porcentajeTotal, excedeTotal, excedeUVT }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Bonos de Mera Liberalidad + Alimentación
        </h2>
        <p className="text-gray-600">
          Agrega empleados con sus salarios y define ambos tipos de bonos
        </p>
        <div className="mt-4 flex flex-col gap-2 items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-800">
              <strong>Límite total:</strong> ML + AL ≤ 40% del salario
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-800">
              <strong>Límite AL:</strong> {formatCOP(LIMITE_ALIMENTACION_MENSUAL)} por empleado/mes (41 UVT)
            </span>
          </div>
        </div>
      </div>

      {/* Layout de 2 columnas: Formulario + Cálculos en vivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Columna izquierda: Formulario (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carga de archivo Excel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Carga Masiva de Lotes
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Descarga la plantilla Excel, complétala con tus lotes de empleados y súbela aquí
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Botón de descarga */}
              <div>
                <button
                  onClick={downloadBothBonusesTemplate}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar Plantilla Excel
                </button>
              </div>

              {/* Botón de subida */}
              <div>
                <input
                  id="both-bonuses-file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="both-bonuses-file-upload"
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 ${
                    uploading
                      ? 'bg-gray-400 cursor-wait'
                      : 'bg-tikin-red hover:bg-red-700 cursor-pointer'
                  } text-white rounded-lg font-medium transition-colors`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {uploading ? 'Procesando...' : 'Subir Archivo Completado'}
                </label>
              </div>
            </div>

            {/* Mensaje de error */}
            {fileError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">Error al procesar el archivo</p>
                    <p className="text-sm text-red-700 mt-1">{fileError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje de éxito */}
            {uploadSuccess && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">Archivo procesado exitosamente</p>
                    <p className="text-sm text-green-700 mt-1">Los lotes se han agregado a la lista</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Formulario para agregar lotes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agregar Lote de Empleados
            </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad de empleados
            </label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-transparent"
              placeholder="Ej: 10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salario por empleado
            </label>
            <input
              type="number"
              min="0"
              step="100000"
              value={salarioPorEmpleado}
              onChange={(e) => setSalarioPorEmpleado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-transparent"
              placeholder={formatCOP(3000000)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              % Bono Mera Liberalidad
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={MAX_TOTAL_BONUS_PERCENTAGE}
                step="1"
                value={porcentajeML}
                onChange={(e) => setPorcentajeML(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">0%</span>
                <span className="font-semibold text-blue-900">{porcentajeML}%</span>
                <span className="text-gray-600">40%</span>
              </div>
              {salarioNum > 0 && (
                <p className="text-sm text-gray-600">
                  Monto ML: {formatCOP(salarioNum * (porcentajeML / 100))}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Bono Alimentación
            </label>
            <input
              type="number"
              min="0"
              step="50000"
              value={montoAL}
              onChange={(e) => setMontoAL(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-transparent"
              placeholder={formatCOP(500000)}
            />
            {excedeUVT && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Excede el límite de {formatCOP(LIMITE_ALIMENTACION_MENSUAL)}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleAddBatch}
          className="w-full px-6 py-3 bg-tikin-red text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
        >
          + Agregar Lote
        </button>
          </div>

      {/* Tabla de empleados agregados */}
      {employees.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Lotes Agregados
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Salario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    % ML
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Monto AL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total %
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map((emp) => {
                  const validation = getBatchValidation(emp)
                  return (
                    <tr key={emp.id} className={validation.excedeTotal ? 'bg-orange-50' : ''}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {emp.cantidad} empleado{emp.cantidad > 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCOP(emp.salarioPorEmpleado)}
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-900 font-medium">
                        {emp.porcentajeML}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCOP(emp.montoAL)}
                        {validation.excedeUVT && <span className="ml-1 text-orange-600">⚠️</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {validation.porcentajeTotal.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {validation.excedeTotal ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            ⚠️ Excede 40%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            ✓ Válido
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <button
                          onClick={() => handleRemoveBatch(emp.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumen */}
      {employees.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-purple-700 mb-1">Total empleados</p>
              <p className="text-2xl font-bold text-purple-900">{totalEmpleados}</p>
            </div>
            <div>
              <p className="text-sm text-purple-700 mb-1">Nómina total</p>
              <p className="text-2xl font-bold text-purple-900">{formatCOP(totalNomina)}</p>
            </div>
            <div>
              <p className="text-sm text-purple-700 mb-1">Bonos ML</p>
              <p className="text-2xl font-bold text-purple-900">{formatCOP(totalBonosML)}</p>
            </div>
            <div>
              <p className="text-sm text-purple-700 mb-1">Bonos AL</p>
              <p className="text-2xl font-bold text-purple-900">{formatCOP(totalBonosAL)}</p>
            </div>
          </div>

          {employees.some(emp => getBatchValidation(emp).excedeTotal) && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>⚠️ Advertencia:</strong> Algunos lotes exceden el límite legal del 40%.
                Los excesos no estarán exentos de parafiscales.
              </p>
            </div>
          )}
        </div>
      )}
        </div>

        {/* Columna derecha: Cálculo en Vivo (1/3) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">Cálculo en Vivo</h3>
            </div>

            {salarioNum > 0 ? (
              <div className="space-y-4">
                {/* Breakdown por empleado */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-3">Por Empleado:</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Salario:</span>
                      <span className="font-semibold text-gray-900">{formatCOP(salarioNum)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-blue-600">Bono ML ({porcentajeML}%):</span>
                      <span className="font-semibold text-blue-900">{formatCOP(montoMLCalculado)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-green-600">Bono AL:</span>
                      <span className="font-semibold text-green-900">{formatCOP(montoALNum || 0)}</span>
                    </div>

                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Total Bonos:</span>
                        <span className="font-bold text-lg text-gray-900">{formatCOP(montoMLCalculado + (montoALNum || 0))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Indicador de porcentaje con barra visual */}
                <div className={`rounded-lg p-4 border-2 ${excede40Percent ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-300'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Porcentaje Total:</span>
                    <span className={`text-2xl font-bold ${excede40Percent ? 'text-orange-600' : 'text-green-600'}`}>
                      {porcentajeTotal.toFixed(1)}%
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${excede40Percent ? 'bg-orange-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(porcentajeTotal, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-700">
                        {porcentajeTotal.toFixed(1)}% / 40%
                      </span>
                    </div>
                  </div>

                  {excede40Percent ? (
                    <div className="mt-3 flex items-start gap-2">
                      <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs text-orange-800">
                        <strong>Excede el límite legal.</strong> Los excesos no están exentos de parafiscales.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-green-800">
                        <strong>Dentro del límite legal.</strong> Bonos exentos de parafiscales.
                      </p>
                    </div>
                  )}

                  {excedeUVT && (
                    <div className="mt-2 flex items-start gap-2 pt-2 border-t border-orange-200">
                      <svg className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs text-orange-800">
                        Bono AL excede 41 UVT ({formatCOP(LIMITE_ALIMENTACION_MENSUAL)})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">
                  Ingresa los datos para ver el cálculo en tiempo real
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          ← Volver
        </button>
        <button
          onClick={handleContinue}
          disabled={employees.length === 0}
          className="flex-1 px-6 py-3 bg-tikin-red text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}
