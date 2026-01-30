'use client'

import { Employee } from '@/types/employee'
import { formatCOP } from '@/lib/formatters'

interface EmployeeGroup {
  salary: number
  count: number
  total: number
  employeeIds: string[]
}

interface EmployeeListGroupedProps {
  employees: Employee[]
  totalSalary: number
  onRemoveGroup: (salary: number) => void
}

export function EmployeeListGrouped({
  employees,
  totalSalary,
  onRemoveGroup,
}: EmployeeListGroupedProps) {
  // Group employees by salary
  const groups: EmployeeGroup[] = Object.values(
    employees.reduce((acc, emp) => {
      const key = emp.salary
      if (!acc[key]) {
        acc[key] = {
          salary: emp.salary,
          count: 0,
          total: 0,
          employeeIds: [],
        }
      }
      acc[key].count++
      acc[key].total += emp.salary
      acc[key].employeeIds.push(emp.id)
      return acc
    }, {} as Record<number, EmployeeGroup>)
  ).sort((a, b) => b.salary - a.salary) // Sort by salary descending

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lista de Empleados</h3>
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            No hay empleados agregados
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Agrega el primer grupo para comenzar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Lista de Empleados</h3>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-600">Total empleados</p>
          <p className="text-2xl font-semibold text-gray-900">{employees.length}</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {groups.map((group) => (
          <div
            key={group.salary}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-semibold text-gray-900">
                    {group.count}
                  </span>
                  <span className="text-gray-600">
                    {group.count === 1 ? 'empleado' : 'empleados'}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-1">
                  <span>Salario individual: </span>
                  <span className="font-semibold text-gray-900">
                    {formatCOP(group.salary)}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                  <span className="text-xs text-gray-600">
                    {group.count} × {formatCOP(group.salary)} =
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCOP(group.total)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onRemoveGroup(group.salary)}
                className="ml-4 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">
            Nómina Total
          </span>
          <span className="text-2xl font-semibold text-gray-900">
            {formatCOP(totalSalary)}
          </span>
        </div>
      </div>
    </div>
  )
}
