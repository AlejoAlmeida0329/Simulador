// ============================================
// TIPOS PARA SISTEMA DE BONOS
// ============================================

/**
 * Tipo de bono que la empresa desea pagar
 */
export type BonusType = 'mera_liberalidad' | 'alimentacion' | 'ambos'

/**
 * Constantes legales
 */
export const MAX_UVT_ALIMENTACION = 41
export const VALOR_UVT_2025 = 51200 // Actualizar anualmente
export const LIMITE_ALIMENTACION_MENSUAL = MAX_UVT_ALIMENTACION * VALOR_UVT_2025 // $2.099.200

/**
 * Configuración de fees para bono de mera liberalidad
 * Fee variable según rango del monto total dispersado
 */
export interface FeeRange {
  min: number
  max: number
  fee: number // Porcentaje decimal (0.04 = 4%)
}

export const FEE_MERA_LIBERALIDAD_RANGES: FeeRange[] = [
  { min: 0, max: 80_000_000, fee: 0.040 },           // 4.0%
  { min: 80_000_001, max: 150_000_000, fee: 0.035 }, // 3.5%
  { min: 150_000_001, max: 500_000_000, fee: 0.025 },// 2.5%
  { min: 500_000_001, max: 1_000_000_000, fee: 0.018 }, // 1.8%
  { min: 1_000_000_001, max: Infinity, fee: 0.018 }  // 1.8%
]

export const FEE_ALIMENTACION = 0.0125 // 1.25% fijo
export const IVA = 0.19 // 19%

/**
 * Empleado individual
 * Puede venir de archivo Excel o agregado manualmente
 */
export interface Employee {
  id: string // UUID único
  nombre: string
  salario: number
  cedula?: string // Opcional
  cargo?: string // Opcional
  origen: 'manual' | 'archivo' // Cómo fue agregado
  loteId?: string // Si pertenece a un lote
}

/**
 * Lote de empleados agregados manualmente
 * Grupo de N empleados con el mismo salario
 */
export interface EmployeeBatch {
  id: string // UUID único
  cantidad: number
  salarioPorEmpleado: number
  empleados: Employee[] // Generados automáticamente
  expandido: boolean // Si se muestra desglosado en la tabla
}

/**
 * Asignación de bono a un empleado
 */
export interface BonusAssignment {
  empleadoId: string
  empleadoNombre: string
  salario: number
  montoBono: number
  excedeLimit?: boolean // Para bonos de alimentación
  exceso?: number // Cantidad que excede el límite
}

/**
 * Configuración de un tipo de bono
 */
export interface BonusConfig {
  tipo: 'mera_liberalidad' | 'alimentacion'
  montoTotal: number // Total a distribuir
  metodoDistribucion: 'proporcional' | 'fijo' | 'personalizado'
  asignaciones: BonusAssignment[]

  // Cálculos de fee
  feePercentage: number
  feeAmount: number
  iva: number
  totalConFee: number

  // Validación (solo para alimentación)
  empleadosExcedenLimite?: number
  excesoTotal?: number
  validado: boolean
}

/**
 * Información de la empresa
 * Reutiliza CompanyData pero agregamos campos adicionales
 */
export interface BonusCompanyData {
  companyName: string
  contactName: string
  email: string
  phone: string
  nit: string // Obligatorio para bonos
}

/**
 * Estado completo del flujo de bonos
 */
export interface BonusFlowState {
  // Paso 1: Tipo de bono
  tipoSeleccionado?: BonusType

  // Paso 2: Información de empresa
  companyData?: BonusCompanyData

  // Paso 3: Empleados agregados
  empleados: Employee[]
  lotes: EmployeeBatch[]
  totalEmpleados: number

  // Paso 4: Configuración de bonos
  configMeraLiberalidad?: BonusConfig
  configAlimentacion?: BonusConfig

  // Estado general
  pasoActual: number
  tabActivo?: 'mera_liberalidad' | 'alimentacion' // Solo si es "ambos"
}

/**
 * Resultado de validación de tope de alimentación
 */
export interface ValidationResult {
  valido: boolean
  errores: Array<{
    empleadoId: string
    empleadoNombre: string
    montoAsignado: number
    limitePermitido: number
    exceso: number
  }>
  totalExceso: number
}

/**
 * Resumen ejecutivo para confirmación final
 */
export interface BonusSummary {
  // Bono de mera liberalidad
  meraLiberalidad?: {
    empleadosBeneficiados: number
    montoTotalBonos: number
    fee: number
    iva: number
    subtotal: number
  }

  // Bono de alimentación
  alimentacion?: {
    empleadosBeneficiados: number
    montoTotalBonos: number
    fee: number
    iva: number
    subtotal: number
    todosValidados: boolean
  }

  // Total consolidado
  totalGeneral: number
}
