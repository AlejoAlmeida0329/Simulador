'use client'

import { useState, useCallback } from 'react'
import { Employee, EmployeeFormData } from '@/types/employee'
import { employeeSchema } from '@/lib/validation'

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])

  // Add new employee
  const addEmployee = useCallback((data: EmployeeFormData) => {
    try {
      // Validate input
      employeeSchema.parse(data)

      const newEmployee: Employee = {
        id: crypto.randomUUID(),
        salario: data.salario,
        nombre: data.nombre,
      }

      setEmployees((prev) => [...prev, newEmployee])
      return { success: true, employee: newEmployee }
    } catch (error) {
      return { success: false, error: error as Error }
    }
  }, [])

  // Add multiple employees with same salary
  const addEmployeesBulk = useCallback((salary: number, count: number) => {
    try {
      // Validate salary
      employeeSchema.parse({ salario: salary })

      const newEmployees: Employee[] = Array.from({ length: count }, (_, index) => ({
        id: crypto.randomUUID(),
        salario: salary,
        nombre: `Empleado (${formatCOP(salary)})`,
      }))

      setEmployees((prev) => [...prev, ...newEmployees])
      return { success: true, count: newEmployees.length }
    } catch (error) {
      return { success: false, error: error as Error }
    }
  }, [])

  function formatCOP(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Update existing employee
  const updateEmployee = useCallback((id: string, data: Partial<EmployeeFormData>) => {
    try {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === id
            ? { ...emp, ...data }
            : emp
        )
      )
      return { success: true }
    } catch (error) {
      return { success: false, error: error as Error }
    }
  }, [])

  // Remove employee
  const removeEmployee = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id))
    return { success: true }
  }, [])

  // Remove all employees with a specific salary
  const removeEmployeeGroup = useCallback((salary: number) => {
    setEmployees((prev) => prev.filter((emp) => emp.salario !== salary))
    return { success: true }
  }, [])

  // Calculate aggregate totals
  const totalEmployees = employees.length
  const totalSalary = employees.reduce((sum, emp) => sum + emp.salario, 0)

  return {
    employees,
    addEmployee,
    addEmployeesBulk,
    updateEmployee,
    removeEmployee,
    removeEmployeeGroup,
    totalEmployees,
    totalSalary,
  }
}
