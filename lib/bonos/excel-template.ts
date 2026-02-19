/**
 * Generador de plantillas Excel descargables por flujo.
 * Usa SheetJS para crear archivos .xlsx con encabezados y datos de ejemplo.
 */

import { SALARIO_INTEGRAL_MINIMO } from './constants'

export async function downloadRegularTemplate() {
  const XLSX = await import('xlsx')

  const data = [
    { Nombre: 'Juan Perez', Salario: 3500000, Cedula: '1234567890', Cargo: 'Analista', 'Nivel ARL': 'I' },
    { Nombre: 'Maria Garcia', Salario: 5000000, Cedula: '9876543210', Cargo: 'Coordinadora', 'Nivel ARL': 'II' },
    { Nombre: 'Carlos Lopez', Salario: 8000000, Cedula: '', Cargo: 'Gerente', 'Nivel ARL': 'I' },
  ]

  const ws = XLSX.utils.json_to_sheet(data)

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Nombre
    { wch: 15 }, // Salario
    { wch: 15 }, // Cedula
    { wch: 20 }, // Cargo
    { wch: 12 }, // Nivel ARL
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Empleados')
  XLSX.writeFile(wb, 'plantilla_empleados_bonos.xlsx')
}

export async function downloadIntegralTemplate() {
  const XLSX = await import('xlsx')

  const minIntegral = SALARIO_INTEGRAL_MINIMO

  const data = [
    { Nombre: 'Ana Directora', 'Salario Actual': Math.round(minIntegral * 1.1), Cedula: '1111111111', Cargo: 'Directora', 'Nivel ARL': 'I' },
    { Nombre: 'Pedro Gerente', 'Salario Actual': 40000000, Cedula: '2222222222', Cargo: 'Gerente TI', 'Nivel ARL': 'II' },
    { Nombre: 'Laura VP', 'Salario Actual': 60000000, Cedula: '', Cargo: 'VP Comercial', 'Nivel ARL': 'I' },
  ]

  const ws = XLSX.utils.json_to_sheet(data)

  ws['!cols'] = [
    { wch: 25 }, // Nombre
    { wch: 18 }, // Salario Actual
    { wch: 15 }, // Cedula
    { wch: 20 }, // Cargo
    { wch: 12 }, // Nivel ARL
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Empleados Integral')
  XLSX.writeFile(wb, 'plantilla_empleados_integral.xlsx')
}
