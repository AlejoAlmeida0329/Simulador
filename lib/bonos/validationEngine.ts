/**
 * Motor de Validación para Bonos 2.0
 * Implementa todas las reglas legales y de negocio
 */

import {
  SMMLV_2026,
  LIMITE_ALIMENTACION_MENSUAL,
  SALARIO_MAXIMO_DOTACION,
  MIN_SALARY_PERCENTAGE,
  ValidationCode,
  ValidationSeverity,
  BonusTypeEnum,
  BonusCategory,
  BONUS_TYPES_METADATA,
  VALIDATION_MESSAGES
} from './constants'

import {
  EmployeeBonos2,
  ValidationResult,
  ValidationMessage,
  ValidationSummary,
  SplitConfig,
  FinancialSummary,
  BonusTotals,
  FlujoTipo
} from './types'

/**
 * Motor de Validación Principal
 */
export class ValidationEngine {
  /**
   * Valida un empleado individual contra todas las reglas
   */
  static validateEmployee(
    employee: EmployeeBonos2,
    splitConfig: SplitConfig
  ): ValidationResult {
    const errors: ValidationMessage[] = []
    const warnings: ValidationMessage[] = []

    // Regla 1: Validar split 60/40
    const splitValidation = this.validateSplit(
      employee.salario,
      employee.totalBonos,
      splitConfig
    )
    errors.push(...splitValidation.errors)
    warnings.push(...splitValidation.warnings)

    // Regla 2: Validar que 60% no sea menor a 1 SMMLV
    const smmlvValidation = this.validateMinimumSalary(
      employee.salario,
      employee.totalCompensacion,
      splitConfig.porcentajeSalario
    )
    errors.push(...smmlvValidation.errors)
    warnings.push(...smmlvValidation.warnings)

    // Regla 3: Validar límite de alimentación (41 UVT)
    if (employee.bonos[BonusTypeEnum.ALIMENTACION]) {
      const alimentacionValidation = this.validateAlimentacionLimit(
        employee.bonos[BonusTypeEnum.ALIMENTACION]!,
        employee.id
      )
      errors.push(...alimentacionValidation.errors)
      warnings.push(...alimentacionValidation.warnings)
    }

    // Regla 4: Validar elegibilidad para dotación (<2 SMMLV)
    if (employee.bonos[BonusTypeEnum.DOTACION]) {
      const dotacionValidation = this.validateDotacionEligibility(
        employee.salario
      )
      errors.push(...dotacionValidation.errors)
      warnings.push(...dotacionValidation.warnings)
    }

    // Regla 5: Warning para viáticos (requieren soporte documental)
    if (employee.bonos[BonusTypeEnum.VIATICOS]) {
      warnings.push({
        code: ValidationCode.VIATICOS_SIN_SOPORTE,
        severity: ValidationSeverity.WARNING,
        message: VALIDATION_MESSAGES[ValidationCode.VIATICOS_SIN_SOPORTE],
        field: 'viaticos',
        value: employee.bonos[BonusTypeEnum.VIATICOS]
      })
    }

    return {
      empleadoId: employee.id,
      empleadoNombre: employee.nombre,
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Valida todos los empleados y genera resumen
   */
  static validateAllEmployees(
    employees: EmployeeBonos2[],
    splitConfig: SplitConfig
  ): ValidationSummary {
    const resultadosPorEmpleado: ValidationResult[] = []
    const erroresCriticos: ValidationMessage[] = []
    const warningsGlobales: ValidationMessage[] = []

    let empleadosValidos = 0
    let empleadosConErrores = 0
    let empleadosConWarnings = 0

    // Validar cada empleado
    for (const employee of employees) {
      const result = this.validateEmployee(employee, splitConfig)
      resultadosPorEmpleado.push(result)

      if (result.isValid) {
        empleadosValidos++
      }

      if (result.errors.length > 0) {
        empleadosConErrores++
        // Agregar errores críticos únicos
        result.errors.forEach(error => {
          if (!erroresCriticos.some(e => e.code === error.code && e.message === error.message)) {
            erroresCriticos.push(error)
          }
        })
      }

      if (result.warnings.length > 0) {
        empleadosConWarnings++
        // Agregar warnings únicos
        result.warnings.forEach(warning => {
          if (!warningsGlobales.some(w => w.code === warning.code && w.message === warning.message)) {
            warningsGlobales.push(warning)
          }
        })
      }
    }

    // Validación agregada: verificar proporción global
    const totales = this.calculateTotals(employees)
    const globalSplitValidation = this.validateGlobalSplit(totales, splitConfig)
    erroresCriticos.push(...globalSplitValidation.errors)
    warningsGlobales.push(...globalSplitValidation.warnings)

    return {
      totalEmpleados: employees.length,
      empleadosValidos,
      empleadosConErrores,
      empleadosConWarnings,
      erroresCriticos,
      warnings: warningsGlobales,
      puedeAvanzar: erroresCriticos.length === 0,
      resultadosPorEmpleado
    }
  }

  /**
   * Regla 1: Validar split 60/40
   * El total de bonos no debe superar el 40% (o el % configurado)
   */
  private static validateSplit(
    salario: number,
    totalBonos: number,
    splitConfig: SplitConfig
  ): { errors: ValidationMessage[], warnings: ValidationMessage[] } {
    const errors: ValidationMessage[] = []
    const warnings: ValidationMessage[] = []

    const totalCompensacion = salario + totalBonos
    const porcentajeBonos = (totalBonos / totalCompensacion) * 100
    const limiteBonosPermitido = splitConfig.porcentajeBonos

    // Error: supera el límite de bonos
    if (porcentajeBonos > limiteBonosPermitido) {
      const excesoAbsoluto = totalBonos - (totalCompensacion * limiteBonosPermitido / 100)
      errors.push({
        code: ValidationCode.EXCEDE_40_BONOS,
        severity: ValidationSeverity.ERROR,
        message: `Los bonos representan ${porcentajeBonos.toFixed(1)}% (límite: ${limiteBonosPermitido}%)`,
        value: totalBonos,
        limit: totalCompensacion * limiteBonosPermitido / 100,
        sugerencia: `Reduzca los bonos en $${Math.ceil(excesoAbsoluto).toLocaleString('es-CO')} o aumente el salario base`
      })
    }

    // Warning: configuración personalizada
    if (splitConfig.tipo === 'personalizado') {
      warnings.push({
        code: ValidationCode.CONFIGURACION_PERSONALIZADA,
        severity: ValidationSeverity.WARNING,
        message: `Usando split personalizado (${splitConfig.porcentajeSalario}/${splitConfig.porcentajeBonos}) en lugar del recomendado (60/40)`
      })
    }

    return { errors, warnings }
  }

  /**
   * Regla 2: El 60% del salario no puede ser menor a 1 SMMLV
   */
  private static validateMinimumSalary(
    salario: number,
    totalCompensacion: number,
    porcentajeSalario: number
  ): { errors: ValidationMessage[], warnings: ValidationMessage[] } {
    const errors: ValidationMessage[] = []
    const warnings: ValidationMessage[] = []

    const salarioBase = totalCompensacion * (porcentajeSalario / 100)
    const minimoRequerido = SMMLV_2026

    if (salarioBase < minimoRequerido) {
      const deficit = minimoRequerido - salarioBase
      errors.push({
        code: ValidationCode.SALARIO_MENOR_1_SMMLV,
        severity: ValidationSeverity.ERROR,
        message: `El ${porcentajeSalario}% del salario ($${Math.floor(salarioBase).toLocaleString('es-CO')}) es menor a 1 SMMLV ($${SMMLV_2026.toLocaleString('es-CO')})`,
        value: salarioBase,
        limit: minimoRequerido,
        sugerencia: `Aumente el salario base en al menos $${Math.ceil(deficit).toLocaleString('es-CO')}`
      })
    }

    return { errors, warnings }
  }

  /**
   * Regla 3: Límite de alimentación (41 UVT por empleado)
   */
  private static validateAlimentacionLimit(
    montoAlimentacion: number,
    empleadoId: string
  ): { errors: ValidationMessage[], warnings: ValidationMessage[] } {
    const errors: ValidationMessage[] = []
    const warnings: ValidationMessage[] = []

    const limite = LIMITE_ALIMENTACION_MENSUAL

    // Error: supera el límite
    if (montoAlimentacion > limite) {
      const exceso = montoAlimentacion - limite
      errors.push({
        code: ValidationCode.EXCEDE_41_UVT_ALIMENTACION,
        severity: ValidationSeverity.ERROR,
        message: `El bono de alimentación ($${montoAlimentacion.toLocaleString('es-CO')}) supera el límite de 41 UVT ($${limite.toLocaleString('es-CO')})`,
        field: 'bono_alimentacion',
        value: montoAlimentacion,
        limit: limite,
        sugerencia: `Reduzca el bono en $${Math.ceil(exceso).toLocaleString('es-CO')}`
      })
    }

    // Warning: cerca del límite (>90%)
    else if (montoAlimentacion > limite * 0.9) {
      const margen = limite - montoAlimentacion
      warnings.push({
        code: ValidationCode.CERCA_LIMITE_ALIMENTACION,
        severity: ValidationSeverity.WARNING,
        message: `El bono de alimentación está cerca del límite (margen: $${Math.floor(margen).toLocaleString('es-CO')})`,
        field: 'bono_alimentacion',
        value: montoAlimentacion,
        limit: limite
      })
    }

    return { errors, warnings }
  }

  /**
   * Regla 4: Dotación solo aplica a empleados con salario <2 SMMLV
   */
  private static validateDotacionEligibility(
    salario: number
  ): { errors: ValidationMessage[], warnings: ValidationMessage[] } {
    const errors: ValidationMessage[] = []
    const warnings: ValidationMessage[] = []

    const limite = SALARIO_MAXIMO_DOTACION

    if (salario >= limite) {
      errors.push({
        code: ValidationCode.SALARIO_EXCEDE_2_SMMLV_DOTACION,
        severity: ValidationSeverity.ERROR,
        message: `El salario ($${salario.toLocaleString('es-CO')}) supera 2 SMMLV ($${limite.toLocaleString('es-CO')}). La dotación no aplica.`,
        field: 'dotacion',
        value: salario,
        limit: limite,
        sugerencia: 'Retire el bono de dotación para este empleado'
      })
    }

    return { errors, warnings }
  }

  /**
   * Validación global del split (agregado de todos los empleados)
   */
  private static validateGlobalSplit(
    totales: { totalSalarios: number, totalBonos: number },
    splitConfig: SplitConfig
  ): { errors: ValidationMessage[], warnings: ValidationMessage[] } {
    const errors: ValidationMessage[] = []
    const warnings: ValidationMessage[] = []

    const totalCompensacion = totales.totalSalarios + totales.totalBonos
    const porcentajeBonos = (totales.totalBonos / totalCompensacion) * 100
    const limitePermitido = splitConfig.porcentajeBonos

    if (porcentajeBonos > limitePermitido + 0.5) { // Tolerancia de 0.5% por redondeo
      errors.push({
        code: ValidationCode.EXCEDE_40_BONOS,
        severity: ValidationSeverity.ERROR,
        message: `A nivel global, los bonos representan ${porcentajeBonos.toFixed(1)}% (límite: ${limitePermitido}%)`,
        value: totales.totalBonos,
        limit: totalCompensacion * limitePermitido / 100,
        sugerencia: 'Ajuste la distribución de bonos o aumente los salarios base'
      })
    }

    return { errors, warnings }
  }

  /**
   * Calcula totales agregados de empleados
   */
  private static calculateTotals(employees: EmployeeBonos2[]): { totalSalarios: number, totalBonos: number } {
    return employees.reduce(
      (acc, emp) => ({
        totalSalarios: acc.totalSalarios + emp.salario,
        totalBonos: acc.totalBonos + emp.totalBonos
      }),
      { totalSalarios: 0, totalBonos: 0 }
    )
  }

  /**
   * Calcula resumen financiero completo
   */
  static calculateFinancialSummary(
    employees: EmployeeBonos2[],
    splitConfig: SplitConfig,
    flujo?: FlujoTipo | null
  ): FinancialSummary {
    // Calcular totales por categoría
    let totalSalarios = 0
    let totalBonosMeraLiberalidad = 0
    let totalBonosAlimentacion = 0
    let totalBonosDotacion = 0
    let totalBonosViaticos = 0
    let totalBonosReparticionUtilidades = 0

    // Contadores de validaciones específicas
    let empleadosExcedenAlimentacion = 0
    let empleadosNoCumplenDotacion = 0

    // Desglose por tipo de bono
    const desglosePorTipo = new Map<BonusTypeEnum, {
      totalEmpleados: number
      montos: number[]
      montoTotal: number
    }>()

    // Inicializar desglose
    Object.values(BonusTypeEnum).forEach(tipo => {
      desglosePorTipo.set(tipo, {
        totalEmpleados: 0,
        montos: [],
        montoTotal: 0
      })
    })

    // Procesar cada empleado
    for (const employee of employees) {
      totalSalarios += employee.salario

      // Procesar bonos por tipo
      for (const [tipo, monto] of Object.entries(employee.bonos)) {
        const bonusType = tipo as BonusTypeEnum
        const metadata = BONUS_TYPES_METADATA[bonusType]

        // Categorizar por tipo
        switch (metadata.categoria) {
          case BonusCategory.MERA_LIBERALIDAD:
            totalBonosMeraLiberalidad += monto
            break
          case BonusCategory.ALIMENTACION:
            totalBonosAlimentacion += monto
            // Validar límite
            if (monto > LIMITE_ALIMENTACION_MENSUAL) {
              empleadosExcedenAlimentacion++
            }
            break
          case BonusCategory.DOTACION:
            totalBonosDotacion += monto
            // Validar elegibilidad
            if (employee.salario >= SALARIO_MAXIMO_DOTACION) {
              empleadosNoCumplenDotacion++
            }
            break
          case BonusCategory.VIATICOS:
            totalBonosViaticos += monto
            break
          case BonusCategory.REPARTICION_UTILIDADES:
            totalBonosReparticionUtilidades += monto
            break
        }

        // Agregar al desglose
        const desglose = desglosePorTipo.get(bonusType)!
        desglose.totalEmpleados++
        desglose.montos.push(monto)
        desglose.montoTotal += monto
      }
    }

    const totalBonosTotal = totalBonosMeraLiberalidad + totalBonosAlimentacion + totalBonosDotacion + totalBonosViaticos + totalBonosReparticionUtilidades

    // Para beneficios_actuales (reestructuración): los bonos salen DEL salario existente.
    // totalCompensacion = salario original, IBC nuevo = salario - bonos.
    // Para nuevos_beneficios: los bonos se agregan ENCIMA del salario.
    // totalCompensacion = salario + bonos.
    const esReestructuracion = flujo === 'beneficios_actuales'
    const totalCompensacion = esReestructuracion
      ? totalSalarios                    // $10M — no cambia, solo se redistribuye
      : totalSalarios + totalBonosTotal  // $10M + $4M = $14M

    // Porcentajes sobre la compensación total
    // Reestructuración: IBC = salario - bonos, porcentaje relativo al total original
    const salarioEfectivo = esReestructuracion
      ? totalSalarios - totalBonosTotal  // $6M (nuevo IBC)
      : totalSalarios                    // $10M (salario se mantiene)
    const porcentajeSalarios = totalCompensacion > 0 ? (salarioEfectivo / totalCompensacion) * 100 : 100
    const porcentajeBonos = totalCompensacion > 0 ? (totalBonosTotal / totalCompensacion) * 100 : 0

    // Verificar cumplimiento 60/40
    const cumpleRegla6040 = porcentajeBonos <= splitConfig.porcentajeBonos

    // Calcular ajuste necesario si no cumple
    let ajusteNecesario: { reducirBonos: number, aumentarSalarios: number } | undefined
    if (!cumpleRegla6040) {
      const bonosMaximos = totalCompensacion * (splitConfig.porcentajeBonos / 100)
      const excesoBonos = totalBonosTotal - bonosMaximos
      ajusteNecesario = {
        reducirBonos: excesoBonos,
        aumentarSalarios: excesoBonos / (splitConfig.porcentajeSalario / 100)
      }
    }

    // Construir desglose por tipo
    const desglose: BonusTotals[] = []
    desglosePorTipo.forEach((data, tipo) => {
      if (data.totalEmpleados > 0) {
        desglose.push({
          tipoBono: tipo,
          totalEmpleados: data.totalEmpleados,
          montoPorEmpleado: {
            min: Math.min(...data.montos),
            max: Math.max(...data.montos),
            promedio: data.montoTotal / data.totalEmpleados
          },
          montoTotal: data.montoTotal,
          porcentajeDelTotal: totalBonosTotal > 0 ? (data.montoTotal / totalBonosTotal) * 100 : 0
        })
      }
    })

    return {
      totalSalarios: salarioEfectivo,
      totalBonosMeraLiberalidad,
      totalBonosAlimentacion,
      totalBonosDotacion,
      totalBonosViaticos,
      totalBonosReparticionUtilidades,
      totalBonosTotal,
      totalCompensacion,
      porcentajeSalarios,
      porcentajeBonos,
      cumpleRegla6040,
      ajusteNecesario,
      empleadosExcedenAlimentacion,
      empleadosNoCumplenDotacion,
      desglosePorTipo: desglose
    }
  }

  /**
   * Valida y normaliza un empleado desde entrada raw
   */
  static normalizeEmployee(rawEmployee: {
    id?: string
    nombre: string
    salario: number
    cedula?: string
    cargo?: string
    origen?: 'manual' | 'excel' | 'lote'
    loteId?: string
    bonos: Partial<Record<BonusTypeEnum, number>>
  }): EmployeeBonos2 {
    const totalBonos = Object.values(rawEmployee.bonos).reduce((sum, val) => sum + (val || 0), 0)
    const totalCompensacion = rawEmployee.salario + totalBonos

    return {
      id: rawEmployee.id || crypto.randomUUID(),
      nombre: rawEmployee.nombre,
      salario: rawEmployee.salario,
      cedula: rawEmployee.cedula,
      cargo: rawEmployee.cargo,
      origen: rawEmployee.origen || 'manual',
      loteId: rawEmployee.loteId,
      bonos: rawEmployee.bonos,
      totalBonos,
      totalCompensacion,
      porcentajeBonos: totalCompensacion > 0 ? (totalBonos / totalCompensacion) * 100 : 0,
      porcentajeSalario: totalCompensacion > 0 ? (rawEmployee.salario / totalCompensacion) * 100 : 100
    }
  }
}
