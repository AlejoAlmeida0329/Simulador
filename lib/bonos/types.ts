/**
 * Sistema de Tipos para Bonos 2.0
 * Definición completa de tipos para el nuevo flujo de cotización
 */

import { BonusTypeEnum, BonusCategory, ValidationCode, ValidationSeverity, DataInputMethod } from './constants'
import type { ARLRiskLevel } from '@/lib/constants/parafiscales'

// ============================================
// REGIMEN DE PARAFISCALES
// ============================================

/**
 * Regimen de contribucion parafiscal de la empresa
 * - general: paga TODOS los aportes (entidades sin animo de lucro, cooperativas, no declarantes)
 * - exonerado: exonerada de Salud, SENA e ICBF para empleados < 10 SMMLV (Art. 114-1 E.T.)
 */
export type RegimenParafiscales = 'general' | 'exonerado'

// ============================================
// EMPLEADOS Y LOTES
// ============================================

/**
 * Empleado individual con sus bonos asignados
 */
export interface EmployeeBonos2 {
  id: string // UUID único
  nombre: string
  salario: number
  cedula?: string
  cargo?: string
  origen: 'manual' | 'excel' | 'lote'
  loteId?: string

  // Nivel de riesgo ARL (heredado del lote)
  arlRiskLevel?: ARLRiskLevel

  // Bonos asignados por tipo
  bonos: Partial<Record<BonusTypeEnum, number>>

  // Cálculos derivados
  totalBonos: number // Suma de todos los bonos
  totalCompensacion: number // salario + totalBonos
  porcentajeBonos: number // % de bonos sobre total compensación
  porcentajeSalario: number // % de salario sobre total compensación
}

/**
 * Lote de empleados con mismo salario y bonos
 */
export interface LoteBonos2 {
  id: string
  nombre: string // "Lote 1: Operarios", "Lote 2: Administrativos"
  cantidad: number
  salarioPorEmpleado: number

  // Nivel de riesgo ARL por lote (cada lote puede tener diferente nivel)
  arlRiskLevel: ARLRiskLevel

  // Bonos asignados al lote (se aplican a todos)
  bonos: Partial<Record<BonusTypeEnum, number>>

  // Cálculos agregados
  totalSalarios: number
  totalBonos: number
  totalCompensacion: number

  // Estado UI
  expandido: boolean // Si se muestra desglosado
}

// ============================================
// DATOS DE EMPRESA
// ============================================

/**
 * Datos de la empresa para la cotización
 */
export interface CompanyData {
  razonSocial: string
  nit: string
  contactoNombre: string
  contactoEmail: string
  contactoTelefono: string
  sector: string
  obligadoParafiscales: boolean // legacy — kept for backward compat
  regimenParafiscales: RegimenParafiscales // 'general' | 'exonerado'
  cantidadEmpleados: number
}

// ============================================
// CONFIGURACIÓN DEL WIZARD
// ============================================

/**
 * Configuración de split salario/bonos
 */
export interface SplitConfig {
  tipo: '60/40' | 'personalizado'
  porcentajeSalario: number // 60-100
  porcentajeBonos: number // 0-40
  esValido: boolean
  warnings: string[]
}

/**
 * Configuración de tipos de bonos seleccionados
 */
export interface BonusSelectionConfig {
  modo: 'individual' | 'combinacion'
  tiposSeleccionados: BonusTypeEnum[]
  incluirDotacion: boolean
}

/**
 * Configuración de método de carga
 */
export interface DataLoadConfig {
  metodo: DataInputMethod
  permitirLotes: boolean
  permitirExcel: boolean
}

/**
 * Configuración completa del paso 0 (wizard inicial)
 */
export interface BonusConfigItem {
  mode: 'fijo' | 'variable'
  valor: number
}

export interface WizardConfiguration {
  split: SplitConfig
  bonusSelection: BonusSelectionConfig
  dataLoad: DataLoadConfig
  bonusConfig: Partial<Record<BonusTypeEnum, BonusConfigItem>>
}

// ============================================
// VALIDACIONES
// ============================================

/**
 * Resultado de validación individual (empleado)
 */
export interface ValidationResult {
  empleadoId: string
  empleadoNombre: string
  isValid: boolean
  errors: ValidationMessage[]
  warnings: ValidationMessage[]
}

/**
 * Mensaje de validación
 */
export interface ValidationMessage {
  code: ValidationCode
  severity: ValidationSeverity
  message: string
  field?: string // Campo relacionado (ej: 'bono_alimentacion')
  value?: number // Valor que causó el error
  limit?: number // Límite que se excedió
  sugerencia?: string // Cómo corregirlo
}

/**
 * Resumen de validación agregada (todos los empleados)
 */
export interface ValidationSummary {
  totalEmpleados: number
  empleadosValidos: number
  empleadosConErrores: number
  empleadosConWarnings: number

  // Errores críticos que bloquean
  erroresCriticos: ValidationMessage[]

  // Warnings que no bloquean
  warnings: ValidationMessage[]

  // Puede continuar al siguiente paso
  puedeAvanzar: boolean

  // Detalles por empleado
  resultadosPorEmpleado: ValidationResult[]
}

// ============================================
// CÁLCULOS Y TOTALES
// ============================================

/**
 * Totales por tipo de bono
 */
export interface BonusTotals {
  tipoBono: BonusTypeEnum
  totalEmpleados: number
  montoPorEmpleado: {
    min: number
    max: number
    promedio: number
  }
  montoTotal: number
  porcentajeDelTotal: number
}

/**
 * Resumen financiero consolidado
 */
export interface FinancialSummary {
  // Totales de compensación
  totalSalarios: number
  totalBonosMeraLiberalidad: number
  totalBonosAlimentacion: number
  totalBonosDotacion: number
  totalBonosViaticos: number
  totalBonosTotal: number // Incluye: mera liberalidad + alimentación + dotación + viáticos
  totalCompensacion: number

  // Distribución
  porcentajeSalarios: number
  porcentajeBonos: number

  // Cumplimiento de regla 60/40
  cumpleRegla6040: boolean
  ajusteNecesario?: {
    reducirBonos: number
    aumentarSalarios: number
  }

  // Validaciones específicas
  empleadosExcedenAlimentacion: number
  empleadosNoCumplenDotacion: number

  // Desglose por tipo de bono
  desglosePorTipo: BonusTotals[]
}

/**
 * Cálculo de comisiones Tikin
 */
export interface TikinCommission {
  // Mera Liberalidad
  montoBaseMeraLiberalidad: number
  porcentajeFee: number
  feeBaseMeraLiberalidad: number

  // Alimentación
  montoBaseAlimentacion: number
  feeBaseAlimentacion: number

  // Dotación (sin fee, es obligatoria)
  montoDotacion: number

  // Viáticos
  montoBaseViaticos: number
  feeBaseViaticos: number

  // Totales
  feeTotal: number
  iva: number
  totalConIva: number
}

/**
 * Estimación de ahorro (beneficio potencial)
 * Desglosado en 3 categorías: Seguridad Social, Parafiscales, Prestaciones Sociales
 */
export interface SavingsEstimate {
  // Ahorro total (SS + Parafiscales + Prestaciones)
  ahorroMensualEstimado: number
  ahorroAnualEstimado: number

  // Desglose por categoría (mensual)
  ahorroSeguridadSocial: number   // Salud + Pensión + ARL
  ahorroParafiscales: number      // SENA + ICBF + Caja Compensación
  ahorroPrestaciones: number      // Prima + Cesantías + Intereses + Vacaciones

  // Costo Tikin
  comisionTikinMensual: number
  comisionTikinAnual: number

  // Beneficio neto
  beneficioNetoMensual: number
  beneficioNetoAnual: number

  // Scenario comparison (costo empresa mensual)
  costoTradicionalMensual: number   // Traditional: total parafiscales + prestaciones
  costoConTikinMensual: number      // Tikin: total parafiscales + prestaciones

  // Desglose detallado por concepto (para tabla comparativa)
  detalleTradicional?: import('@/types/calculations').ParafiscalesBreakdown
  detalleTikin?: import('@/types/calculations').ParafiscalesBreakdown

  // Disclaimer
  esEstimacion: true
  factoresVariables: string[]
}

// ============================================
// DATOS DE EXCEL
// ============================================

/**
 * Configuración de mapeo de columnas Excel
 */
export interface ExcelColumnMapping {
  excelColumn: string // Nombre de columna en Excel
  systemField: keyof EmployeeBonos2 | BonusTypeEnum // Campo del sistema
  obligatorio: boolean
  ejemplo?: string
}

/**
 * Resultado de carga de Excel
 */
export interface ExcelLoadResult {
  nombreArchivo: string
  fechaCarga: Date
  totalFilas: number
  filasValidas: number
  filasConErrores: number

  // Mapeo usado
  mapeo: ExcelColumnMapping[]

  // Datos procesados
  empleados: EmployeeBonos2[]

  // Errores de parseo
  erroresParseo: Array<{
    fila: number
    columna: string
    valor: any
    error: string
  }>
}

// ============================================
// FLUJO DUAL
// ============================================

/**
 * Tipo de flujo de cotización
 * - beneficios_actuales: Reestructurar compensación actual (split 60/40)
 * - nuevos_beneficios: Agregar bonos sobre salario actual (aditivo)
 * - salario_integral: Evaluar conversión a salario integral (Art. 132 CST)
 */
export type FlujoTipo = 'beneficios_actuales' | 'nuevos_beneficios' | 'salario_integral'

// ============================================
// SALARIO INTEGRAL
// ============================================

/**
 * Empleado para flujo de salario integral
 * Solo necesita salario actual — el sistema calcula el resto
 */
export interface EmployeeIntegral {
  id: string
  nombre: string
  salarioActual: number // Salario mensual actual (total)
  cedula?: string
  cargo?: string
  origen: 'manual' | 'excel' | 'lote'
  loteId?: string

  // Nivel de riesgo ARL (heredado del lote)
  arlRiskLevel?: ARLRiskLevel
}

/**
 * Lote de empleados para flujo integral
 */
export interface LoteIntegral {
  id: string
  nombre: string
  cantidad: number
  salarioActualPorEmpleado: number

  // Nivel de riesgo ARL por lote
  arlRiskLevel: ARLRiskLevel

  expandido: boolean
}

/**
 * Resultado de cálculo integral por empleado
 *
 * Modelo: Salario actual → integral mínimo + bonos por la diferencia
 * Ejemplo: $25M → $18.5M integral + $6.5M bonos = $25M total
 * El empleado recibe lo mismo, el empleador ahorra en SS, parafiscales y prestaciones.
 */
export interface IntegralEmployeeResult {
  empleadoId: string
  empleadoNombre: string
  salarioActual: number

  // Estructura propuesta: integral mínimo + bonos
  estructuraPropuesta: {
    salarioIntegral: number       // Mínimo integral (~$18.5M)
    factorSalarial: number        // 70% del integral (IBC para SS/parafiscales)
    factorPrestacional: number    // 30% del integral (cubre prestaciones)
    montoBonos: number            // salarioActual - salarioIntegral
    compensacionTotal: number     // = salarioActual (no cambia para el empleado)
  }

  // Costo empleador — escenario actual (salario ordinario)
  costoActual: {
    salario: number               // = salarioActual
    seguridadSocial: number       // Salud + Pensión + ARL sobre 100%
    parafiscales: number          // SENA + ICBF + Caja sobre 100%
    prestaciones: number          // Prima + Cesantías + Intereses + Vacaciones (~21.83%)
    total: number
  }

  // Costo empleador — escenario propuesto (integral + bonos)
  costoPropuesto: {
    salarioIntegral: number       // Mínimo integral
    montoBonos: number            // Sin SS ni parafiscales
    seguridadSocial: number       // SS sobre IBC (70% del integral)
    parafiscales: number          // Parafiscales sobre IBC (70% del integral)
    prestaciones: number          // $0 — incluidas en factor prestacional 30%
    total: number                 // integral + bonos + SS + parafiscales
  }

  // Ahorro detallado del empleador (por categoría)
  ahorroEmpleador: {
    seguridadSocial: number       // Diferencia SS (sobre 100% vs sobre 70% integral)
    parafiscales: number          // Diferencia parafiscales
    prestaciones: number          // Todas las prestaciones se eliminan
    totalMensual: number
    totalAnual: number
    porcentaje: number            // % de reducción sobre costo actual
  }

  // Impacto para el empleado (recibe lo mismo, pero paga menos SS)
  impactoEmpleado: {
    descuentoSsActual: number     // 8% sobre salarioActual
    descuentoSsPropuesto: number  // 8% sobre IBC (70% del integral)
    ahorroSsEmpleado: number      // Diferencia — lo que el empleado ahorra en descuentos
    ingresoNetoActual: number     // salario - descuentos SS
    ingresoNetoPropuesto: number  // (integral - descuentos SS sobre IBC) + bonos
    diferenciaIngreso: number     // Positivo = gana más neto con la nueva estructura
  }

  elegibleParaIntegral: boolean   // salarioActual >= SALARIO_INTEGRAL_MINIMO
  razonNoElegible?: string
}

/**
 * Resumen financiero del flujo integral (agregado de todos los empleados)
 */
export interface IntegralFinancialSummary {
  totalEmpleados: number
  empleadosElegibles: number
  empleadosNoElegibles: number

  // Totales escenario actual
  totalCostoActualMensual: number
  totalCostoActualAnual: number

  // Totales escenario propuesto (integral + bonos)
  totalCostoPropuestoMensual: number
  totalCostoPropuestoAnual: number

  // Ahorro detallado agregado (mensual)
  ahorroDetalle: {
    seguridadSocial: number
    parafiscales: number
    prestaciones: number
  }

  // Ahorro total
  ahorroTotalMensual: number
  ahorroTotalAnual: number
  ahorroPorcentaje: number

  // Comisión Tikin (% del ahorro)
  comisionTikin: IntegralTikinCommission

  // Beneficio neto (ahorro - comisión)
  beneficioNetoMensual: number
  beneficioNetoAnual: number

  // Detalle por empleado
  resultadosPorEmpleado: IntegralEmployeeResult[]
}

/**
 * Comisión Tikin para flujo integral
 * Se cobra como % del ahorro generado al empleador
 */
export interface IntegralTikinCommission {
  ahorroBase: number // Ahorro mensual total del empleador
  porcentajeFee: number // % del ahorro (ej: 0.20 = 20%)
  feeMensual: number // ahorroBase × porcentajeFee
  iva: number // feeMensual × 19%
  totalConIvaMensual: number // feeMensual + iva
  totalConIvaAnual: number // totalConIvaMensual × 12
}

// ============================================
// ESTADO DEL WIZARD
// ============================================

/**
 * Estado completo del wizard Bonos 2.0
 */
export interface Bonos2WizardState {
  // Paso actual (0-4): Flujo → Empresa → Bonos → Datos → Resultados
  pasoActual: number

  // Paso 0: Selección de flujo
  flujoSeleccionado: FlujoTipo | null

  // Configuración
  configuracion: WizardConfiguration

  // Datos de entrada
  lotes: LoteBonos2[]
  empleados: EmployeeBonos2[]
  archivoExcel?: ExcelLoadResult

  // Validaciones
  validacion: ValidationSummary | null

  // Resultados y cotización
  resumenFinanciero: FinancialSummary | null
  comisionesTikin: TikinCommission | null
  ahorrosEstimados: SavingsEstimate | null

  // Datos de empresa
  datosEmpresa: CompanyData | null

  // Salario Integral (solo usado cuando flujoSeleccionado === 'salario_integral')
  empleadosIntegral: EmployeeIntegral[]
  lotesIntegral: LoteIntegral[]
  resumenIntegral: IntegralFinancialSummary | null

  // Metadata
  fechaCreacion: Date
  ultimaActualizacion: Date
  guardadoEnBD: boolean
  cotizacionId?: string
}

// ============================================
// PERSISTENCIA EN BASE DE DATOS
// ============================================

/**
 * Registro de cotización en Supabase
 */
export interface CotizacionBonos2DB {
  id: string
  user_id: string | null // Preparado para auth
  created_at: string
  updated_at: string

  // Datos de empresa
  company_name: string
  contact_name: string
  email: string
  phone: string
  nit: string
  arl_risk_level: string
  obligado_parafiscales: boolean

  // Configuración
  split_config: SplitConfig
  bonus_types_selected: BonusTypeEnum[]
  data_input_method: DataInputMethod

  // Totales
  total_employees: number
  total_salary: number
  total_bonuses: number
  total_compensation: number

  // Resumen financiero (JSON)
  financial_summary: FinancialSummary

  // Comisiones
  tikin_commission: TikinCommission

  // Estado
  status: 'pending' | 'accepted' | 'rejected'

  // Metadata
  notes?: string
}

/**
 * Items de la cotización (empleados)
 */
export interface CotizacionItemBonos2DB {
  id: string
  cotizacion_id: string
  created_at: string

  // Datos del empleado
  employee_data: EmployeeBonos2

  // Validaciones
  validation_result: ValidationResult

  // Lote al que pertenece (si aplica)
  lote_id?: string
  lote_name?: string
}

/**
 * Archivos Excel cargados
 */
export interface ArchivoExcelBonos2DB {
  id: string
  cotizacion_id: string
  uploaded_at: string

  // Archivo
  filename: string
  file_size: number

  // Procesamiento
  column_mapping: ExcelColumnMapping[]
  rows_processed: number
  rows_valid: number
  rows_errors: number

  // Resultado
  load_result: ExcelLoadResult
}

// ============================================
// EXPORTACIÓN
// ============================================

/**
 * Configuración de exportación
 */
export interface ExportConfig {
  formato: 'excel' | 'csv'
  incluirDetalleEmpleados: boolean
  incluirValidaciones: boolean
  incluirResumenFinanciero: boolean
  incluirComisiones: boolean
}

/**
 * Resultado de exportación
 */
export interface ExportResult {
  success: boolean
  fileName: string
  filePath?: string
  blob?: Blob
  error?: string
}

// ============================================
// PLANTILLAS Y EJEMPLOS
// ============================================

/**
 * Plantilla de Excel descargable
 */
export interface ExcelTemplate {
  nombre: string
  descripcion: string
  tiposBono: BonusTypeEnum[]
  columnas: string[]
  ejemploFilas: number
  descargarUrl: string
}
