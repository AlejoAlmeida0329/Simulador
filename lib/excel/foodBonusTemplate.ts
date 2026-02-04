import * as XLSX from 'xlsx'

/**
 * Genera plantilla Excel para bonos de alimentación
 */
export function downloadFoodBonusTemplate() {
  const templateData = [
    {
      'Cantidad Empleados': 5,
      'Salario por Empleado': 3500000,
      'Bono Alimentación por Empleado': 500000
    },
    {
      'Cantidad Empleados': 3,
      'Salario por Empleado': 4200000,
      'Bono Alimentación por Empleado': 600000
    }
  ]

  const worksheet = XLSX.utils.json_to_sheet(templateData)
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 35 }
  ]

  const instructions = [
    { 'INSTRUCCIONES': 'Plantilla para Bonos de Alimentación' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': '1. ELIMINE LAS FILAS DE EJEMPLO' },
    { 'INSTRUCCIONES': '2. Complete sus lotes de empleados en la hoja "Lotes Empleados"' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': 'Columnas:' },
    { 'INSTRUCCIONES': '   - Cantidad Empleados: Número de empleados en el lote' },
    { 'INSTRUCCIONES': '   - Salario por Empleado: Salario mensual (mínimo $2.450.000)' },
    { 'INSTRUCCIONES': '   - Bono Alimentación por Empleado: Monto del bono' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': 'RESTRICCIONES LEGALES:' },
    { 'INSTRUCCIONES': '   - El SALARIO debe ser mínimo 60% de la compensación total' },
    { 'INSTRUCCIONES': '   - El BONO máximo es 40% del salario' },
    { 'INSTRUCCIONES': '   - Límite legal del bono: $2.099.200 por empleado/mes (41 UVT)' },
    { 'INSTRUCCIONES': '   - Salario mínimo legal: $2.450.000' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': 'Ejemplo válido:' },
    { 'INSTRUCCIONES': '   Salario: $3.500.000 (100%)' },
    { 'INSTRUCCIONES': '   Bono máximo: $1.400.000 (40% del salario)' },
    { 'INSTRUCCIONES': '   Compensación total: $4.900.000' },
    { 'INSTRUCCIONES': '   Salario = 71.4% de la compensación (>60% ✓)' }
  ]

  const instructionsSheet = XLSX.utils.json_to_sheet(instructions)
  instructionsSheet['!cols'] = [{ wch: 80 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'INSTRUCCIONES')
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lotes Empleados')

  XLSX.writeFile(workbook, 'Plantilla_Bonos_Alimentacion_Tikin.xlsx')
}
