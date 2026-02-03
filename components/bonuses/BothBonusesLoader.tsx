'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { formatCOP } from '@/lib/formatters'
import { LIMITE_ALIMENTACION_MENSUAL } from '@/types/bonuses'

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

  const getBatchValidation = (emp: BothBonusesEmployee) => {
    const montoML = emp.salarioPorEmpleado * (emp.porcentajeML / 100)
    const porcentajeTotal = ((montoML + emp.montoAL) / emp.salarioPorEmpleado) * 100
    const excedeTotal = porcentajeTotal > MAX_TOTAL_BONUS_PERCENTAGE
    const excedeUVT = emp.montoAL > LIMITE_ALIMENTACION_MENSUAL

    return { porcentajeTotal, excedeTotal, excedeUVT }
  }

  return (
    <div className="max-w-6xl mx-auto">
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

      {/* Formulario para agregar lotes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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

        {/* Indicador de porcentaje total */}
        {salarioNum > 0 && montoALNum >= 0 && (
          <div className={`p-4 rounded-lg mb-4 ${excede40Percent ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Porcentaje total de bonos:</span>
              <span className={`text-lg font-bold ${excede40Percent ? 'text-orange-900' : 'text-green-900'}`}>
                {porcentajeTotal.toFixed(1)}% / 40%
              </span>
            </div>
            {excede40Percent && (
              <p className="text-xs text-orange-800 mt-2">
                ⚠️ Excede el límite legal del 40%
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
