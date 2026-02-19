/**
 * Cálculo del tope del 40% — Ley 1393/2010 Art. 30
 *
 * Marco legal:
 * - Los pagos no salariales no pueden exceder el 40% del total de la remuneración
 * - En salario integral, el 30% factor prestacional ya es no salarial
 * - ML + Alimentación también son no salariales → sujetos al tope
 * - Repartición de Utilidades, Viáticos, Dotación → EXENTOS del tope
 *
 * Fórmula:
 *   (FP + B_cap) ≤ 0.40 × (SI + B_cap + R)
 *
 * Donde:
 *   FP = Factor Prestacional = 30% × SI
 *   B_cap = Bonos sujetos al tope (ML + Alimentación)
 *   R = Bonos exentos del tope (Repartición + Viáticos + Dotación)
 *   SI = Salario Integral
 *
 * Resolviendo para B_cap_max:
 *   0.30×SI + B_cap ≤ 0.40×SI + 0.40×B_cap + 0.40×R
 *   0.60×B_cap ≤ 0.10×SI + 0.40×R
 *   B_cap_max = (0.10 × SI + 0.40 × R) / 0.60
 */

import { INTEGRAL_FACTOR_PRESTACIONAL } from './constants'

/** Resultado del análisis de cumplimiento Ley 1393/2010 */
export interface Ley1393Result {
  /** Factor prestacional (30% del SI) */
  factorPrestacional: number
  /** Total no salarial = FP + B_cap */
  noSalarialTotal: number
  /** Total devengado = SI + B_cap + R */
  totalDevengado: number
  /** Porcentaje no salarial sobre devengado */
  noSalarialPct: number
  /** Máximo permitido de bonos sujetos al tope */
  limiteBonosCap: number
  /** Espacio restante antes de alcanzar el tope */
  holgura: number
  /** Si cumple con el tope del 40% */
  cumple: boolean
  /** Monto que excede el tope (0 si cumple) */
  exceso: number
}

/**
 * Calcula el máximo de bonos sujetos al tope (ML + Alimentación) permitido
 * por la Ley 1393/2010 Art. 30.
 *
 * @param salarioIntegral - Salario integral mensual del empleado
 * @param bonosExentos - Suma de bonos exentos del tope (Repartición + Viáticos + Dotación) por empleado
 * @returns Máximo de ML + Alimentación permitido por empleado
 */
export function calcularCapMaximo(
  salarioIntegral: number,
  bonosExentos: number = 0
): number {
  // B_cap_max = (0.10 × SI + 0.40 × R) / 0.60
  const cap = (0.10 * salarioIntegral + 0.40 * bonosExentos) / 0.60
  return Math.max(0, cap)
}

/**
 * Calcula el cumplimiento completo de la Ley 1393/2010 Art. 30
 * para un empleado con salario integral.
 *
 * @param salarioIntegral - Salario integral mensual
 * @param bonosCapados - Suma de ML + Alimentación (por empleado)
 * @param bonosExentos - Suma de Repartición + Viáticos + Dotación (por empleado)
 */
export function calcularLimiteLey1393(
  salarioIntegral: number,
  bonosCapados: number,
  bonosExentos: number = 0
): Ley1393Result {
  const factorPrestacional = salarioIntegral * INTEGRAL_FACTOR_PRESTACIONAL
  const noSalarialTotal = factorPrestacional + bonosCapados
  const totalDevengado = salarioIntegral + bonosCapados + bonosExentos
  const noSalarialPct = totalDevengado > 0
    ? (noSalarialTotal / totalDevengado) * 100
    : 0

  const limiteBonosCap = calcularCapMaximo(salarioIntegral, bonosExentos)
  const holgura = Math.max(0, limiteBonosCap - bonosCapados)
  const cumple = bonosCapados <= limiteBonosCap
  const exceso = cumple ? 0 : bonosCapados - limiteBonosCap

  return {
    factorPrestacional,
    noSalarialTotal,
    totalDevengado,
    noSalarialPct,
    limiteBonosCap,
    holgura,
    cumple,
    exceso
  }
}
