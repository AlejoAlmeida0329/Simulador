/**
 * Cálculos para flujo de Salario Integral + Bonos
 *
 * Modelo:
 * - Empleado YA tiene salario integral de $X (IBC = 70% de $X)
 * - Se reestructura: integral mínimo (~$22.76M) + la diferencia como bonos Art. 128
 * - Ejemplo: $40M → $22.76M integral + $17.24M bonos = $40M total (recibe lo mismo)
 *
 * Ahorros empleador (2 fuentes — ambos escenarios son integrales):
 * 1. Seguridad Social: IBC baja de 70%×$40M a 70%×$22.76M
 * 2. Parafiscales: misma reducción de base
 * (Prestaciones = $0 en ambos casos — incluidas en el 30% factor prestacional)
 *
 * Beneficio empleado:
 * - Recibe la misma compensación total ($40M)
 * - Descuentos SS bajan (8% sobre IBC menor)
 * - Resultado: más ingreso neto mensual
 *
 * Tikin cobra fee por gestión de bonos (no % del ahorro)
 */

import {
  SALARIO_INTEGRAL_MINIMO,
  INTEGRAL_FACTOR_SALARIAL,
  EMPLEADO_SS_RATE
} from './constants'

import {
  HEALTH_RATE,
  PENSION_RATE,
  ARL_RATES,
  SENA_RATE,
  ICBF_RATE,
  CAJA_RATE,
  ARLRiskLevel
} from '@/lib/constants/parafiscales'

import type {
  EmployeeIntegral,
  IntegralEmployeeResult,
  IntegralFinancialSummary,
  TikinCommission,
} from './types'

/**
 * Calcula el resultado integral + bonos para un empleado individual
 */
export function calculateIntegralForEmployee(
  empleado: EmployeeIntegral,
  arlRiskLevel?: ARLRiskLevel,
): IntegralEmployeeResult {
  const salarioActual = empleado.salarioActual
  const effectiveArl = empleado.arlRiskLevel || arlRiskLevel || 'III'
  const arlRate = ARL_RATES[effectiveArl]

  // IBC actual = 70% del integral actual (ya es integral)
  const ibcActual = Math.round(salarioActual * INTEGRAL_FACTOR_SALARIAL)

  // Integral NUNCA aplica exoneración: Art. 114-1 E.T. exonera empleados
  // que devenguen < 10 SMMLV, pero integral mínimo = 13 SMMLV → siempre > 10.
  // Se pagan todos los aportes: Salud 8.5%, SENA 2%, ICBF 3%, Caja 4%.
  const ssEmpleadorRate = HEALTH_RATE + PENSION_RATE + arlRate
  const parafiscalesRate = SENA_RATE + ICBF_RATE + CAJA_RATE

  // ============================================
  // ESCENARIO ACTUAL (ya es integral — IBC = 70%)
  // ============================================
  const ssActual = ibcActual * ssEmpleadorRate
  const parafiscalesActual = ibcActual * parafiscalesRate
  const prestacionesActual = 0 // Ya incluidas en el 30% factor prestacional
  const costoTotalActual = salarioActual + ssActual + parafiscalesActual

  // ============================================
  // ELEGIBILIDAD
  // ============================================
  const salarioIntegral = SALARIO_INTEGRAL_MINIMO
  const elegible = salarioActual >= salarioIntegral

  if (!elegible) {
    // Empleado no elegible — retornar estructura vacía
    const descuentoSsActual = ibcActual * EMPLEADO_SS_RATE
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
        prestaciones: 0,
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
  // ESCENARIO PROPUESTO (integral mínimo + bonos)
  // ============================================
  const factorSalarial = Math.round(salarioIntegral * INTEGRAL_FACTOR_SALARIAL)
  const factorPrestacional = salarioIntegral - factorSalarial
  const ibc = factorSalarial // 70% del integral = base para SS y parafiscales
  const montoBonos = salarioActual - salarioIntegral // Diferencia va a bonos

  // Mismas tasas aplican (integral nunca exonerado)
  // SS empleador sobre IBC (70% del integral mínimo)
  const ssPropuesto = ibc * ssEmpleadorRate
  // Parafiscales sobre IBC (70% del integral mínimo)
  const parafiscalesPropuesto = ibc * parafiscalesRate
  // Prestaciones = $0 (incluidas en el 30% factor prestacional)
  const prestacionesPropuesto = 0
  // Costo total = integral + bonos + SS sobre IBC + parafiscales sobre IBC
  const costoTotalPropuesto = salarioIntegral + montoBonos + ssPropuesto + parafiscalesPropuesto

  // ============================================
  // AHORRO DETALLADO DEL EMPLEADOR
  // ============================================
  const ahorroSS = ssActual - ssPropuesto
  const ahorroParafiscales = parafiscalesActual - parafiscalesPropuesto
  const ahorroPrestaciones = 0 // Ambos escenarios son integral → prestaciones = $0
  const ahorroTotal = ahorroSS + ahorroParafiscales + ahorroPrestaciones
  const ahorroPorcentaje = costoTotalActual > 0 ? (ahorroTotal / costoTotalActual) * 100 : 0

  // ============================================
  // IMPACTO EMPLEADO
  // ============================================
  // Descuentos SS del empleado: 4% salud + 4% pensión = 8% sobre IBC (70% del integral)
  const descuentoSsActual = ibcActual * EMPLEADO_SS_RATE // IBC actual = 70% del integral actual
  const descuentoSsPropuesto = ibc * EMPLEADO_SS_RATE // IBC propuesto = 70% del integral mínimo
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
 * Calcula el resumen financiero completo del flujo integral
 *
 * Nota: La comisión Tikin se calcula en el store usando calculateTikinCommissionBonos2()
 * con fee por rangos sobre montos de bonos (no % del ahorro).
 * Esta función retorna un placeholder en comisionTikin que el store sobreescribe.
 */
export function calculateIntegralSummary(
  empleados: EmployeeIntegral[],
  arlRiskLevel?: ARLRiskLevel,
): IntegralFinancialSummary {
  const resultados = empleados.map(emp => calculateIntegralForEmployee(emp, arlRiskLevel))

  const elegibles = resultados.filter(r => r.elegibleParaIntegral)

  // Aggregate only eligible employees
  const totalCostoActual = elegibles.reduce((sum, r) => sum + r.costoActual.total, 0)
  const totalCostoPropuesto = elegibles.reduce((sum, r) => sum + r.costoPropuesto.total, 0)

  // Aggregate savings by category
  const ahorroSS = elegibles.reduce((sum, r) => sum + r.ahorroEmpleador.seguridadSocial, 0)
  const ahorroParafiscales = elegibles.reduce((sum, r) => sum + r.ahorroEmpleador.parafiscales, 0)
  const ahorroPrestaciones = elegibles.reduce((sum, r) => sum + r.ahorroEmpleador.prestaciones, 0)
  const ahorroTotal = ahorroSS + ahorroParafiscales + ahorroPrestaciones
  const ahorroPorcentaje = totalCostoActual > 0 ? (ahorroTotal / totalCostoActual) * 100 : 0

  // Placeholder commission — overridden in store with calculateTikinCommissionBonos2()
  const emptyCommission: TikinCommission = {
    montoBaseMeraLiberalidad: 0,
    porcentajeFee: 0,
    feeBaseMeraLiberalidad: 0,
    montoBaseAlimentacion: 0,
    feeBaseAlimentacion: 0,
    montoDotacion: 0,
    montoBaseViaticos: 0,
    feeBaseViaticos: 0,
    montoBaseReparticionUtilidades: 0,
    feeBaseReparticionUtilidades: 0,
    feeTotal: 0,
    iva: 0,
    totalConIva: 0
  }

  return {
    totalEmpleados: empleados.length,
    empleadosElegibles: elegibles.length,
    empleadosNoElegibles: empleados.length - elegibles.length,
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
    comisionTikin: emptyCommission,
    beneficioNetoMensual: ahorroTotal,
    beneficioNetoAnual: ahorroTotal * 12,
    resultadosPorEmpleado: resultados
  }
}
