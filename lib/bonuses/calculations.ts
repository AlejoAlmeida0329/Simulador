import {
  FEE_MERA_LIBERALIDAD_RANGES,
  FEE_ALIMENTACION,
  IVA,
  LIMITE_ALIMENTACION_MENSUAL,
  BonusAssignment,
  ValidationResult,
  Employee
} from '@/types/bonuses'

/**
 * L-001: Validar que un monto de bono de alimentación no exceda 41 UVT
 * El tope es MENSUAL y sobre MONTO BRUTO (antes de fees)
 */
export function validateAlimentacionLimit(montoBruto: number): boolean {
  return montoBruto <= LIMITE_ALIMENTACION_MENSUAL
}

/**
 * L-003: Validar todas las asignaciones de bonos de alimentación
 * Retorna empleados que exceden el límite
 */
export function validateAlimentacionAssignments(
  asignaciones: BonusAssignment[]
): ValidationResult {
  const errores = asignaciones
    .filter(a => a.montoBono > LIMITE_ALIMENTACION_MENSUAL)
    .map(a => ({
      empleadoId: a.empleadoId,
      empleadoNombre: a.empleadoNombre,
      montoAsignado: a.montoBono,
      limitePermitido: LIMITE_ALIMENTACION_MENSUAL,
      exceso: a.montoBono - LIMITE_ALIMENTACION_MENSUAL
    }))

  const totalExceso = errores.reduce((sum, e) => sum + e.exceso, 0)

  return {
    valido: errores.length === 0,
    errores,
    totalExceso
  }
}

/**
 * N-001: Calcular fee de mera liberalidad según rango del TOTAL dispersado
 */
export function calculateMeraLiberalidadFee(montoTotal: number): {
  percentage: number
  feeAmount: number
  iva: number
  total: number
  rangoLabel: string
} {
  // Encontrar el rango aplicable
  const rango = FEE_MERA_LIBERALIDAD_RANGES.find(
    r => montoTotal >= r.min && montoTotal <= r.max
  )

  if (!rango) {
    throw new Error('Monto fuera de todos los rangos definidos')
  }

  const feeAmount = montoTotal * rango.fee
  const ivaAmount = feeAmount * IVA
  const total = feeAmount + ivaAmount

  let rangoLabel = ''
  if (rango.max === Infinity) {
    rangoLabel = `Más de $${(rango.min / 1_000_000).toFixed(0)}M`
  } else {
    rangoLabel = `$${(rango.min / 1_000_000).toFixed(0)}M - $${(rango.max / 1_000_000).toFixed(0)}M`
  }

  return {
    percentage: rango.fee,
    feeAmount,
    iva: ivaAmount,
    total,
    rangoLabel
  }
}

/**
 * Calcular fee de alimentación (fijo 1.25%)
 */
export function calculateAlimentacionFee(montoTotal: number): {
  percentage: number
  feeAmount: number
  iva: number
  total: number
} {
  const feeAmount = montoTotal * FEE_ALIMENTACION
  const ivaAmount = feeAmount * IVA
  const total = feeAmount + ivaAmount

  return {
    percentage: FEE_ALIMENTACION,
    feeAmount,
    iva: ivaAmount,
    total
  }
}

/**
 * Distribuir bonos proporcionalmente al salario
 */
export function distributeProportionally(
  empleados: Employee[],
  montoTotal: number,
  limiteMaximo?: number // Para bonos de alimentación
): BonusAssignment[] {
  const totalSalarios = empleados.reduce((sum, e) => sum + e.salario, 0)

  return empleados.map(empleado => {
    // Calcular proporción
    let montoBono = (empleado.salario / totalSalarios) * montoTotal

    // Si hay límite (bono de alimentación), aplicarlo
    if (limiteMaximo && montoBono > limiteMaximo) {
      montoBono = limiteMaximo
    }

    const excedeLimit = limiteMaximo ? montoBono > limiteMaximo : false
    const exceso = excedeLimit && limiteMaximo ? montoBono - limiteMaximo : 0

    return {
      empleadoId: empleado.id,
      empleadoNombre: empleado.nombre,
      salario: empleado.salario,
      montoBono,
      excedeLimit,
      exceso
    }
  })
}

/**
 * Distribuir bonos con monto fijo por empleado
 */
export function distributeFixed(
  empleados: Employee[],
  montoPorEmpleado: number,
  limiteMaximo?: number
): BonusAssignment[] {
  let montoFinal = montoPorEmpleado

  // Si hay límite (bono de alimentación) y se excede, usar el límite
  if (limiteMaximo && montoPorEmpleado > limiteMaximo) {
    montoFinal = limiteMaximo
  }

  return empleados.map(empleado => ({
    empleadoId: empleado.id,
    empleadoNombre: empleado.nombre,
    salario: empleado.salario,
    montoBono: montoFinal,
    excedeLimit: limiteMaximo ? montoPorEmpleado > limiteMaximo : false,
    exceso: limiteMaximo && montoPorEmpleado > limiteMaximo ? montoPorEmpleado - limiteMaximo : 0
  }))
}

/**
 * Redistribuir el exceso entre empleados que están bajo el límite
 * Solo aplica para bonos de alimentación
 */
export function redistributeExcess(
  asignaciones: BonusAssignment[]
): BonusAssignment[] {
  const excedidos = asignaciones.filter(a => a.excedeLimit)
  const bajosLimite = asignaciones.filter(a => !a.excedeLimit)

  if (excedidos.length === 0 || bajosLimite.length === 0) {
    return asignaciones
  }

  // Calcular exceso total
  const excesoTotal = excedidos.reduce((sum, a) => sum + (a.exceso || 0), 0)

  // Ajustar excedidos al límite
  const ajustados = excedidos.map(a => ({
    ...a,
    montoBono: LIMITE_ALIMENTACION_MENSUAL,
    excedeLimit: false,
    exceso: 0
  }))

  // Distribuir exceso entre los que están bajo el límite
  const espacioDisponible = bajosLimite.map(a => LIMITE_ALIMENTACION_MENSUAL - a.montoBono)
  const espacioTotal = espacioDisponible.reduce((sum, e) => sum + e, 0)

  const redistribuidos = bajosLimite.map((a, index) => {
    const proporcion = espacioDisponible[index] / espacioTotal
    const incremento = Math.min(excesoTotal * proporcion, espacioDisponible[index])
    const nuevoMonto = a.montoBono + incremento

    return {
      ...a,
      montoBono: nuevoMonto,
      excedeLimit: nuevoMonto > LIMITE_ALIMENTACION_MENSUAL,
      exceso: nuevoMonto > LIMITE_ALIMENTACION_MENSUAL ? nuevoMonto - LIMITE_ALIMENTACION_MENSUAL : 0
    }
  })

  return [...ajustados, ...redistribuidos]
}

/**
 * Generar número de propuesta único
 */
export function generateProposalNumber(companyName: string): string {
  const prefix = companyName.substring(0, 3).toUpperCase()
  const timestamp = Date.now().toString().substring(8)
  return `${prefix}-${timestamp}`
}
