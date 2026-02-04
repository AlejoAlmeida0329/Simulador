'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { formatCOP } from '@/lib/formatters'
import { LIMITE_ALIMENTACION_MENSUAL } from '@/types/bonuses'
import { downloadFoodBonusTemplate } from '@/lib/excel/foodBonusTemplate'
import { parseFoodBonusExcel, validateFoodBonusExcelFile } from '@/lib/excel/foodBonusParser'

const MAX_BONUS_PERCENTAGE = 40 // Bonos no pueden superar 40% del salario
const MIN_SALARY = 2450000 // Salario mínimo legal 2024

export interface FoodBonusEmployee {
  id: string
  cantidad: number
  salarioPorEmpleado: number
  montoPorEmpleado: number
}

interface FoodBonusLoaderProps {
  onContinue: (employees: FoodBonusEmployee[]) => void
  onBack: () => void
  initialEmployees?: FoodBonusEmployee[]
}

export function FoodBonusLoader({ onContinue, onBack, initialEmployees = [] }: FoodBonusLoaderProps) {
  const [employees, setEmployees] = useState<FoodBonusEmployee[]>(initialEmployees)
  const [cantidad, setCantidad] = useState<string>('')
  const [salarioPorEmpleado, setSalarioPorEmpleado] = useState<string>('')
  const [montoPorEmpleado, setMontoPorEmpleado] = useState<string>('')

  // Estados para carga de archivo Excel
  const [fileError, setFileError] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const totalEmpleados = employees.reduce((sum, emp) => sum + emp.cantidad, 0)
  const totalNomina = employees.reduce((sum, emp) => sum + (emp.cantidad * emp.salarioPorEmpleado), 0)
  const totalMontoDispersado = employees.reduce((sum, emp) => sum + (emp.cantidad * emp.montoPorEmpleado), 0)

  // Validación en tiempo real para el formulario actual
  const salarioNum = parseFloat(salarioPorEmpleado)
  const montoNum = parseFloat(montoPorEmpleado)
  const porcentajeBono = salarioNum > 0 ? (montoNum / salarioNum) * 100 : 0
  const excede40Percent = porcentajeBono > MAX_BONUS_PERCENTAGE
  const excedeUVT = montoNum > LIMITE_ALIMENTACION_MENSUAL
  const salarioBajoMinimo = salarioNum > 0 && salarioNum < MIN_SALARY

  const handleAddBatch = () => {
    const cantidadNum = parseInt(cantidad)
    const salarioNum = parseFloat(salarioPorEmpleado)
    const montoNum = parseFloat(montoPorEmpleado)

    if (!cantidadNum || cantidadNum <= 0) {
      alert('Ingresa una cantidad válida de empleados')
      return
    }

    if (!salarioNum || salarioNum <= 0) {
      alert('Ingresa un salario válido por empleado')
      return
    }

    if (salarioNum < MIN_SALARY) {
      alert(`❌ El salario no puede ser inferior al salario mínimo legal de ${formatCOP(MIN_SALARY)}`)
      return
    }

    if (!montoNum || montoNum <= 0) {
      alert('Ingresa un monto válido de bono de alimentación')
      return
    }

    const porcentajeBono = (montoNum / salarioNum) * 100

    if (porcentajeBono > MAX_BONUS_PERCENTAGE) {
      alert(`⚠️ El bono (${porcentajeBono.toFixed(1)}%) excede el límite legal del ${MAX_BONUS_PERCENTAGE}% del salario.\n\nPuedes agregarlo, pero se mostrará como exceso en el resumen.`)
    }

    if (montoNum > LIMITE_ALIMENTACION_MENSUAL) {
      alert(`⚠️ El monto excede el límite legal de ${formatCOP(LIMITE_ALIMENTACION_MENSUAL)} (41 UVT).\n\nPuedes agregarlo, pero se mostrará como exceso en el resumen.`)
    }

    const newBatch: FoodBonusEmployee = {
      id: uuidv4(),
      cantidad: cantidadNum,
      salarioPorEmpleado: salarioNum,
      montoPorEmpleado: montoNum
    }

    setEmployees([...employees, newBatch])
    setCantidad('')
    setSalarioPorEmpleado('')
    setMontoPorEmpleado('')
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
    const validation = validateFoodBonusExcelFile(file)
    if (!validation.valid) {
      setFileError(validation.error!)
      setUploading(false)
      e.target.value = ''
      return
    }

    // Parsear archivo
    const result = await parseFoodBonusExcel(file)

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

  const getBatchValidation = (emp: FoodBonusEmployee) => {
    const porcentajeBono = (emp.montoPorEmpleado / emp.salarioPorEmpleado) * 100
    const excede40 = porcentajeBono > MAX_BONUS_PERCENTAGE
    const excedeUVT = emp.montoPorEmpleado > LIMITE_ALIMENTACION_MENSUAL
    const salarioBajoMinimo = emp.salarioPorEmpleado < MIN_SALARY
    return { porcentajeBono, excede40, excedeUVT, salarioBajoMinimo }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Bonos de Alimentación
        </h2>
        <p className="text-gray-600">
          Agrega los empleados con sus salarios y define el monto del bono de alimentación
        </p>
        <div className="mt-4 flex flex-col gap-2 items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-800">
              <strong>Límite porcentual:</strong> Bonos ≤ {MAX_BONUS_PERCENTAGE}% del salario
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-800">
              <strong>Límite monto:</strong> {formatCOP(LIMITE_ALIMENTACION_MENSUAL)} por empleado/mes (41 UVT)
            </span>
          </div>
        </div>
      </div>

      {/* Carga de archivo Excel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
              onClick={downloadFoodBonusTemplate}
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
              id="food-bonus-file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <label
              htmlFor="food-bonus-file-upload"
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Agregar Lote de Empleados
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            {salarioBajoMinimo && (
              <p className="text-xs text-red-600 mt-1">
                ❌ Mínimo: {formatCOP(MIN_SALARY)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto bono alimentación
            </label>
            <input
              type="number"
              min="0"
              step="50000"
              value={montoPorEmpleado}
              onChange={(e) => setMontoPorEmpleado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-transparent"
              placeholder={formatCOP(500000)}
            />
            {excedeUVT && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Excede {formatCOP(LIMITE_ALIMENTACION_MENSUAL)}
              </p>
            )}
          </div>
        </div>

        {/* Indicador de porcentaje */}
        {salarioNum > 0 && montoNum >= 0 && (
          <div className={`p-4 rounded-lg mb-4 ${excede40Percent ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Porcentaje del salario:</span>
              <span className={`text-lg font-bold ${excede40Percent ? 'text-orange-900' : 'text-green-900'}`}>
                {porcentajeBono.toFixed(1)}% / {MAX_BONUS_PERCENTAGE}%
              </span>
            </div>
            {excede40Percent && (
              <p className="text-xs text-orange-800 mt-2">
                ⚠️ Excede el límite legal del {MAX_BONUS_PERCENTAGE}%
              </p>
            )}
          </div>
        )}

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
                    Monto/Emp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    % Salario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Lote
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
                    <tr key={emp.id} className={validation.salarioBajoMinimo ? 'bg-red-50' : (validation.excede40 || validation.excedeUVT ? 'bg-orange-50' : '')}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {emp.cantidad} empleado{emp.cantidad > 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCOP(emp.salarioPorEmpleado)}
                        {validation.salarioBajoMinimo && <span className="ml-1 text-red-600">❌</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCOP(emp.montoPorEmpleado)}
                        {validation.excedeUVT && <span className="ml-1 text-orange-600">⚠️</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {validation.porcentajeBono.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCOP(emp.cantidad * emp.montoPorEmpleado)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {validation.salarioBajoMinimo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            ❌ Bajo mínimo
                          </span>
                        ) : validation.excede40 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            ⚠️ Excede 40%
                          </span>
                        ) : validation.excedeUVT ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            ⚠️ Excede UVT
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
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-green-700 mb-1">Total empleados</p>
              <p className="text-2xl font-bold text-green-900">{totalEmpleados}</p>
            </div>
            <div>
              <p className="text-sm text-green-700 mb-1">Nómina total</p>
              <p className="text-2xl font-bold text-green-900">{formatCOP(totalNomina)}</p>
            </div>
            <div>
              <p className="text-sm text-green-700 mb-1">Bonos a dispersar</p>
              <p className="text-2xl font-bold text-green-900">{formatCOP(totalMontoDispersado)}</p>
            </div>
          </div>

          {employees.some(emp => {
            const val = getBatchValidation(emp)
            return val.salarioBajoMinimo
          }) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-sm text-red-900">
                <strong>❌ Error crítico:</strong> Algunos lotes tienen salarios por debajo del mínimo legal ({formatCOP(MIN_SALARY)}).
                Debes eliminarlos o ajustar el salario antes de continuar.
              </p>
            </div>
          )}

          {employees.some(emp => {
            const val = getBatchValidation(emp)
            return val.excede40 || val.excedeUVT
          }) && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>⚠️ Advertencia:</strong> Algunos lotes exceden los límites legales (40% del salario o 41 UVT).
                Los excesos no estarán exentos de parafiscales.
              </p>
            </div>
          )}
        </div>
      )}

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
          disabled={employees.length === 0 || employees.some(emp => getBatchValidation(emp).salarioBajoMinimo)}
          className="flex-1 px-6 py-3 bg-tikin-red text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}
