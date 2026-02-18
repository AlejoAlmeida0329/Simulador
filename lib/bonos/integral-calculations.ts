/**
 * Cálculos para flujo de Salario Integral + Bonos
 *
 * Modelo:
 * - Empleado gana $X actualmente como salario ordinario
 * - Se recomienda: dejar el mínimo integral (~$18.5M) + la diferencia como bonos
 * - Ejemplo: $25M → $18.5M integral + $6.5M bonos = $25M total (el empleado recibe lo mismo)
 *
 * Ahorros empleador (3 fuentes):
 * 1. Seguridad Social: se paga sobre 70% del integral (no 100% del salario original)
 * 2. Parafiscales: se pagan sobre 70% del integral (no 100% del salario original)
 * 3. Prestaciones: $0 — quedan incluidas en el factor prestacional del 30%
 *
 * Beneficio empleado:
 * - Recibe la misma compensación total ($25M)
 * - Paga menos en descuentos de SS (8% sobre 70% del integral, no 8% sobre $25M)
 * - Resultado: más ingreso neto mensual
 *
 * Tikin cobra % del ahorro generado
 */

import {
  SALARIO_INTEGRAL_MINIMO,
  INTEGRAL_FACTOR_SALARIAL,
  FEE_SALARIO_INTEGRAL,
  IVA_RATE,
  EMPLEADO_SS_RATE
} from './constants'

import {
  HEALTH_RATE,
  PENSION_RATE,
  ARL_RATES,
  SENA_RATE,
  ICBF_RATE,
  CAJA_RATE,
  PRESTACIONES_RATE,
  UMBRAL_EXONERACION,
  ARLRiskLevel
} from '@/lib/constants/parafiscales'

import type {
  EmployeeIntegral,
  IntegralEmployeeResult,
  IntegralFinancialSummary,
  IntegralTikinCommission,
  RegimenParafiscales
} from './types'

/**
 * Calcula el resultado integral + bonos para un empleado individual
 */
export function calculateIntegralForEmployee(
  empleado: EmployeeIntegral,
  arlRiskLevel?: ARLRiskLevel,
  regimen?: RegimenParafiscales
): IntegralEmployeeResult {
  const salarioActual = empleado.salarioActual
  const effectiveArl = empleado.arlRiskLevel || arlRiskLevel || 'III'
  const arlRate = ARL_RATES[effectiveArl]

  // Exemption for current scenario (100% salary as base)
  const isExoneradoActual = regimen === 'exonerado' && salarioActual < UMBRAL_EXONERACION
  const healthRateActual = isExoneradoActual ? 0 : HEALTH_RATE
  const senaRateActual = isExoneradoActual ? 0 : SENA_RATE
  const icbfRateActual = isExoneradoActual ? 0 : ICBF_RATE

  const ssEmpleadorRate = healthRateActual + PENSION_RATE + arlRate
  const parafiscalesRate = senaRateActual + icbfRateActual + CAJA_RATE

  // ============================================
  // ESCENARIO ACTUAL (salario ordinario)
  // ============================================
  const ssActual = salarioActual * ssEmpleadorRate
  const parafiscalesActual = salarioActual * parafiscalesRate
  const prestacionesActual = salarioActual * PRESTACIONES_RATE
  const costoTotalActual = salarioActual + ssActual + parafiscalesActual + prestacionesActual

  // ============================================
  // ELEGIBILIDAD
  // ============================================
  const salarioIntegral = SALARIO_INTEGRAL_MINIMO
  const elegible = salarioActual >= salarioIntegral

  if (!elegible) {
    // Empleado no elegible — retornar estructura vacía
    const descuentoSsActual = salarioActual * EMPLEADO_SS_RATE
    return {
      empleadoId: empleado.id,
      empleadoNombre: empleado.nombre,
      salarioActual,
      estructuraPropuesta: {
        salarioIntegral: 0,
        factorSalarial: 0,
        factorPrestacional: 0,
        montoBonos: 0,
        compensacionTotal: 0
      },
      costoActual: {
        salario: salarioActual,
        seguridadSocial: ssActual,
        parafiscales: parafiscalesActual,
        prestaciones: prestacionesActual,
        total: costoTotalActual
      },
      costoPropuesto: {
        salarioIntegral: 0,
        montoBonos: 0,
        seguridadSocial: 0,
        parafiscales: 0,
        prestaciones: 0,
        total: 0
      },
      ahorroEmpleador: {
        seguridadSocial: 0,
        parafiscales: 0,
        prestaciones: 0,
        totalMensual: 0,
        totalAnual: 0,
        porcentaje: 0
      },
      impactoEmpleado: {
        descuentoSsActual,
        descuentoSsPropuesto: 0,
        ahorroSsEmpleado: 0,
        ingresoNetoActual: salarioActual - descuentoSsActual,
        ingresoNetoPropuesto: 0,
        diferenciaIngreso: 0
      },
      elegibleParaIntegral: false,
      razonNoElegible: `Salario actual ($${salarioActual.toLocaleString('es-CO')}) es menor al mínimo integral ($${salarioIntegral.toLocaleString('es-CO')})`
    }
  }

  // ============================================
  // ESCENARIO PROPUESTO (integral + bonos)
  // ============================================
  const factorSalarial = Math.round(salarioIntegral * INTEGRAL_FACTOR_SALARIAL)
  const factorPrestacional = salarioIntegral - factorSalarial
  const ibc = factorSalarial // 70% del integral = base para SS y parafiscales
  const montoBonos = salarioActual - salarioIntegral // Diferencia va a bonos

  // Exemption for proposed scenario (IBC = 70% of integral minimum)
  const isExoneradoPropuesto = regimen === 'exonerado' && ibc < UMBRAL_EXONERACION
  const healthRatePropuesto = isExoneradoPropuesto ? 0 : HEALTH_RATE
  const senaRatePropuesto = isExoneradoPropuesto ? 0 : SENA_RATE
  const icbfRatePropuesto = isExoneradoPropuesto ? 0 : ICBF_RATE

  const ssEmpleadorRatePropuesto = healthRatePropuesto + PENSION_RATE + arlRate
  const parafiscalesRatePropuesto = senaRatePropuesto + icbfRatePropuesto + CAJA_RATE

  // SS empleador sobre IBC (70% del integral, NO sobre el salario original)
  const ssPropuesto = ibc * ssEmpleadorRatePropuesto
  // Parafiscales sobre IBC (70% del integral)
  const parafiscalesPropuesto = ibc * parafiscalesRatePropuesto
  // Prestaciones = $0 (incluidas en el 30% factor prestacional)
  const prestacionesPropuesto = 0
  // Costo total = integral + bonos + SS sobre IBC + parafiscales sobre IBC
  const costoTotalPropuesto = salarioIntegral + montoBonos + ssPropuesto + parafiscalesPropuesto

  // ============================================
  // AHORRO DETALLADO DEL EMPLEADOR
  // ============================================
  const ahorroSS = ssActual - ssPropuesto
  const ahorroParafiscales = parafiscalesActual - parafiscalesPropuesto
  const ahorroPrestaciones = prestacionesActual - prestacionesPropuesto // = todas las prestaciones
  const ahorroTotal = ahorroSS + ahorroParafiscales + ahorroPrestaciones
  const ahorroPorcentaje = costoTotalActual > 0 ? (ahorroTotal / costoTotalActual) * 100 : 0

  // ============================================
  // IMPACTO EMPLEADO
  // ============================================
  // Descuentos SS del empleado: 4% salud + 4% pensión = 8%
  const descuentoSsActual = salarioActual * EMPLEADO_SS_RATE
  const descuentoSsPropuesto = ibc * EMPLEADO_SS_RATE // Sobre 70% del integral, NO sobre el total
  const ahorroSsEmpleado = descuentoSsActual - descuentoSsPropuesto

  // Ingreso neto actual: salario - descuentos SS
  const ingresoNetoActual = salarioActual - descuentoSsActual
  // Ingreso neto propuesto: (integral - descuentos SS sobre IBC) + bonos (sin descuentos)
  const ingresoNetoPropuesto = (salarioIntegral - descuentoSsPropuesto) + montoBonos
  const diferenciaIngreso = ingresoNetoPropuesto - ingresoNetoActual

  return {
    empleadoId: empleado.id,
    empleadoNombre: empleado.nombre,
    salarioActual,
    estructuraPropuesta: {
      salarioIntegral,
      factorSalarial,
      factorPrestacional,
      montoBonos,
      compensacionTotal: salarioActual // El empleado recibe lo mismo
    },
    costoActual: {
      salario: salarioActual,
      seguridadSocial: ssActual,
      parafiscales: parafiscalesActual,
      prestaciones: prestacionesActual,
      total: costoTotalActual
    },
    costoPropuesto: {
      salarioIntegral,
      montoBonos,
      seguridadSocial: ssPropuesto,
      parafiscales: parafiscalesPropuesto,
      prestaciones: prestacionesPropuesto,
      total: costoTotalPropuesto
    },
    ahorroEmpleador: {
      seguridadSocial: ahorroSS,
      parafiscales: ahorroParafiscales,
      prestaciones: ahorroPrestaciones,
      totalMensual: ahorroTotal,
      totalAnual: ahorroTotal * 12,
      porcentaje: ahorroPorcentaje
    },
    impactoEmpleado: {
      descuentoSsActual,
      descuentoSsPropuesto,
      ahorroSsEmpleado,
      ingresoNetoActual,
      ingresoNetoPropuesto,
      diferenciaIngreso
    },
    elegibleParaIntegral: true
  }
}

/**
 * Calcula la comisión Tikin para salario integral
 * Se cobra como % del ahorro generado al empleador
 */
export function calculateIntegralCommission(
  ahorroMensualTotal: number,
  feePercentage: number = FEE_SALARIO_INTEGRAL,
  ivaRate: number = IVA_RATE
): IntegralTikinCommission {
  const feeMensual = ahorroMensualTotal * feePercentage
  const iva = feeMensual * ivaRate
  const totalConIvaMensual = feeMensual + iva

  return {
    ahorroBase: ahorroMensualTotal,
    porcentajeFee: feePercentage,
    feeMensual,
    iva,
    totalConIvaMensual,
    totalConIvaAnual: totalConIvaMensual * 12
  }
}

/**
 * Calcula el resumen financiero completo del flujo integral
 */
export function calculateIntegralSummary(
  empleados: EmployeeIntegral[],
  arlRiskLevel?: ARLRiskLevel,
  regimen?: RegimenParafiscales
): IntegralFinancialSummary {
  const resultados = empleados.map(emp => calculateIntegralForEmployee(emp, arlRiskLevel, regimen))

  const elegibles = resultados.filter(r => r.elegibleParaIntegral)
  const noElegibles = resultados.filter(r => !r.elegibleParaIntegral)

  // Aggregate only eligible employees
  const totalCostoActual = elegibles.reduce((sum, r) => sum + r.costoActual.total, 0)
  const totalCostoPropuesto = elegibles.reduce((sum, r) => sum + r.costoPropuesto.total, 0)

  // Aggregate savings by category
  const ahorroSS = elegibles.reduce((sum, r) => sum + r.ahorroEmpleador.seguridadSocial, 0)
  const ahorroParafiscales = elegibles.reduce((sum, r) => sum + r.ahorroEmpleador.parafiscales, 0)
  const ahorroPrestaciones = elegibles.reduce((sum, r) => sum + r.ahorroEmpleador.prestaciones, 0)
  const ahorroTotal = ahorroSS + ahorroParafiscales + ahorroPrestaciones
  const ahorroPorcentaje = totalCostoActual > 0 ? (ahorroTotal / totalCostoActual) * 100 : 0

  // Commission on total savings
  const comision = calculateIntegralCommission(ahorroTotal)

  return {
    totalEmpleados: empleados.length,
    empleadosElegibles: elegibles.length,
    empleadosNoElegibles: noElegibles.length,
    totalCostoActualMensual: totalCostoActual,
    totalCostoActualAnual: totalCostoActual * 12,
    totalCostoPropuestoMensual: totalCostoPropuesto,
    totalCostoPropuestoAnual: totalCostoPropuesto * 12,
    ahorroDetalle: {
      seguridadSocial: ahorroSS,
      parafiscales: ahorroParafiscales,
      prestaciones: ahorroPrestaciones
    },
    ahorroTotalMensual: ahorroTotal,
    ahorroTotalAnual: ahorroTotal * 12,
    ahorroPorcentaje,
    comisionTikin: comision,
    beneficioNetoMensual: ahorroTotal - comision.totalConIvaMensual,
    beneficioNetoAnual: (ahorroTotal - comision.totalConIvaMensual) * 12,
    resultadosPorEmpleado: resultados
  }
}
