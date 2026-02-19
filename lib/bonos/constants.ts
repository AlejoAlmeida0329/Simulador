/**
 * Constantes legales y de negocio para el Simulador de Bonos 2.0
 * Valores actualizados para Colombia 2026
 */

// ============================================
// VALORES LEGALES (actualizables anualmente)
// ============================================

/**
 * Salario Mínimo Mensual Legal Vigente (SMMLV) 2026
 * Decretos 1469 y 1470 del 29 de diciembre de 2025
 * Aumento del 23% respecto a 2025 ($1.423.500)
 */
export const SMMLV_2026 = 1_750_905

/**
 * Auxilio de Transporte 2026
 * Decreto 1470 del 29 de diciembre de 2025
 */
export const AUXILIO_TRANSPORTE_2026 = 249_095

/**
 * Valor de la Unidad de Valor Tributario (UVT) 2026
 * Resolución 000238 de la DIAN, 15 de diciembre de 2025
 * Variación IPC 5.17% (oct 2024 - oct 2025)
 */
export const UVT_2026 = 52_374

/**
 * Límite de bonos de alimentación por empleado
 * Máximo 41 UVT mensuales (Art. 387-1 E.T.)
 */
export const MAX_UVT_ALIMENTACION = 41
export const LIMITE_ALIMENTACION_MENSUAL = MAX_UVT_ALIMENTACION * UVT_2026 // $2.147.334

/**
 * Límite para bono de dotación (Art. 230 CST)
 * Solo aplica a empleados con salario menor a 2 SMMLV
 */
export const LIMITE_DOTACION_SMMLV = 2
export const SALARIO_MAXIMO_DOTACION = LIMITE_DOTACION_SMMLV * SMMLV_2026 // $3.501.810

// ============================================
// SALARIO INTEGRAL (Art. 132 CST)
// ============================================

/**
 * Salario Mínimo Integral 2026 (Art. 132 CST)
 * = 13 × SMMLV (10 SMMLV base + 3 SMMLV factor prestacional)
 * "No podrá ser inferior a 10 SMMLV más el factor prestacional (min. 30%)"
 * 13 × $1.750.905 = $22.761.765
 */
export const FACTOR_SALARIOS_INTEGRAL = 13
export const SALARIO_INTEGRAL_MINIMO = FACTOR_SALARIOS_INTEGRAL * SMMLV_2026 // $22,761,765

/**
 * Factor salarial: 70% del salario integral
 * Base para seguridad social y parafiscales (Ley 100/1993, Art. 18)
 */
export const INTEGRAL_FACTOR_SALARIAL = 0.70

/**
 * Factor prestacional: 30% del salario integral
 * Incluye: prima, cesantías, intereses sobre cesantías, vacaciones
 */
export const INTEGRAL_FACTOR_PRESTACIONAL = 0.30

/**
 * Descuentos de seguridad social del empleado
 * Salud: 4% + Pensión: 4% = 8% sobre IBC
 */
export const EMPLEADO_SALUD_RATE = 0.04
export const EMPLEADO_PENSION_RATE = 0.04
export const EMPLEADO_SS_RATE = EMPLEADO_SALUD_RATE + EMPLEADO_PENSION_RATE // 8%

// ============================================
// CONFIGURACIÓN DE SPLIT SALARIO/BONO
// ============================================

/**
 * Configuración por defecto del split 60/40
 * 60% salario base (parafiscales) / 40% bonos (sin parafiscales)
 */
export const DEFAULT_SALARY_PERCENTAGE = 60
export const DEFAULT_BONUS_PERCENTAGE = 40

/**
 * Límites permitidos para configuración personalizada
 * Mínimo 60% debe ser salario base (regla legal)
 */
export const MIN_SALARY_PERCENTAGE = 60
export const MAX_SALARY_PERCENTAGE = 100

/**
 * Validación: el 60% del salario no puede ser menor a 1 SMMLV
 */
export const MIN_SALARY_BASE_SMMLV = 1

/**
 * Salario mínimo para participar en esquema de bonos.
 * Regla de negocio: $2,500,000 COP.
 * Referencia: Ley 1393/2010 Art. 30 — el 60% de base salarial
 * no puede ser inferior a 1 SMMLV ($1,750,905).
 */
export const MIN_SALARIO_BONOS = 2_500_000

// ============================================
// TIPOS DE BONOS DISPONIBLES
// ============================================

/**
 * Categorías de bonos según su naturaleza legal
 */
export enum BonusCategory {
  MERA_LIBERALIDAD = 'mera_liberalidad',
  ALIMENTACION = 'alimentacion',
  DOTACION = 'dotacion',
  VIATICOS = 'viaticos',
  REPARTICION_UTILIDADES = 'reparticion_utilidades'
}

/**
 * Tipos de bonos disponibles en el sistema
 */
export enum BonusTypeEnum {
  // Mera Liberalidad (todos suman al 40%)
  INCENTIVO = 'incentivo',
  NAVIDAD = 'navidad',
  CUMPLEANOS = 'cumpleanos',
  MOVILIDAD = 'movilidad',
  VIATICOS = 'viaticos',
  SALUD_BIENESTAR = 'salud_bienestar',
  RECREACION = 'recreacion',
  VIVIENDA = 'vivienda',
  CONECTIVIDAD = 'conectividad',

  // Alimentación (suma al 40%, tope 41 UVT por empleado)
  ALIMENTACION = 'alimentacion',

  // Dotación (obligatorio, solo <2 SMMLV)
  DOTACION = 'dotacion',

  // Repartición de Utilidades (no suma al 40%)
  REPARTICION_UTILIDADES = 'reparticion_utilidades'
}

/**
 * Metadatos de cada tipo de bono
 */
export interface BonusTypeMetadata {
  id: BonusTypeEnum
  nombre: string
  descripcion: string
  categoria: BonusCategory
  icono: string
  color: string
  reglasEspeciales?: string[]
}

export const BONUS_TYPES_METADATA: Record<BonusTypeEnum, BonusTypeMetadata> = {
  [BonusTypeEnum.INCENTIVO]: {
    id: BonusTypeEnum.INCENTIVO,
    nombre: 'Bono de Incentivo',
    descripcion: 'Bonificación por cumplimiento de metas y desempeño',
    categoria: BonusCategory.MERA_LIBERALIDAD,
    icono: '🎯',
    color: 'blue'
  },
  [BonusTypeEnum.NAVIDAD]: {
    id: BonusTypeEnum.NAVIDAD,
    nombre: 'Bono de Navidad',
    descripcion: 'Bonificación especial de fin de año',
    categoria: BonusCategory.MERA_LIBERALIDAD,
    icono: '🎄',
    color: 'red'
  },
  [BonusTypeEnum.CUMPLEANOS]: {
    id: BonusTypeEnum.CUMPLEANOS,
    nombre: 'Bono de Cumpleaños',
    descripcion: 'Bonificación por celebración de cumpleaños',
    categoria: BonusCategory.MERA_LIBERALIDAD,
    icono: '🎂',
    color: 'pink'
  },
  [BonusTypeEnum.MOVILIDAD]: {
    id: BonusTypeEnum.MOVILIDAD,
    nombre: 'Bono de Movilidad',
    descripcion: 'Auxilio para transporte y desplazamiento',
    categoria: BonusCategory.MERA_LIBERALIDAD,
    icono: '🚗',
    color: 'green'
  },
  [BonusTypeEnum.VIATICOS]: {
    id: BonusTypeEnum.VIATICOS,
    nombre: 'Viáticos',
    descripcion: 'Compensación por gastos de viaje y estadía',
    categoria: BonusCategory.VIATICOS,
    icono: '✈️',
    color: 'indigo',
    reglasEspeciales: ['Requiere soporte documental para deducción fiscal']
  },
  [BonusTypeEnum.SALUD_BIENESTAR]: {
    id: BonusTypeEnum.SALUD_BIENESTAR,
    nombre: 'Bono Salud y Bienestar',
    descripcion: 'Auxilio para actividades de salud y bienestar',
    categoria: BonusCategory.MERA_LIBERALIDAD,
    icono: '💪',
    color: 'teal'
  },
  [BonusTypeEnum.RECREACION]: {
    id: BonusTypeEnum.RECREACION,
    nombre: 'Bono de Recreación',
    descripcion: 'Auxilio para actividades recreativas y culturales',
    categoria: BonusCategory.MERA_LIBERALIDAD,
    icono: '🎨',
    color: 'purple'
  },
  [BonusTypeEnum.VIVIENDA]: {
    id: BonusTypeEnum.VIVIENDA,
    nombre: 'Auxilio de Vivienda',
    descripcion: 'Apoyo para gastos relacionados con vivienda',
    categoria: BonusCategory.MERA_LIBERALIDAD,
    icono: '🏠',
    color: 'orange'
  },
  [BonusTypeEnum.CONECTIVIDAD]: {
    id: BonusTypeEnum.CONECTIVIDAD,
    nombre: 'Bono de Conectividad',
    descripcion: 'Auxilio para internet y telecomunicaciones',
    categoria: BonusCategory.MERA_LIBERALIDAD,
    icono: '📱',
    color: 'cyan'
  },
  [BonusTypeEnum.ALIMENTACION]: {
    id: BonusTypeEnum.ALIMENTACION,
    nombre: 'Bono de Alimentación',
    descripcion: 'Auxilio para gastos de alimentación',
    categoria: BonusCategory.ALIMENTACION,
    icono: '🍽️',
    color: 'yellow',
    reglasEspeciales: ['Máximo 41 UVT por empleado ($2.147.334 en 2026) — Art. 387-1 E.T.']
  },
  [BonusTypeEnum.DOTACION]: {
    id: BonusTypeEnum.DOTACION,
    nombre: 'Dotación',
    descripcion: 'Dotación obligatoria (empleados <2 SMMLV)',
    categoria: BonusCategory.DOTACION,
    icono: '👕',
    color: 'gray',
    reglasEspeciales: [
      'Solo aplica a empleados con salario menor a 2 SMMLV',
      'Obligatoria por ley para trabajadores que califiquen'
    ]
  },
  [BonusTypeEnum.REPARTICION_UTILIDADES]: {
    id: BonusTypeEnum.REPARTICION_UTILIDADES,
    nombre: 'Repartición de Utilidades',
    descripcion: 'Bonificación por repartición de utilidades de la empresa',
    categoria: BonusCategory.REPARTICION_UTILIDADES,
    icono: '📊',
    color: 'emerald',
    reglasEspeciales: [
      'No constituye salario (Art. 128 CST)',
      'No suma al límite del 40% de compensación no salarial'
    ]
  }
}

// ============================================
// FEES Y COMISIONES TIKIN
// ============================================

/**
 * Fee de Tikin para bonos de mera liberalidad
 * Variable según monto total dispersado
 */
export interface FeeRange {
  min: number
  max: number
  fee: number // Porcentaje decimal (0.04 = 4%)
  label: string
}

export const FEE_MERA_LIBERALIDAD_RANGES: FeeRange[] = [
  {
    min: 0,
    max: 80_000_000,
    fee: 0.040,
    label: '0 - $80M'
  },
  {
    min: 80_000_001,
    max: 150_000_000,
    fee: 0.035,
    label: '$80M - $150M'
  },
  {
    min: 150_000_001,
    max: 500_000_000,
    fee: 0.025,
    label: '$150M - $500M'
  },
  {
    min: 500_000_001,
    max: 1_000_000_000,
    fee: 0.018,
    label: '$500M - $1.000M'
  },
  {
    min: 1_000_000_001,
    max: Infinity,
    fee: 0.018,
    label: 'Más de $1.000M'
  }
]

/**
 * Fee de Tikin para bonos de alimentación
 * Rangos variables según monto dispersado
 */
export const FEE_ALIMENTACION = 0.0125 // 1.25% (legacy fallback)
export const FEE_ALIMENTACION_RANGES: FeeRange[] = [
  { min: 0, max: Infinity, fee: 0.0125, label: 'Tarifa base' }
]

/**
 * Fee de Tikin para dotación
 * Rangos variables según monto dispersado
 */
export const FEE_DOTACION = 0 // 0% (legacy fallback)
export const FEE_DOTACION_RANGES: FeeRange[] = [
  { min: 0, max: Infinity, fee: 0, label: 'Tarifa base' }
]

/**
 * Fee de Tikin para viáticos
 * Rangos variables según monto dispersado
 */
export const FEE_VIATICOS = 0.0125 // 1.25% (legacy fallback)
export const FEE_VIATICOS_RANGES: FeeRange[] = [
  { min: 0, max: Infinity, fee: 0.0125, label: 'Tarifa base' }
]

/**
 * IVA aplicable sobre los fees
 */
export const IVA_RATE = 0.19 // 19%

// ============================================
// MÉTODOS DE ENTRADA DE DATOS
// ============================================

export enum DataInputMethod {
  LOTES = 'lotes',           // Ingreso por lotes (cantidad + salario)
  EXCEL = 'excel'            // Carga desde archivo Excel
}

// ============================================
// CONFIGURACIÓN DE VALIDACIONES
// ============================================

/**
 * Severidad de las validaciones
 */
export enum ValidationSeverity {
  ERROR = 'error',     // Bloquea el flujo, debe corregirse
  WARNING = 'warning', // No bloquea, pero advierte al usuario
  INFO = 'info'        // Información adicional
}

/**
 * Códigos de error/warning para validaciones
 */
export enum ValidationCode {
  // Errores de Split 60/40
  EXCEDE_40_BONOS = 'EXCEDE_40_BONOS',
  SALARIO_MENOR_1_SMMLV = 'SALARIO_MENOR_1_SMMLV',

  // Errores de Alimentación
  EXCEDE_41_UVT_ALIMENTACION = 'EXCEDE_41_UVT_ALIMENTACION',

  // Errores de Dotación
  SALARIO_EXCEDE_2_SMMLV_DOTACION = 'SALARIO_EXCEDE_2_SMMLV_DOTACION',

  // Viáticos
  VIATICOS_SIN_SOPORTE = 'VIATICOS_SIN_SOPORTE',

  // Empresa
  EMPRESA_OBLIGADA_PARAFISCALES = 'EMPRESA_OBLIGADA_PARAFISCALES',
  EMPRESA_MENOS_10_EMPLEADOS = 'EMPRESA_MENOS_10_EMPLEADOS',

  // Warnings
  CONFIGURACION_PERSONALIZADA = 'CONFIGURACION_PERSONALIZADA',
  CERCA_LIMITE_ALIMENTACION = 'CERCA_LIMITE_ALIMENTACION'
}

/**
 * Mensajes de validación por código
 */
export const VALIDATION_MESSAGES: Record<ValidationCode, string> = {
  [ValidationCode.EXCEDE_40_BONOS]: 'El total de bonos supera el 40% permitido',
  [ValidationCode.SALARIO_MENOR_1_SMMLV]: 'El 60% del salario base es menor a 1 SMMLV',
  [ValidationCode.EXCEDE_41_UVT_ALIMENTACION]: 'Supera el límite de 41 UVT por empleado',
  [ValidationCode.SALARIO_EXCEDE_2_SMMLV_DOTACION]: 'El salario supera 2 SMMLV (no aplica dotación)',
  [ValidationCode.VIATICOS_SIN_SOPORTE]: 'Los viáticos requieren soporte documental para deducción fiscal',
  [ValidationCode.EMPRESA_OBLIGADA_PARAFISCALES]: 'La empresa está obligada al pago de parafiscales (SENA, ICBF, Caja)',
  [ValidationCode.EMPRESA_MENOS_10_EMPLEADOS]: 'Empresas con menos de 10 empleados pueden tener exenciones parciales de parafiscales',
  [ValidationCode.CONFIGURACION_PERSONALIZADA]: 'Configuración personalizada (diferente a 60/40 recomendado)',
  [ValidationCode.CERCA_LIMITE_ALIMENTACION]: 'Cerca del límite de 41 UVT (>90%)'
}

// ============================================
// CONFIGURACIÓN DE EXCEL
// ============================================

/**
 * Nombres de columnas aceptados para mapeo de Excel
 */
export const EXCEL_COLUMN_MAPPINGS = {
  salario: ['salario', 'sueldo', 'salario_base', 'basico', 'salary', 'salario mensual'],
  salarioActual: ['salario_actual', 'salario actual', 'salario', 'sueldo', 'salary'],
  nombre: ['nombre', 'empleado', 'trabajador', 'name', 'fullname', 'nombre completo'],
  cedula: ['cedula', 'cc', 'documento', 'identificacion', 'id', 'nro documento'],
  cargo: ['cargo', 'puesto', 'position', 'title', 'cargo actual'],
  arl: ['arl', 'nivel_arl', 'riesgo_arl', 'nivel arl', 'arl nivel', 'riesgo', 'nivel de riesgo'],

  // Bonos específicos
  bono_alimentacion: ['bono_alimentacion', 'alimentacion', 'auxilio_alimentacion'],
  bono_incentivo: ['bono_incentivo', 'incentivo', 'bonificacion'],
  bono_movilidad: ['bono_movilidad', 'movilidad', 'transporte'],
  bono_dotacion: ['dotacion', 'vestido', 'uniforme']
}

/**
 * Tamaño máximo de archivo Excel (10MB)
 */
export const MAX_EXCEL_FILE_SIZE = 10 * 1024 * 1024

/**
 * Número máximo de filas soportadas
 */
export const MAX_EXCEL_ROWS = 10_000

/**
 * Tamaño de chunk para procesamiento en web worker
 */
export const EXCEL_CHUNK_SIZE = 500

// ============================================
// CONFIGURACIÓN DE PERFORMANCE
// ============================================

/**
 * Umbral para activar web worker
 * Si el archivo tiene más filas, se procesa en background
 */
export const WEB_WORKER_THRESHOLD = 1_000

/**
 * Timeout para validaciones pesadas (ms)
 */
export const VALIDATION_TIMEOUT = 5_000
