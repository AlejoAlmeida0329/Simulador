import * as XLSX from 'xlsx'

/**
 * Genera plantilla Excel para bonos de Mera Liberalidad + Alimentación
 */
export function downloadBothBonusesTemplate() {
  const templateData = [
    {
      'Cantidad Empleados': 5,
      'Salario por Empleado': 3500000,
      '% Bono Mera Liberalidad': 25,
      'Monto Bono Alimentación': 500000
    },
    {
      'Cantidad Empleados': 3,
      'Salario por Empleado': 4200000,
      '% Bono Mera Liberalidad': 30,
      'Monto Bono Alimentación': 600000
    }
  ]

  const worksheet = XLSX.utils.json_to_sheet(templateData)
  worksheet['!cols'] = [
    { wch: 20 },  // Cantidad Empleados
    { wch: 25 },  // Salario por Empleado
    { wch: 30 },  // % Bono Mera Liberalidad
    { wch: 30 }   // Monto Bono Alimentación
  ]

  const instructions = [
    { 'INSTRUCCIONES': 'Plantilla para Bonos de Mera Liberalidad + Alimentación' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': '1. ELIMINE LAS FILAS DE EJEMPLO' },
    { 'INSTRUCCIONES': '2. Complete sus lotes de empleados en la hoja "Lotes Empleados"' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': 'Columnas:' },
    { 'INSTRUCCIONES': '   - Cantidad Empleados: Número de empleados en el lote' },
    { 'INSTRUCCIONES': '   - Salario por Empleado: Salario mensual (mínimo $2.450.000)' },
    { 'INSTRUCCIONES': '   - % Bono Mera Liberalidad: Porcentaje del salario (0-40%)' },
    { 'INSTRUCCIONES': '   - Monto Bono Alimentación: Monto fijo del bono' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': 'RESTRICCIONES LEGALES:' },
    { 'INSTRUCCIONES': '   - El SALARIO debe ser mínimo 60% de la compensación total' },
    { 'INSTRUCCIONES': '   - Los BONOS TOTALES (ML + AL) máximo 40% del salario' },
    { 'INSTRUCCIONES': '   - Límite legal del bono AL: $2.099.200 por empleado/mes (41 UVT)' },
    { 'INSTRUCCIONES': '   - Salario mínimo legal: $2.450.000' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': 'Ejemplo válido:' },
    { 'INSTRUCCIONES': '   Salario: $4.000.000 (100%)' },
    { 'INSTRUCCIONES': '   Bono ML (25%): $1.000.000' },
    { 'INSTRUCCIONES': '   Bono AL: $600.000' },
    { 'INSTRUCCIONES': '   Total bonos: $1.600.000 (40% del salario)' },
    { 'INSTRUCCIONES': '   Compensación total: $5.600.000' },
    { 'INSTRUCCIONES': '   Salario = 71.4% de la compensación (>60% ✓)' }
  ]

  const instructionsSheet = XLSX.utils.json_to_sheet(instructions)
  instructionsSheet['!cols'] = [{ wch: 80 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'INSTRUCCIONES')
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lotes Empleados')

  XLSX.writeFile(workbook, 'Plantilla_Bonos_ML_AL_Tikin.xlsx')
}
