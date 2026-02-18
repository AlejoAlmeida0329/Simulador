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
 * 41 UVT × $52.374 = $2.147.334 (Art. 387-1 E.T.)
 * Valor actualizado 2026 — Resolución 000238 DIAN
 */
export const FOOD_BONUS_LEGAL_LIMIT = 2_147_334

/**
 * Salario mínimo para validaciones de nómina en cotizador
 * Corresponde a SMMLV + Auxilio de Transporte 2026
 * Decretos 1469/1470 del 29-dic-2025
 */
export const MIN_SALARY = 2_000_000
