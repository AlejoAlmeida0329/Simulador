/**
 * Cálculos financieros para Bonos 2.0
 * Comisiones, ahorros parafiscales y métricas financieras
 */

import {
  FEE_MERA_LIBERALIDAD_RANGES,
  FEE_ALIMENTACION_RANGES,
  FEE_VIATICOS_RANGES,
  IVA_RATE
} from './constants'

import type { ActiveFees } from './fee-provider'

import {
  TikinCommission,
  SavingsEstimate,
  EmployeeBonos2,
  RegimenParafiscales
} from './types'

import {
  calculateTraditionalScenario,
  calculateTikinScenario,
  calculateFullSavings
} from '@/lib/calculations/scenarios'

import { ARLRiskLevel } from '@/lib/constants/parafiscales'

/**
 * Calcula las comisiones de Tikin para Bonos 2.0
 * @param fees Optional dynamic fees from DB. Falls back to hardcoded constants.
 */
export function calculateTikinCommissionBonos2(
  montoMeraLiberalidad: number,
  montoAlimentacion: number,
  montoDotacion: number,
  montoViaticos: number = 0,
  fees?: ActiveFees,
  montoReparticionUtilidades: number = 0
): TikinCommission {
  const mlRanges = fees?.meraLiberalidadRanges || FEE_MERA_LIBERALIDAD_RANGES
  const ruRanges = fees?.reparticionUtilidades || FEE_MERA_LIBERALIDAD_RANGES
  const aliRanges = fees?.alimentacionRanges || FEE_ALIMENTACION_RANGES
  const viaRanges = fees?.viaticosRanges || FEE_VIATICOS_RANGES
  const ivaRate = fees?.iva ?? IVA_RATE

  // Helper to find fee by range
  const findFeeInRange = (ranges: { min: number; max: number; fee: number }[], monto: number, fallback: number) => {
    const rango = ranges.find(r => monto >= r.min && monto <= r.max)
    return rango?.fee ?? fallback
  }

  // Fee variable para mera liberalidad según rango
  const porcentajeFeeML = findFeeInRange(mlRanges, montoMeraLiberalidad, 0.018)
  const feeBaseMeraLiberalidad = montoMeraLiberalidad * porcentajeFeeML

  // Fee variable para alimentación según rango
  const porcentajeFeeAli = findFeeInRange(aliRanges, montoAlimentacion, 0.0125)
  const feeBaseAlimentacion = montoAlimentacion * porcentajeFeeAli

  // Fee variable para viáticos según rango
  const porcentajeFeeVia = findFeeInRange(viaRanges, montoViaticos, 0.0125)
  const feeBaseViaticos = montoViaticos * porcentajeFeeVia

  // Fee variable para repartición de utilidades según rango
  const porcentajeFeeRU = findFeeInRange(ruRanges, montoReparticionUtilidades, 0.018)
  const feeBaseReparticionUtilidades = montoReparticionUtilidades * porcentajeFeeRU

  // Total de fees (dotación no tiene fee, es obligatoria)
  const feeTotal = feeBaseMeraLiberalidad + feeBaseAlimentacion + feeBaseViaticos + feeBaseReparticionUtilidades

  // IVA sobre los fees
  const iva = feeTotal * ivaRate

  // Total con IVA
  const totalConIva = feeTotal + iva

  return {
    montoBaseMeraLiberalidad: montoMeraLiberalidad,
    porcentajeFee: porcentajeFeeML,
    feeBaseMeraLiberalidad,
    montoBaseAlimentacion: montoAlimentacion,
    feeBaseAlimentacion,
    montoDotacion,
    montoBaseViaticos: montoViaticos,
    feeBaseViaticos,
    montoBaseReparticionUtilidades: montoReparticionUtilidades,
    feeBaseReparticionUtilidades,
    feeTotal,
    iva,
    totalConIva
  }
}

/**
 * Estima los ahorros parafiscales con Tikin
 */
export function calculateSavingsEstimateBonos2(
  employees: EmployeeBonos2[],
  salaryPercentage: number,
  arlRiskLevel: ARLRiskLevel,
  commission: TikinCommission,
  regimen?: RegimenParafiscales,
  esReestructuracion?: boolean
): SavingsEstimate {
  // Convertir empleados Bonos2 a formato Employee estándar
  // beneficios_actuales: salario original es la comp total (bonos salen de ahí)
  // nuevos_beneficios: comp total = salario + bonos (bonos se agregan encima)
  const employeesForCalculation = employees.map(emp => ({
    id: emp.id,
    nombre: emp.nombre,
    salario: esReestructuracion ? emp.salario : emp.totalCompensacion,
    origen: emp.origen as 'manual' | 'archivo'
  }))

  // Use per-employee ARL if available, fallback to provided arlRiskLevel
  const effectiveArl = employees[0]?.arlRiskLevel || arlRiskLevel

  const options = regimen ? { regimen } : undefined

  // Escenario tradicional (todo como salario)
  const traditional = calculateTraditionalScenario(employeesForCalculation, effectiveArl, options)

  // Escenario Tikin (salario + bonos)
  const tikin = calculateTikinScenario(employeesForCalculation, salaryPercentage, effectiveArl, options)

  // Calcular ahorro completo (SS + Parafiscales + Prestaciones)
  const savingsData = calculateFullSavings(traditional, tikin)

  // Ahorro total mensual y anual (incluye las 3 categorías)
  const ahorroMensualEstimado = savingsData.monthlySavingsGrand
  const ahorroAnualEstimado = ahorroMensualEstimado * 12

  // Desglose por categoría (mensual)
  const ahorroSeguridadSocial = savingsData.savingsSeguridadSocial
  const ahorroParafiscales = savingsData.savingsParafiscales
  const ahorroPrestaciones = savingsData.savingsPrestaciones

  // Comisión Tikin mensual y anual
  const comisionTikinMensual = commission.totalConIva
  const comisionTikinAnual = comisionTikinMensual * 12

  // Beneficio neto (ahorro - comisión)
  const beneficioNetoMensual = ahorroMensualEstimado - comisionTikinMensual
  const beneficioNetoAnual = ahorroAnualEstimado - comisionTikinAnual

  return {
    ahorroMensualEstimado,
    ahorroAnualEstimado,
    ahorroSeguridadSocial,
    ahorroParafiscales,
    ahorroPrestaciones,
    comisionTikinMensual,
    comisionTikinAnual,
    beneficioNetoMensual,
    beneficioNetoAnual,
    costoTradicionalMensual: traditional.parafiscales.grandTotal,
    costoConTikinMensual: tikin.parafiscales.grandTotal,
    detalleTradicional: traditional.parafiscales,
    detalleTikin: tikin.parafiscales,
    esEstimacion: true,
    factoresVariables: [
      'Tarifas de seguridad social y parafiscales pueden variar según normativa vigente',
      'Nivel de riesgo ARL puede cambiar según actividad económica',
      'SMMLV y UVT se actualizan anualmente',
      'Prestaciones sociales calculadas como provisión mensual (prima, cesantías, intereses, vacaciones)',
      'Cálculo basado en nómina actual sin proyecciones de crecimiento'
    ]
  }
}

/**
 * Calcula el ROI (Retorno de Inversión) del cliente
 */
export function calculateROI(
  ahorroAnual: number,
  comisionAnual: number
): {
  roi: number // Porcentaje
  paybackMonths: number // Meses para recuperar inversión
  beneficioNeto: number
} {
  const beneficioNeto = ahorroAnual - comisionAnual

  // ROI = (Beneficio Neto / Inversión) * 100
  const roi = comisionAnual > 0 ? (beneficioNeto / comisionAnual) * 100 : 0

  // Payback = Inversión / (Beneficio Mensual)
  const beneficioMensual = beneficioNeto / 12
  const paybackMonths = beneficioMensual > 0 ? comisionAnual / beneficioMensual : Infinity

  return {
    roi,
    paybackMonths: Math.ceil(paybackMonths),
    beneficioNeto
  }
}

/**
 * Calcula métricas de distribución de bonos
 */
export function calculateBonusDistributionMetrics(employees: EmployeeBonos2[]): {
  totalEmpleados: number
  empleadosConBonos: number
  porcentajeCobertura: number
  montoPorEmpleado: {
    min: number
    max: number
    promedio: number
    mediana: number
  }
  distribucio: {
    sinBonos: number
    menos1M: number
    entre1My2M: number
    mas2M: number
  }
} {
  const totalEmpleados = employees.length
  const empleadosConBonos = employees.filter(emp => emp.totalBonos > 0).length
  const porcentajeCobertura = totalEmpleados > 0 ? (empleadosConBonos / totalEmpleados) * 100 : 0

  // Montos
  const montosBonos = employees.map(emp => emp.totalBonos)
  const min = Math.min(...montosBonos)
  const max = Math.max(...montosBonos)
  const promedio = montosBonos.reduce((sum, val) => sum + val, 0) / totalEmpleados

  // Mediana
  const sorted = [...montosBonos].sort((a, b) => a - b)
  const mediana = totalEmpleados % 2 === 0
    ? (sorted[totalEmpleados / 2 - 1] + sorted[totalEmpleados / 2]) / 2
    : sorted[Math.floor(totalEmpleados / 2)]

  // Distribución por rangos
  const sinBonos = employees.filter(emp => emp.totalBonos === 0).length
  const menos1M = employees.filter(emp => emp.totalBonos > 0 && emp.totalBonos < 1_000_000).length
  const entre1My2M = employees.filter(emp => emp.totalBonos >= 1_000_000 && emp.totalBonos < 2_000_000).length
  const mas2M = employees.filter(emp => emp.totalBonos >= 2_000_000).length

  return {
    totalEmpleados,
    empleadosConBonos,
    porcentajeCobertura,
    montoPorEmpleado: {
      min,
      max,
      promedio,
      mediana
    },
    distribucio: {
      sinBonos,
      menos1M,
      entre1My2M,
      mas2M
    }
  }
}

/**
 * Sugiere ajustes para cumplir con regla 60/40
 */
export function suggestAdjustments(
  totalSalarios: number,
  totalBonos: number,
  porcentajeObjetivo: number = 40
): {
  requiereAjuste: boolean
  opcion1_reducirBonos: {
    descripcion: string
    nuevoBonos: number
    reduccion: number
  }
  opcion2_aumentarSalarios: {
    descripcion: string
    nuevoSalarios: number
    aumento: number
  }
  opcion3_combinado: {
    descripcion: string
    ajusteBonos: number
    ajusteSalarios: number
  }
} {
  const totalCompensacion = totalSalarios + totalBonos
  const porcentajeBonos = (totalBonos / totalCompensacion) * 100

  const requiereAjuste = porcentajeBonos > porcentajeObjetivo

  if (!requiereAjuste) {
    return {
      requiereAjuste: false,
      opcion1_reducirBonos: {
        descripcion: 'No requiere ajuste',
        nuevoBonos: totalBonos,
        reduccion: 0
      },
      opcion2_aumentarSalarios: {
        descripcion: 'No requiere ajuste',
        nuevoSalarios: totalSalarios,
        aumento: 0
      },
      opcion3_combinado: {
        descripcion: 'No requiere ajuste',
        ajusteBonos: 0,
        ajusteSalarios: 0
      }
    }
  }

  // Opción 1: Reducir bonos manteniendo salarios
  const bonosObjetivo = totalCompensacion * (porcentajeObjetivo / 100)
  const reduccionBonos = totalBonos - bonosObjetivo

  // Opción 2: Aumentar salarios manteniendo bonos
  // totalBonos = totalCompensacion * 0.4
  // totalBonos = (totalSalarios + totalBonos) * 0.4
  // totalBonos / 0.4 = totalSalarios + totalBonos
  // (totalBonos / 0.4) - totalBonos = totalSalarios_nuevo
  const nuevaCompensacion = totalBonos / (porcentajeObjetivo / 100)
  const nuevoSalarios = nuevaCompensacion - totalBonos
  const aumentoSalarios = nuevoSalarios - totalSalarios

  // Opción 3: Combinado (50/50)
  const ajusteBonos = reduccionBonos / 2
  const ajusteSalarios = aumentoSalarios / 2

  return {
    requiereAjuste: true,
    opcion1_reducirBonos: {
      descripcion: `Reducir bonos a $${Math.floor(bonosObjetivo).toLocaleString('es-CO')} (${porcentajeObjetivo}% de compensación)`,
      nuevoBonos: bonosObjetivo,
      reduccion: reduccionBonos
    },
    opcion2_aumentarSalarios: {
      descripcion: `Aumentar salarios a $${Math.floor(nuevoSalarios).toLocaleString('es-CO')} para mantener bonos en ${porcentajeObjetivo}%`,
      nuevoSalarios: nuevoSalarios,
      aumento: aumentoSalarios
    },
    opcion3_combinado: {
      descripcion: `Reducir bonos en $${Math.floor(ajusteBonos).toLocaleString('es-CO')} y aumentar salarios en $${Math.floor(ajusteSalarios).toLocaleString('es-CO')}`,
      ajusteBonos: ajusteBonos,
      ajusteSalarios: ajusteSalarios
    }
  }
}
