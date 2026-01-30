'use client'

import { useState } from 'react'
import { Employee } from '@/types/employee'
import { formatCOP } from '@/lib/formatters'

interface EmployeeItemProps {
  employee: Employee
  onUpdate: (id: string, data: { salary: number; name?: string }) => void
  onRemove: (id: string) => void
}

export function EmployeeItem({ employee, onUpdate, onRemove }: EmployeeItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editSalary, setEditSalary] = useState(employee.salary.toString())
  const [editName, setEditName] = useState(employee.name || '')

  const handleSave = () => {
    const salaryNum = parseFloat(editSalary)
    if (!isNaN(salaryNum) && salaryNum >= 0) {
      onUpdate(employee.id, {
        salary: salaryNum,
        name: editName.trim() || undefined,
      })
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditSalary(employee.salary.toString())
    setEditName(employee.name || '')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del empleado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salario
            </label>
            <input
              type="number"
              value={editSalary}
              onChange={(e) => setEditSalary(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="1000"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Guardar
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">
            {employee.name || `Empleado ${employee.id.slice(0, 8)}`}
          </h4>
          <p className="text-lg font-semibold text-blue-600 mt-1">
            {formatCOP(employee.salary)}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => onRemove(employee.id)}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
