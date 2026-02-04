'use client'

import { Employee } from '@/types/employee'
import { EmployeeItem } from './EmployeeItem'
import { formatCOP } from '@/lib/formatters'

interface EmployeeListProps {
  employees: Employee[]
  totalSalary: number
  onUpdate: (id: string, data: { salario: number; nombre?: string }) => void
  onRemove: (id: string) => void
}

export function EmployeeList({
  employees,
  totalSalary,
  onUpdate,
  onRemove,
}: EmployeeListProps) {
  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Lista de Empleados</h3>
        <p className="text-gray-500 text-center py-8">
          No hay empleados agregados. Agrega el primer empleado para comenzar.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Lista de Empleados</h3>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total empleados</p>
          <p className="text-xl font-bold text-gray-900">{employees.length}</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {employees.map((employee) => (
          <EmployeeItem
            key={employee.id}
            employee={employee}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">
            Nómina Total:
          </span>
          <span className="text-2xl font-bold text-blue-600">
            {formatCOP(totalSalary)}
          </span>
        </div>
      </div>
    </div>
  )
}
