'use client'

import { useState } from 'react'
import { Employee, EmployeeBatch } from '@/types/bonuses'
import { formatCOP } from '@/lib/formatters'
import { v4 as uuidv4 } from 'uuid'
import { downloadEmployeeTemplate } from '@/lib/excel/template'
import { parseEmployeeExcel, validateExcelFile } from '@/lib/excel/parser'

interface EmployeeLoaderProps {
  empleados: Employee[]
  lotes: EmployeeBatch[]
  onEmpleadosChange: (empleados: Employee[], lotes: EmployeeBatch[]) => void
  onContinue: () => void
  onBack: () => void
}

export function EmployeeLoader({
  empleados,
  lotes,
  onEmpleadosChange,
  onContinue,
  onBack
}: EmployeeLoaderProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'archivo'>('manual')

  // Manual batch state
  const [cantidad, setCantidad] = useState<string>('')
  const [salarioPorEmpleado, setSalarioPorEmpleado] = useState<string>('')
  const [batchError, setBatchError] = useState<string>('')

  // File upload state
  const [fileError, setFileError] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const MIN_SALARY = 2450000

  const totalEmpleados = empleados.length

  const handleAddBatch = () => {
    setBatchError('')

    const cantidadNum = parseInt(cantidad)
    const salarioNum = parseInt(salarioPorEmpleado)

    // Validations
    if (!cantidad || cantidadNum < 1) {
      setBatchError('Ingresa una cantidad válida (mínimo 1)')
      return
    }

    if (!salarioPorEmpleado || salarioNum < MIN_SALARY) {
      setBatchError(`El salario mínimo es ${formatCOP(MIN_SALARY)}`)
      return
    }

    // Create batch
    const batchId = uuidv4()
    const nuevosEmpleados: Employee[] = []

    for (let i = 1; i <= cantidadNum; i++) {
      nuevosEmpleados.push({
        id: uuidv4(),
        nombre: `Empleado ${totalEmpleados + i}`,
        salario: salarioNum,
        origen: 'manual',
        loteId: batchId
      })
    }

    const nuevoBatch: EmployeeBatch = {
      id: batchId,
      cantidad: cantidadNum,
      salarioPorEmpleado: salarioNum,
      empleados: nuevosEmpleados,
      expandido: false
    }

    onEmpleadosChange([...empleados, ...nuevosEmpleados], [...lotes, nuevoBatch])

    // Clear form
    setCantidad('')
    setSalarioPorEmpleado('')
  }

  const handleDeleteBatch = (batchId: string) => {
    const nuevosLotes = lotes.filter(l => l.id !== batchId)
    const nuevosEmpleados = empleados.filter(e => e.loteId !== batchId)
    onEmpleadosChange(nuevosEmpleados, nuevosLotes)
  }

  const handleToggleBatch = (batchId: string) => {
    const nuevosLotes = lotes.map(l =>
      l.id === batchId ? { ...l, expandido: !l.expandido } : l
    )
    onEmpleadosChange(empleados, nuevosLotes)
  }

  const handleDeleteEmpleado = (empleadoId: string) => {
    const empleado = empleados.find(e => e.id === empleadoId)
    if (!empleado) return

    // If from a batch, update batch
    if (empleado.loteId) {
      const batch = lotes.find(l => l.id === empleado.loteId)
      if (batch && batch.cantidad === 1) {
        // Delete entire batch if only one employee
        handleDeleteBatch(empleado.loteId)
        return
      }

      // Update batch
      const nuevosLotes = lotes.map(l => {
        if (l.id === empleado.loteId) {
          return {
            ...l,
            cantidad: l.cantidad - 1,
            empleados: l.empleados.filter(e => e.id !== empleadoId)
          }
        }
        return l
      })

      const nuevosEmpleados = empleados.filter(e => e.id !== empleadoId)
      onEmpleadosChange(nuevosEmpleados, nuevosLotes)
    } else {
      // Delete individual employee
      const nuevosEmpleados = empleados.filter(e => e.id !== empleadoId)
      onEmpleadosChange(nuevosEmpleados, lotes)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError('')
    setUploadSuccess(false)
    setUploading(true)

    // Validar archivo
    const validation = validateExcelFile(file)
    if (!validation.valid) {
      setFileError(validation.error!)
      setUploading(false)
      e.target.value = '' // Reset input
      return
    }

    // Parsear archivo
    const result = await parseEmployeeExcel(file)

    if (!result.success || !result.employees) {
      setFileError(result.errors?.join(', ') || 'Error al procesar el archivo')
      setUploading(false)
      e.target.value = '' // Reset input
      return
    }

    // Agregar empleados al estado
    onEmpleadosChange([...empleados, ...result.employees], lotes)
    setUploadSuccess(true)
    setUploading(false)

    // Reset input
    e.target.value = ''

    // Clear success message after 3 seconds
    setTimeout(() => setUploadSuccess(false), 3000)
  }

  const canContinue = totalEmpleados > 0

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Agregar Empleados
        </h2>
        <p className="text-gray-600">
          Agrega empleados manualmente por lotes o carga un archivo Excel/CSV.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-tikin-red text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          📝 Manual por Lotes
        </button>
        <button
          onClick={() => setActiveTab('archivo')}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'archivo'
              ? 'bg-tikin-red text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          📄 Cargar Archivo
        </button>
      </div>

      {/* Manual Tab */}
      {activeTab === 'manual' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Agregar Lote de Empleados
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad de Empleados
              </label>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-transparent"
                placeholder="Ej: 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salario por Empleado
              </label>
              <input
                type="number"
                min={MIN_SALARY}
                step="1000"
                value={salarioPorEmpleado}
                onChange={(e) => setSalarioPorEmpleado(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-transparent"
                placeholder={`Ej: ${MIN_SALARY}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo: {formatCOP(MIN_SALARY)}
              </p>
            </div>
          </div>

          {batchError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{batchError}</p>
            </div>
          )}

          <button
            onClick={handleAddBatch}
            className="w-full px-6 py-3 bg-tikin-red text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
          >
            + Agregar Lote
          </button>
        </div>
      )}

      {/* File Upload Tab */}
      {activeTab === 'archivo' && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">📁</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cargar Archivo de Empleados
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Descarga la plantilla, llénala con tu información y súbela aquí
            </p>

            {/* Download Template Button */}
            <div className="mb-6">
              <button
                onClick={downloadEmployeeTemplate}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar Plantilla Excel
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Plantilla con formato e instrucciones incluidas
              </p>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className={`inline-block px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                  uploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-tikin-red text-white hover:bg-red-700'
                }`}
              >
                {uploading ? 'Procesando...' : 'Subir Archivo Completado'}
              </label>
            </div>

            {/* Success Message */}
            {uploadSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">
                  ✓ Archivo cargado exitosamente
                </p>
              </div>
            )}

            {/* Error Message */}
            {fileError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{fileError}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-3">
                <strong>Instrucciones:</strong>
              </p>
              <ol className="text-xs text-left text-gray-600 space-y-2 max-w-md mx-auto">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Descarga la plantilla Excel haciendo clic en el botón verde</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Abre el archivo y lee las instrucciones en la primera hoja</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>Completa la información de tus empleados en la hoja "Empleados"</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>Guarda el archivo y súbelo usando el botón "Subir Archivo Completado"</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Employee List */}
      {(lotes.length > 0 || empleados.some(e => !e.loteId)) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Empleados Agregados
            </h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {totalEmpleados} empleado{totalEmpleados !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {/* Batches */}
            {lotes.map((lote) => (
              <div key={lote.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => handleToggleBatch(lote.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {lote.expandido ? '▼' : '▶'}
                    </button>
                    <div>
                      <p className="font-medium text-gray-900">
                        Lote de {lote.cantidad} empleado{lote.cantidad !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        Salario: {formatCOP(lote.salarioPorEmpleado)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBatch(lote.id)}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>

                {lote.expandido && (
                  <div className="p-4 space-y-2 bg-white">
                    {lote.empleados.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-700">{emp.nombre}</span>
                        <span className="text-sm text-gray-600">{formatCOP(emp.salario)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Individual employees from file */}
            {empleados.filter(e => !e.loteId).map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{emp.nombre}</p>
                  <p className="text-sm text-gray-600">{formatCOP(emp.salario)}</p>
                </div>
                <button
                  onClick={() => handleDeleteEmpleado(emp.id)}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          ← Volver
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
            canContinue
              ? 'bg-tikin-red text-white hover:bg-red-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continuar →
        </button>
      </div>

      {!canContinue && (
        <p className="text-center text-sm text-gray-600 mt-3">
          Agrega al menos un empleado para continuar
        </p>
      )}
    </div>
  )
}
