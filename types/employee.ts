export interface Employee {
  id: string
  salario: number
  nombre?: string
}

export interface EmployeeFormData {
  salario: number
  nombre?: string
}
