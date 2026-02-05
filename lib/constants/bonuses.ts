/**
 * Constantes para configuración de bonos y distribución salario/bono
 *
 * Establece los límites permitidos según normativa laboral colombiana
 * y requisitos del modelo de negocio Tikin
 */

/**
 * Porcentaje mínimo que debe ser salario (60%)
 * Máximo 40% puede ser bono de mera liberalidad
 */
export const SALARY_PERCENTAGE_MIN = 60

/**
 * Porcentaje máximo que puede ser salario (90%)
 * Permite mayor flexibilidad en la distribución
 */
export const SALARY_PERCENTAGE_MAX = 90

/**
 * Valor inicial por defecto (70% salario, 30% bono)
 * Balance óptimo entre ahorro en parafiscales y flexibilidad
 */
export const SALARY_PERCENTAGE_DEFAULT = 70

/**
 * Límite legal para bonos de alimentación exentos de parafiscales
 * Valor actualizado 2025 según normativa colombiana
 */
export const FOOD_BONUS_LEGAL_LIMIT = 2099200

/**
 * Salario mínimo legal mensual vigente (2025)
 * Utilizado para validaciones de nómina
 */
export const MIN_SALARY = 2450000
