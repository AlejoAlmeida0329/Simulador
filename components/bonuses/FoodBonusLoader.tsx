'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { formatCOP } from '@/lib/formatters'
import { LIMITE_ALIMENTACION_MENSUAL } from '@/types/bonuses'

interface FoodBonusEmployee {
  id: string
  cantidad: number
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
  const [montoPorEmpleado, setMontoPorEmpleado] = useState<string>('')

  const totalEmpleados = employees.reduce((sum, emp) => sum + emp.cantidad, 0)
  const totalMontoDispersado = employees.reduce((sum, emp) => sum + (emp.cantidad * emp.montoPorEmpleado), 0)

  const handleAddBatch = () => {
    const cantidadNum = parseInt(cantidad)
    const montoNum = parseFloat(montoPorEmpleado)

    if (!cantidadNum || cantidadNum <= 0) {
      alert('Ingresa una cantidad válida de empleados')
      return
    }

    if (!montoNum || montoNum <= 0) {
      alert('Ingresa un monto válido por empleado')
      return
    }

    if (montoNum > LIMITE_ALIMENTACION_MENSUAL) {
      alert(`⚠️ El monto excede el límite legal de ${formatCOP(LIMITE_ALIMENTACION_MENSUAL)} (41 UVT).\n\nPuedes agregarlo, pero se mostrará como exceso en el resumen.`)
    }

    const newBatch: FoodBonusEmployee = {
      id: uuidv4(),
      cantidad: cantidadNum,
      montoPorEmpleado: montoNum
    }

    setEmployees([...employees, newBatch])
    setCantidad('')
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

  const excedeLimit = (monto: number) => monto > LIMITE_ALIMENTACION_MENSUAL

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Bonos de Alimentación
        </h2>
        <p className="text-gray-600">
          Agrega los empleados y define el monto del bono de alimentación por empleado
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-blue-800">
            <strong>Límite legal:</strong> {formatCOP(LIMITE_ALIMENTACION_MENSUAL)} por empleado/mes (41 UVT)
          </span>
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
              Monto por empleado
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={montoPorEmpleado}
              onChange={(e) => setMontoPorEmpleado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-transparent"
              placeholder={`Ej: ${formatCOP(1500000)}`}
            />
            {montoPorEmpleado && parseFloat(montoPorEmpleado) > LIMITE_ALIMENTACION_MENSUAL && (
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
                    Monto/Empleado
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
                {employees.map((emp) => (
                  <tr key={emp.id} className={excedeLimit(emp.montoPorEmpleado) ? 'bg-orange-50' : ''}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {emp.cantidad} empleado{emp.cantidad > 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCOP(emp.montoPorEmpleado)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCOP(emp.cantidad * emp.montoPorEmpleado)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {excedeLimit(emp.montoPorEmpleado) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                          ⚠️ Excede límite
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumen */}
      {employees.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700 mb-1">Total de empleados</p>
              <p className="text-2xl font-bold text-green-900">{totalEmpleados}</p>
            </div>
            <div>
              <p className="text-sm text-green-700 mb-1">Total a dispersar</p>
              <p className="text-2xl font-bold text-green-900">{formatCOP(totalMontoDispersado)}</p>
            </div>
          </div>

          {employees.some(emp => excedeLimit(emp.montoPorEmpleado)) && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>⚠️ Advertencia:</strong> Algunos empleados reciben montos que exceden el límite legal.
                Estos excesos no estarán exentos de parafiscales.
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
