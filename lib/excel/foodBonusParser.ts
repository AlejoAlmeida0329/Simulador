import * as XLSX from 'xlsx'
import { FoodBonusEmployee } from '@/components/bonuses/FoodBonusLoader'
import { v4 as uuidv4 } from 'uuid'

export interface FoodBonusParseResult {
  success: boolean
  batches?: FoodBonusEmployee[]
  errors?: string[]
}

/**
 * Parsea un archivo Excel de lotes de bonos de alimentación
 */
export async function parseFoodBonusExcel(file: File): Promise<FoodBonusParseResult> {
  try {
    // Leer archivo
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // Buscar la hoja "Lotes Empleados"
    let sheetName = 'Lotes Empleados'
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
        errors: ['El archivo no contiene datos de lotes']
      }
    }

    const batches: FoodBonusEmployee[] = []
    const errors: string[] = []

    // Procesar cada fila
    data.forEach((row: any, index: number) => {
      const rowNumber = index + 2 // +2 porque Excel empieza en 1 y tiene header

      // Validar campos requeridos
      const cantidadRaw = row['Cantidad Empleados']
      const salarioRaw = row['Salario por Empleado']
      const bonoRaw = row['Bono Alimentación por Empleado']

      // Validar cantidad de empleados
      if (!cantidadRaw || cantidadRaw === '') {
        errors.push(`Fila ${rowNumber}: Falta la cantidad de empleados`)
        return
      }

      let cantidad: number
      if (typeof cantidadRaw === 'number') {
        cantidad = Math.floor(cantidadRaw)
      } else {
        const cantidadClean = cantidadRaw.toString().replace(/[,.\s]/g, '')
        cantidad = parseInt(cantidadClean, 10)
      }

      if (isNaN(cantidad) || cantidad <= 0) {
        errors.push(`Fila ${rowNumber}: Cantidad de empleados inválida (${cantidadRaw})`)
        return
      }

      // Validar salario
      if (!salarioRaw || salarioRaw === '') {
        errors.push(`Fila ${rowNumber}: Falta el salario por empleado`)
        return
      }

      let salario: number
      if (typeof salarioRaw === 'number') {
        salario = salarioRaw
      } else {
        const salarioClean = salarioRaw.toString().replace(/[$,.\\s]/g, '')
        salario = parseInt(salarioClean, 10)
      }

      if (isNaN(salario) || salario <= 0) {
        errors.push(`Fila ${rowNumber}: Salario inválido (${salarioRaw})`)
        return
      }

      // Validar salario mínimo legal
      const MIN_SALARY = 2450000
      if (salario < MIN_SALARY) {
        errors.push(`Fila ${rowNumber}: El salario ($${salario.toLocaleString('es-CO')}) está por debajo del salario mínimo legal ($${MIN_SALARY.toLocaleString('es-CO')})`)
        return
      }

      // Validar bono
      if (!bonoRaw || bonoRaw === '') {
        errors.push(`Fila ${rowNumber}: Falta el monto del bono de alimentación`)
        return
      }

      let bono: number
      if (typeof bonoRaw === 'number') {
        bono = bonoRaw
      } else {
        const bonoClean = bonoRaw.toString().replace(/[$,.\\s]/g, '')
        bono = parseInt(bonoClean, 10)
      }

      if (isNaN(bono) || bono <= 0) {
        errors.push(`Fila ${rowNumber}: Monto de bono inválido (${bonoRaw})`)
        return
      }

      // Validación de negocio: bono no puede superar 40% del salario
      // (Esto garantiza que salario >= 60% de compensación total)
      const porcentajeBono = (bono / salario) * 100
      if (porcentajeBono > 40) {
        errors.push(`Fila ${rowNumber}: El bono (${porcentajeBono.toFixed(1)}%) supera el límite del 40% del salario. El salario debe ser al menos 60% de la compensación total`)
        return
      }

      // Validación: límite legal de $2.099.200
      const LIMITE_LEGAL = 2099200
      if (bono > LIMITE_LEGAL) {
        errors.push(`Fila ${rowNumber}: El bono ($${bono.toLocaleString('es-CO')}) supera el límite legal de $${LIMITE_LEGAL.toLocaleString('es-CO')}`)
        return
      }

      // Crear lote
      batches.push({
        id: uuidv4(),
        cantidad: cantidad,
        salarioPorEmpleado: salario,
        montoPorEmpleado: bono
      })
    })

    // Si hay errores, no retornar lotes
    if (errors.length > 0) {
      return {
        success: false,
        errors
      }
    }

    // Validar que haya al menos un lote
    if (batches.length === 0) {
      return {
        success: false,
        errors: ['No se encontraron lotes válidos en el archivo']
      }
    }

    return {
      success: true,
      batches
    }

  } catch (error) {
    console.error('Error parsing Food Bonus Excel:', error)
    return {
      success: false,
      errors: ['Error al leer el archivo. Asegúrese de que sea un archivo Excel válido (.xlsx o .xls)']
    }
  }
}

/**
 * Valida que el archivo sea un Excel
 */
export function validateFoodBonusExcelFile(file: File): { valid: boolean; error?: string } {
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
