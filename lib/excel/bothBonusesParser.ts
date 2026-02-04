import * as XLSX from 'xlsx'
import { BothBonusesEmployee } from '@/components/bonuses/BothBonusesLoader'
import { v4 as uuidv4 } from 'uuid'
import { LIMITE_ALIMENTACION_MENSUAL } from '@/types/bonuses'

export interface BothBonusesParseResult {
  success: boolean
  batches?: BothBonusesEmployee[]
  errors?: string[]
}

const MAX_TOTAL_BONUS_PERCENTAGE = 40
const MIN_SALARY = 2450000

/**
 * Parsea un archivo Excel de lotes de bonos ML + AL
 */
export async function parseBothBonusesExcel(file: File): Promise<BothBonusesParseResult> {
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

    const batches: BothBonusesEmployee[] = []
    const errors: string[] = []

    // Procesar cada fila
    data.forEach((row: any, index: number) => {
      const rowNumber = index + 2 // +2 porque Excel empieza en 1 y tiene header

      // Validar campos requeridos
      const cantidadRaw = row['Cantidad Empleados']
      const salarioRaw = row['Salario por Empleado']
      const porcentajeMLRaw = row['% Bono Mera Liberalidad']
      const montoALRaw = row['Monto Bono Alimentación']

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

      if (salario < MIN_SALARY) {
        errors.push(`Fila ${rowNumber}: Salario ($${salario.toLocaleString('es-CO')}) está por debajo del mínimo legal ($${MIN_SALARY.toLocaleString('es-CO')})`)
        return
      }

      // Validar porcentaje ML
      if (porcentajeMLRaw === '' || porcentajeMLRaw === null || porcentajeMLRaw === undefined) {
        errors.push(`Fila ${rowNumber}: Falta el porcentaje de Mera Liberalidad`)
        return
      }

      let porcentajeML: number
      if (typeof porcentajeMLRaw === 'number') {
        porcentajeML = porcentajeMLRaw
      } else {
        const porcentajeClean = porcentajeMLRaw.toString().replace(/[%\s]/g, '')
        porcentajeML = parseFloat(porcentajeClean)
      }

      if (isNaN(porcentajeML) || porcentajeML < 0) {
        errors.push(`Fila ${rowNumber}: Porcentaje ML inválido (${porcentajeMLRaw})`)
        return
      }

      if (porcentajeML > MAX_TOTAL_BONUS_PERCENTAGE) {
        errors.push(`Fila ${rowNumber}: Porcentaje ML (${porcentajeML}%) supera el límite del ${MAX_TOTAL_BONUS_PERCENTAGE}%`)
        return
      }

      // Validar monto AL
      if (montoALRaw === '' || montoALRaw === null || montoALRaw === undefined) {
        errors.push(`Fila ${rowNumber}: Falta el monto del bono de alimentación`)
        return
      }

      let montoAL: number
      if (typeof montoALRaw === 'number') {
        montoAL = montoALRaw
      } else {
        const montoClean = montoALRaw.toString().replace(/[$,.\\s]/g, '')
        montoAL = parseInt(montoClean, 10)
      }

      if (isNaN(montoAL) || montoAL < 0) {
        errors.push(`Fila ${rowNumber}: Monto AL inválido (${montoALRaw})`)
        return
      }

      // Validación de negocio: suma de ML + AL no puede superar 40% del salario
      // (Esto garantiza que salario >= 60% de compensación total)
      const montoML = salario * (porcentajeML / 100)
      const porcentajeTotal = ((montoML + montoAL) / salario) * 100

      if (porcentajeTotal > MAX_TOTAL_BONUS_PERCENTAGE) {
        errors.push(`Fila ${rowNumber}: Total de bonos (${porcentajeTotal.toFixed(1)}%) supera el límite del ${MAX_TOTAL_BONUS_PERCENTAGE}%. El salario debe ser al menos 60% de la compensación total`)
        return
      }

      // Validación: límite legal de AL
      if (montoAL > LIMITE_ALIMENTACION_MENSUAL) {
        errors.push(`Fila ${rowNumber}: Bono AL ($${montoAL.toLocaleString('es-CO')}) supera el límite legal de $${LIMITE_ALIMENTACION_MENSUAL.toLocaleString('es-CO')}`)
        return
      }

      // Crear lote
      batches.push({
        id: uuidv4(),
        cantidad: cantidad,
        salarioPorEmpleado: salario,
        porcentajeML: porcentajeML,
        montoAL: montoAL
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
    console.error('Error parsing Both Bonuses Excel:', error)
    return {
      success: false,
      errors: ['Error al leer el archivo. Asegúrese de que sea un archivo Excel válido (.xlsx o .xls)']
    }
  }
}

/**
 * Valida que el archivo sea un Excel
 */
export function validateBothBonusesExcelFile(file: File): { valid: boolean; error?: string } {
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
