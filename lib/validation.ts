import { z } from 'zod'

// Colombian minimum wage 2026 (Decretos 1469/1470 del 29-dic-2025)
export const MINIMUM_WAGE_COP = 1_750_905

export const employeeSchema = z.object({
  salary: z
    .number()
    .min(0, 'El salario debe ser mayor o igual a 0')
    .finite('El salario debe ser un número válido'),
  name: z.string().optional(),
})

export const employeeUpdateSchema = z.object({
  id: z.string(),
  salary: z
    .number()
    .min(0, 'El salario debe ser mayor o igual a 0')
    .finite('El salario debe ser un número válido'),
  name: z.string().optional(),
})

export type EmployeeFormInput = z.infer<typeof employeeSchema>
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>
