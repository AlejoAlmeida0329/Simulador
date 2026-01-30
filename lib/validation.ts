import { z } from 'zod'

// Colombian minimum wage 2024
export const MINIMUM_WAGE_COP = 1_300_000

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
