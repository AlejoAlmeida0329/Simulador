'use client'

import { useState, useRef, useCallback } from 'react'
import type { ExcelFlowConfig, ExcelParseResult, ParsedExcelEmployee } from '@/lib/bonos/excel-parser'
import { parseExcelFile } from '@/lib/bonos/excel-parser'

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value)

type UploadState = 'empty' | 'loading' | 'error' | 'preview'

interface ExcelUploadSectionProps {
  flowConfig: ExcelFlowConfig
  onDataConfirmed: (employees: ParsedExcelEmployee[]) => void
  onClear: () => void
  downloadTemplate: () => Promise<void>
  templateName: string
}

export function ExcelUploadSection({
  flowConfig,
  onDataConfirmed,
  onClear,
  downloadTemplate,
  templateName
}: ExcelUploadSectionProps) {
  const [state, setState] = useState<UploadState>('empty')
  const [result, setResult] = useState<ExcelParseResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setState('loading')
    setErrorMessage('')
    setResult(null)
    setConfirmed(false)

    try {
      const parseResult = await parseExcelFile(file, flowConfig)

      if (!parseResult.success) {
        setState('error')
        setErrorMessage(parseResult.errorMessage || 'Error al procesar el archivo')
        return
      }

      setResult(parseResult)
      setState('preview')
    } catch {
      setState('error')
      setErrorMessage('Error inesperado al leer el archivo')
    }
  }, [flowConfig])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleReset = () => {
    setState('empty')
    setResult(null)
    setErrorMessage('')
    setConfirmed(false)
    onClear()
  }

  const handleConfirm = () => {
    if (!result) return
    setConfirmed(true)
    onDataConfirmed(result.parsedEmployees)
  }

  const handleRemoveEmployee = (rowIndex: number) => {
    if (!result) return
    const updated = {
      ...result,
      parsedEmployees: result.parsedEmployees.filter(e => e.rowIndex !== rowIndex),
      validRows: result.validRows - 1
    }
    updated.success = updated.parsedEmployees.length > 0
    setResult(updated)
  }

  // ---- EMPTY STATE ----
  if (state === 'empty') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-tikin-red/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-tikin-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Arrastra tu archivo Excel aqui
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            o haz clic para seleccionar un archivo .xlsx o .xls
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            className="px-5 py-2.5 bg-tikin-red text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Seleccionar Archivo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        <div className="mt-4 flex items-center justify-center">
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault()
              await downloadTemplate()
            }}
            className="text-sm text-tikin-red hover:text-red-700 font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar plantilla ({templateName})
          </button>
        </div>
      </div>
    )
  }

  // ---- LOADING STATE ----
  if (state === 'loading') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-tikin-red/30 border-t-tikin-red rounded-full animate-spin mx-auto mb-4" role="status">
            <span className="sr-only">Procesando archivo...</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Procesando archivo...</h3>
          <p className="text-sm text-gray-500">Leyendo y validando los datos del Excel</p>
        </div>
      </div>
    )
  }

  // ---- ERROR STATE ----
  if (state === 'error') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error al procesar el archivo
          </h3>
          <p className="text-sm text-red-600 mb-6 max-w-md mx-auto">
            {errorMessage}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 bg-tikin-red text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
            >
              Intentar con otro archivo
            </button>
            <button
              type="button"
              onClick={async () => await downloadTemplate()}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Descargar plantilla
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- PREVIEW STATE ----
  if (state === 'preview' && result) {
    const warnings = result.errors.filter(e => e.severity === 'warning')
    const salaryField = flowConfig.salaryField

    return (
      <div className="space-y-4">
        {/* Summary bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500">Archivo</p>
                <p className="text-sm font-medium text-gray-900">{result.fileName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Filas validas</p>
                <p className="text-sm font-semibold text-green-600">{result.validRows}</p>
              </div>
              {result.errorRows > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Filas con error</p>
                  <p className="text-sm font-semibold text-red-600">{result.errorRows}</p>
                </div>
              )}
              {warnings.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Advertencias</p>
                  <p className="text-sm font-semibold text-amber-600">{warnings.length}</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors"
            >
              Cambiar archivo
            </button>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex gap-2">
              <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-xs text-amber-800">
                <p className="font-medium mb-1">Advertencias ({warnings.length})</p>
                {warnings.slice(0, 5).map((w, i) => (
                  <p key={i}>Fila {w.row}: {w.message}</p>
                ))}
                {warnings.length > 5 && <p>...y {warnings.length - 5} mas</p>}
              </div>
            </div>
          </div>
        )}

        {/* Data table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {salaryField === 'salarioActual' ? 'Salario Actual' : 'Salario'}
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Cargo</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">ARL</th>
                  {!confirmed && (
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide w-12"></th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.parsedEmployees.map(emp => {
                  const salary = salaryField === 'salarioActual' ? emp.salarioActual : emp.salario
                  return (
                    <tr key={emp.rowIndex} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{emp.nombre}</td>
                      <td className="px-4 py-2 text-right text-gray-900 font-medium tabular-nums">
                        {salary ? formatCOP(salary) : '-'}
                      </td>
                      <td className="px-4 py-2 text-gray-500">{emp.cargo || '-'}</td>
                      <td className="px-4 py-2 text-center text-gray-500">{emp.arl || '-'}</td>
                      {!confirmed && (
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveEmployee(emp.rowIndex)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label={`Eliminar ${emp.nombre}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unmapped columns info */}
        {result.unmappedHeaders.length > 0 && (
          <p className="text-xs text-gray-400">
            Columnas ignoradas: {result.unmappedHeaders.join(', ')}
          </p>
        )}

        {/* Confirm button */}
        {!confirmed ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={result.parsedEmployees.length === 0}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                result.parsedEmployees.length > 0
                  ? 'bg-tikin-red text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Confirmar {result.parsedEmployees.length} empleados
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-800 font-medium">
              {result.parsedEmployees.length} empleados cargados desde Excel
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="ml-auto text-sm text-green-700 hover:text-red-600 font-medium transition-colors"
            >
              Cambiar archivo
            </button>
          </div>
        )}
      </div>
    )
  }

  return null
}
