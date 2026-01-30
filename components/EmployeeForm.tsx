'use client'

import { useState, FormEvent } from 'react'
import { formatCOP } from '@/lib/formatters'

interface EmployeeFormProps {
  onAdd: (data: { salary: number; name?: string }) => void
  onAddBulk: (data: { salary: number; count: number }) => void
}

export function EmployeeForm({ onAdd, onAddBulk }: EmployeeFormProps) {
  const [salary, setSalary] = useState('')
  const [count, setCount] = useState('1')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const salaryNum = parseFloat(salary)
    const countNum = parseInt(count)

    if (isNaN(salaryNum) || salaryNum < 0) {
      setError('Por favor ingresa un salario válido')
      return
    }

    if (isNaN(countNum) || countNum < 1) {
      setError('La cantidad debe ser al menos 1')
      return
    }

    if (countNum === 1) {
      onAdd({ salary: salaryNum })
    } else {
      onAddBulk({ salary: salaryNum, count: countNum })
    }

    // Reset form
    setSalary('')
    setCount('1')
  }

  const totalCost = !isNaN(parseFloat(salary)) && !isNaN(parseInt(count))
    ? parseFloat(salary) * parseInt(count)
    : 0

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Agregar Empleados</h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad de empleados
          </label>
          <input
            type="number"
            id="count"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tikin-red focus:border-transparent transition-all"
            placeholder="Ej: 15"
            required
            min="1"
            step="1"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            {parseInt(count) === 1 ? '1 empleado' : `${count} empleados`}
          </p>
        </div>

        <div>
          <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-2">
            Salario mensual (por empleado)
          </label>
          <input
            type="number"
            id="salary"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tikin-red focus:border-transparent transition-all"
            placeholder="Ej: 1000000"
            required
            min="0"
            step="1"
          />
          {salary && !isNaN(parseFloat(salary)) && (
            <p className="text-sm text-gray-600 mt-1.5">
              {formatCOP(parseFloat(salary))} por empleado
            </p>
          )}
        </div>

        {totalCost > 0 && parseInt(count) > 1 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              Nómina total del grupo
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatCOP(totalCost)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {count} empleados × {formatCOP(parseFloat(salary))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-tikin-red text-white py-3 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-tikin-red focus:ring-offset-2 transition-all font-medium"
        >
          {parseInt(count) === 1 ? 'Agregar Empleado' : `Agregar ${count} Empleados`}
        </button>
      </div>
    </form>
  )
}
