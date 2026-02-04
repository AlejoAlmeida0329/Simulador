import * as XLSX from 'xlsx'

/**
 * Genera y descarga una plantilla Excel para cargar empleados
 */
export function downloadEmployeeTemplate() {
  // Crear los datos de la plantilla con filas de ejemplo
  const templateData = [
    {
      'Nombre Completo': 'Juan Pérez',
      'Salario Mensual': 3500000,
      'Cédula': '1234567890',
      'Cargo': 'Desarrollador Senior'
    },
    {
      'Nombre Completo': 'María García',
      'Salario Mensual': 4200000,
      'Cédula': '9876543210',
      'Cargo': 'Gerente de Proyecto'
    },
    {
      'Nombre Completo': 'Carlos López',
      'Salario Mensual': 2800000,
      'Cédula': '5551234567',
      'Cargo': 'Analista'
    }
  ]

  // Crear hoja de trabajo
  const worksheet = XLSX.utils.json_to_sheet(templateData)

  // Configurar anchos de columnas
  const columnWidths = [
    { wch: 30 }, // Nombre Completo
    { wch: 18 }, // Salario Mensual
    { wch: 15 }, // Cédula
    { wch: 25 }  // Cargo
  ]
  worksheet['!cols'] = columnWidths

  // Agregar una hoja de instrucciones
  const instructions = [
    { 'INSTRUCCIONES': 'Plantilla para Bonos de Mera Liberalidad' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': '1. ELIMINE LAS FILAS DE EJEMPLO (filas 2, 3 y 4)' },
    { 'INSTRUCCIONES': '2. Complete la información de sus empleados en la hoja "Empleados"' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': 'Columnas:' },
    { 'INSTRUCCIONES': '   - Nombre Completo: Nombre del empleado (OBLIGATORIO)' },
    { 'INSTRUCCIONES': '   - Salario Mensual: Salario en pesos colombianos (OBLIGATORIO, mínimo $2.450.000)' },
    { 'INSTRUCCIONES': '   - Cédula: Número de identificación (OPCIONAL)' },
    { 'INSTRUCCIONES': '   - Cargo: Cargo del empleado (OPCIONAL)' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': 'RESTRICCIONES LEGALES:' },
    { 'INSTRUCCIONES': '   - El SALARIO debe ser mínimo 60% de la compensación total' },
    { 'INSTRUCCIONES': '   - El BONO máximo es 40% del salario' },
    { 'INSTRUCCIONES': '   - Salario mínimo legal: $2.450.000' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': 'IMPORTANTE:' },
    { 'INSTRUCCIONES': '   - NO cambie los nombres de las columnas' },
    { 'INSTRUCCIONES': '   - Los salarios deben ser números sin puntos ni comas' },
    { 'INSTRUCCIONES': '   - El formato debe ser .xlsx o .xls' },
    { 'INSTRUCCIONES': '' },
    { 'INSTRUCCIONES': 'Ejemplo válido:' },
    { 'INSTRUCCIONES': '   Salario: $3.500.000' },
    { 'INSTRUCCIONES': '   Bono máximo calculado: $1.400.000 (40%)' },
    { 'INSTRUCCIONES': '   Compensación total: $4.900.000' },
    { 'INSTRUCCIONES': '   Salario = 71.4% de compensación (>60% ✓)' }
  ]

  const instructionsSheet = XLSX.utils.json_to_sheet(instructions)
  instructionsSheet['!cols'] = [{ wch: 80 }]

  // Crear libro de trabajo
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'INSTRUCCIONES')
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Empleados')

  // Generar archivo y descargar
  XLSX.writeFile(workbook, 'Plantilla_Empleados_Tikin.xlsx')
}
