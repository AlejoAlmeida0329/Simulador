/**
 * Motor de parseo de archivos Excel para el wizard de bonos.
 * Soporta los 3 flujos: beneficios_actuales, nuevos_beneficios, salario_integral.
 *
 * Usa dynamic import de SheetJS para evitar carga en bundle inicial.
 */

import { MAX_EXCEL_FILE_SIZE, MAX_EXCEL_ROWS, MIN_SALARIO_BONOS } from './constants'
import type { ARLRiskLevel } from '@/lib/constants/parafiscales'

// ============================================
// TIPOS
// ============================================

export interface ExcelFieldDef {
  systemField: string
  synonyms: string[]
  type: 'string' | 'number' | 'arl'
  label: string
}

export interface ExcelFlowConfig {
  flowType: 'regular' | 'integral'
  requiredColumns: ExcelFieldDef[]
  optionalColumns: ExcelFieldDef[]
  salaryField: 'salario' | 'salarioActual'
  salaryMinimum: number
  salaryMinimumLabel?: string
}

export interface ParsedExcelEmployee {
  rowIndex: number
  nombre: string
  salario?: number
  salarioActual?: number
  cedula?: string
  cargo?: string
  arl?: ARLRiskLevel
}

export interface ParseError {
  row: number
  column: string
  value: unknown
  message: string
  severity: 'error' | 'warning'
}

export interface ExcelParseResult {
  success: boolean
  fileName: string
  totalRows: number
  validRows: number
  errorRows: number
  columnMapping: { excelColumn: string; systemField: string; columnIndex: number }[]
  unmappedHeaders: string[]
  parsedEmployees: ParsedExcelEmployee[]
  errors: ParseError[]
  errorMessage?: string
}

// ============================================
// CONFIGURACIONES POR FLUJO
// ============================================

export const REGULAR_FLOW_CONFIG: ExcelFlowConfig = {
  flowType: 'regular',
  requiredColumns: [
    {
      systemField: 'nombre',
      synonyms: ['nombre', 'empleado', 'trabajador', 'name', 'fullname', 'nombres', 'nombre completo', 'nombre empleado'],
      type: 'string',
      label: 'Nombre',
    },
    {
      systemField: 'salario',
      synonyms: ['salario', 'sueldo', 'salario_base', 'basico', 'salary', 'salario base', 'salario mensual', 'sueldo mensual', 'salario basico'],
      type: 'number',
      label: 'Salario',
    },
  ],
  optionalColumns: [
    {
      systemField: 'cedula',
      synonyms: ['cedula', 'cc', 'documento', 'identificacion', 'id', 'cedula de ciudadania', 'nro documento', 'numero documento', 'num documento'],
      type: 'string',
      label: 'Cedula',
    },
    {
      systemField: 'cargo',
      synonyms: ['cargo', 'puesto', 'position', 'title', 'cargo actual', 'posicion'],
      type: 'string',
      label: 'Cargo',
    },
    {
      systemField: 'arl',
      synonyms: ['arl', 'nivel_arl', 'riesgo_arl', 'nivel arl', 'arl nivel', 'riesgo', 'nivel de riesgo'],
      type: 'arl',
      label: 'Nivel ARL',
    },
  ],
  salaryField: 'salario',
  salaryMinimum: MIN_SALARIO_BONOS,
  salaryMinimumLabel: `$${MIN_SALARIO_BONOS.toLocaleString('es-CO')} (minimo para esquema de bonos)`,
}

export const INTEGRAL_FLOW_CONFIG: ExcelFlowConfig = {
  flowType: 'integral',
  requiredColumns: [
    {
      systemField: 'salarioActual',
      synonyms: ['salario', 'sueldo', 'salario_base', 'basico', 'salary', 'salario actual', 'salario mensual', 'sueldo mensual', 'salario_actual'],
      type: 'number',
      label: 'Salario Actual',
    },
  ],
  optionalColumns: [
    {
      systemField: 'nombre',
      synonyms: ['nombre', 'empleado', 'trabajador', 'name', 'fullname', 'nombres', 'nombre completo'],
      type: 'string',
      label: 'Nombre',
    },
    {
      systemField: 'cedula',
      synonyms: ['cedula', 'cc', 'documento', 'identificacion', 'id', 'cedula de ciudadania', 'nro documento'],
      type: 'string',
      label: 'Cedula',
    },
    {
      systemField: 'cargo',
      synonyms: ['cargo', 'puesto', 'position', 'title', 'cargo actual'],
      type: 'string',
      label: 'Cargo',
    },
    {
      systemField: 'arl',
      synonyms: ['arl', 'nivel_arl', 'riesgo_arl', 'nivel arl', 'arl nivel', 'riesgo', 'nivel de riesgo'],
      type: 'arl',
      label: 'Nivel ARL',
    },
  ],
  salaryField: 'salarioActual',
  salaryMinimum: 0,
}

// ============================================
// UTILIDADES
// ============================================

/** Quita acentos y normaliza a lowercase */
function normalizeString(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/** Parsea un valor numérico, manejando formato colombiano ("3.500.000") */
function parseNumericValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return value > 0 ? Math.round(value) : null
  }
  if (typeof value === 'string') {
    // Strip everything except digits, minus, comma, period
    let cleaned = value.trim()
    if (!cleaned) return null

    // Detect Colombian format: "3.500.000" (dots as thousands separator)
    // vs decimal format: "3500000.50"
    const dotCount = (cleaned.match(/\./g) || []).length
    if (dotCount > 1) {
      // Multiple dots = thousands separators, strip them
      cleaned = cleaned.replace(/\./g, '')
    } else if (dotCount === 1 && cleaned.includes(',')) {
      // "3.500,00" European format: dot=thousands, comma=decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    }

    // Remove any remaining non-numeric chars (except minus and period)
    cleaned = cleaned.replace(/[^0-9.\-]/g, '')

    const num = Number(cleaned)
    if (isNaN(num) || num <= 0) return null
    return Math.round(num)
  }
  return null
}

const ROMAN_MAP: Record<string, ARLRiskLevel> = {
  'i': 'I', '1': 'I',
  'ii': 'II', '2': 'II',
  'iii': 'III', '3': 'III',
  'iv': 'IV', '4': 'IV',
  'v': 'V', '5': 'V',
}

/** Parsea nivel ARL: acepta "1", "I", "nivel 2", "III", etc. */
function parseARL(value: unknown): ARLRiskLevel | null {
  if (value == null) return null
  const str = String(value).toLowerCase().trim().replace(/^nivel\s*/i, '')
  return ROMAN_MAP[str] ?? null
}

// ============================================
// AUTO-DETECCIÓN DE COLUMNAS
// ============================================

function autoDetectColumnMapping(
  headers: string[],
  config: ExcelFlowConfig,
): {
  mapping: Map<number, ExcelFieldDef>
  unmappedRequired: string[]
  unmappedHeaders: string[]
} {
  const allFields = [...config.requiredColumns, ...config.optionalColumns]
  const mapping = new Map<number, ExcelFieldDef>()
  const usedFields = new Set<string>()
  const mappedIndices = new Set<number>()

  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeString(headers[i])
    if (!normalized) continue

    for (const field of allFields) {
      if (usedFields.has(field.systemField)) continue
      if (field.synonyms.some((syn) => normalizeString(syn) === normalized)) {
        mapping.set(i, field)
        usedFields.add(field.systemField)
        mappedIndices.add(i)
        break
      }
    }
  }

  const unmappedRequired = config.requiredColumns
    .filter((f) => !usedFields.has(f.systemField))
    .map((f) => f.label)

  const unmappedHeaders = headers.filter((_, i) => !mappedIndices.has(i)).filter((h) => h.trim())

  return { mapping, unmappedRequired, unmappedHeaders }
}

// ============================================
// PARSEO DE FILAS
// ============================================

function parseRow(
  row: unknown[],
  mapping: Map<number, ExcelFieldDef>,
  rowIndex: number,
  config: ExcelFlowConfig,
): { employee: ParsedExcelEmployee | null; errors: ParseError[] } {
  const errors: ParseError[] = []
  const data: Record<string, unknown> = {}

  for (const [colIdx, field] of mapping.entries()) {
    const rawValue = row[colIdx]

    if (field.type === 'number') {
      const num = parseNumericValue(rawValue)
      if (num === null && config.requiredColumns.some((r) => r.systemField === field.systemField)) {
        errors.push({
          row: rowIndex,
          column: field.label,
          value: rawValue,
          message: `${field.label} es obligatorio y debe ser un numero positivo`,
          severity: 'error',
        })
      } else if (num !== null && config.salaryMinimum > 0 && num < config.salaryMinimum) {
        errors.push({
          row: rowIndex,
          column: field.label,
          value: rawValue,
          message: `${field.label} ($${num.toLocaleString('es-CO')}) es menor al minimo ${config.salaryMinimumLabel}`,
          severity: 'warning',
        })
        data[field.systemField] = num
      } else {
        data[field.systemField] = num
      }
    } else if (field.type === 'arl') {
      const arl = parseARL(rawValue)
      if (arl) {
        data[field.systemField] = arl
      }
      // ARL is always optional, no error
    } else {
      // string
      const str = rawValue != null ? String(rawValue).trim() : ''
      if (!str && config.requiredColumns.some((r) => r.systemField === field.systemField)) {
        errors.push({
          row: rowIndex,
          column: field.label,
          value: rawValue,
          message: `${field.label} es obligatorio`,
          severity: 'error',
        })
      } else {
        data[field.systemField] = str
      }
    }
  }

  // Check if there are blocking errors
  const hasBlockingErrors = errors.some((e) => e.severity === 'error')
  if (hasBlockingErrors) {
    return { employee: null, errors }
  }

  const employee: ParsedExcelEmployee = {
    rowIndex,
    nombre: (data.nombre as string) || `Empleado ${rowIndex}`,
    cedula: data.cedula as string | undefined,
    cargo: data.cargo as string | undefined,
    arl: data.arl as ARLRiskLevel | undefined,
  }

  if (config.flowType === 'regular') {
    employee.salario = data.salario as number
  } else {
    employee.salarioActual = data.salarioActual as number
  }

  return { employee, errors }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

export async function parseExcelFile(
  file: File,
  config: ExcelFlowConfig,
): Promise<ExcelParseResult> {
  const emptyResult = (errorMessage: string): ExcelParseResult => ({
    success: false,
    fileName: file.name,
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    columnMapping: [],
    unmappedHeaders: [],
    parsedEmployees: [],
    errors: [],
    errorMessage,
  })

  // Validate file extension
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'xlsx' && ext !== 'xls') {
    return emptyResult('Formato no soportado. Solo se aceptan archivos .xlsx o .xls')
  }

  // Validate file size
  if (file.size > MAX_EXCEL_FILE_SIZE) {
    const maxMB = Math.round(MAX_EXCEL_FILE_SIZE / (1024 * 1024))
    return emptyResult(`El archivo excede el tamaño maximo de ${maxMB}MB`)
  }

  // Dynamic import of SheetJS
  const XLSX = await import('xlsx')

  // Read file
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })

  // Take first sheet
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return emptyResult('El archivo no contiene hojas de calculo')
  }

  const sheet = workbook.Sheets[sheetName]
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  if (rawData.length < 2) {
    return emptyResult('El archivo esta vacio o solo contiene encabezados')
  }

  // Parse headers (first row)
  const headers = (rawData[0] as unknown[]).map((h) => String(h ?? ''))

  // Auto-detect column mapping
  const { mapping, unmappedRequired, unmappedHeaders } = autoDetectColumnMapping(headers, config)

  if (unmappedRequired.length > 0) {
    return emptyResult(
      `No se encontraron las columnas obligatorias: ${unmappedRequired.join(', ')}. ` +
        `Asegurate de que los encabezados coincidan con: ${config.requiredColumns.map((c) => c.label).join(', ')}`,
    )
  }

  // Parse data rows
  const dataRows = rawData.slice(1).slice(0, MAX_EXCEL_ROWS)
  const parsedEmployees: ParsedExcelEmployee[] = []
  const allErrors: ParseError[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] as unknown[]

    // Skip completely empty rows
    const hasAnyValue = row.some((v) => v != null && String(v).trim() !== '')
    if (!hasAnyValue) continue

    const { employee, errors } = parseRow(row, mapping, i + 2, config) // +2 for 1-based + header
    allErrors.push(...errors)

    if (employee) {
      parsedEmployees.push(employee)
    }
  }

  const errorRows = allErrors.filter((e) => e.severity === 'error').length
  const columnMappingList = Array.from(mapping.entries()).map(([idx, field]) => ({
    excelColumn: headers[idx],
    systemField: field.systemField,
    columnIndex: idx,
  }))

  return {
    success: parsedEmployees.length > 0,
    fileName: file.name,
    totalRows: dataRows.filter((r) => (r as unknown[]).some((v) => v != null && String(v).trim() !== '')).length,
    validRows: parsedEmployees.length,
    errorRows,
    columnMapping: columnMappingList,
    unmappedHeaders,
    parsedEmployees,
    errors: allErrors,
  }
}
