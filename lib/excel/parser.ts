import * as XLSX from 'xlsx'
import { Employee } from '@/types/bonuses'
import { v4 as uuidv4 } from 'uuid'

export interface ParseResult {
  success: boolean
  employees?: Employee[]
  errors?: string[]
}

/**
 * Parsea un archivo Excel y extrae los empleados
 */
export async function parseEmployeeExcel(file: File): Promise<ParseResult> {
  try {
    // Leer archivo
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // Buscar la hoja "Empleados"
    let sheetName = 'Empleados'
    if (!workbook.SheetNames.includes(sheetName)) {
      // Si no existe, usar la primera hoja
      sheetName = workbook.SheetNames[0]
    }

    const worksheet = workbook.Sheets[sheetName]

    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    if (data.length === 0) {
      return {
        success: false,
        errors: ['El archivo no contiene datos de empleados']
      }
    }

    const employees: Employee[] = []
    const errors: string[] = []

    // Procesar cada fila
    data.forEach((row: any, index: number) => {
      const rowNumber = index + 2 // +2 porque Excel empieza en 1 y tiene header

      // Validar campos requeridos
      const nombre = row['Nombre Completo']?.toString().trim()
      const salarioRaw = row['Salario Mensual']

      if (!nombre) {
        errors.push(`Fila ${rowNumber}: Falta el nombre del empleado`)
        return
      }

      if (!salarioRaw || salarioRaw === '') {
        errors.push(`Fila ${rowNumber}: Falta el salario para ${nombre}`)
        return
      }

      // Convertir salario a número
      let salario: number
      if (typeof salarioRaw === 'number') {
        salario = salarioRaw
      } else {
        // Limpiar formato (quitar puntos, comas, símbolos)
        const salarioClean = salarioRaw.toString().replace(/[$,.\s]/g, '')
        salario = parseInt(salarioClean, 10)
      }

      if (isNaN(salario) || salario <= 0) {
        errors.push(`Fila ${rowNumber}: Salario inválido para ${nombre} (${salarioRaw})`)
        return
      }

      // Validar salario mínimo legal
      const MIN_SALARY = 2450000
      if (salario < MIN_SALARY) {
        errors.push(`Fila ${rowNumber}: El salario de ${nombre} ($${salario.toLocaleString('es-CO')}) está por debajo del salario mínimo legal ($${MIN_SALARY.toLocaleString('es-CO')})`)
        return
      }

      // Campos opcionales
      const cedula = row['Cédula']?.toString().trim() || undefined
      const cargo = row['Cargo']?.toString().trim() || undefined

      // Crear empleado
      employees.push({
        id: uuidv4(),
        nombre,
        salario,
        cedula,
        cargo,
        origen: 'archivo'
      })
    })

    // Si hay errores, no retornar empleados
    if (errors.length > 0) {
      return {
        success: false,
        errors
      }
    }

    // Validar que haya al menos un empleado
    if (employees.length === 0) {
      return {
        success: false,
        errors: ['No se encontraron empleados válidos en el archivo']
      }
    }

    return {
      success: true,
      employees
    }

  } catch (error) {
    console.error('Error parsing Excel:', error)
    return {
      success: false,
      errors: ['Error al leer el archivo. Asegúrese de que sea un archivo Excel válido (.xlsx o .xls)']
    }
  }
}

/**
 * Valida que el archivo sea un Excel
 */
export function validateExcelFile(file: File): { valid: boolean; error?: string } {
  const validExtensions = ['.xlsx', '.xls']
  const fileName = file.name.toLowerCase()

  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))

  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'Por favor seleccione un archivo Excel (.xlsx o .xls)'
    }
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
    }
  }

  return { valid: true }
}
