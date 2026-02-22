/**
 * Store Zustand para Bonos 2.0
 * Manejo de estado centralizado del wizard
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Bonos2WizardState,
  WizardConfiguration,
  LoteBonos2,
  EmployeeBonos2,
  ExcelLoadResult,
  ValidationSummary,
  FinancialSummary,
  TikinCommission,
  SavingsEstimate,
  SplitConfig,
  CompanyData,
  FlujoTipo,
  EmployeeIntegral,
  LoteIntegral,
  IntegralFinancialSummary,
  BonusConfigItem,
  BonusTotals
} from '@/lib/bonos/types'
import {
  DEFAULT_SALARY_PERCENTAGE,
  DEFAULT_BONUS_PERCENTAGE,
  DataInputMethod,
  BonusTypeEnum,
  BonusCategory,
  BONUS_TYPES_METADATA,
  SALARIO_INTEGRAL_MINIMO
} from '@/lib/bonos/constants'
import { ValidationEngine } from '@/lib/bonos/validationEngine'
import {
  calculateTikinCommissionBonos2,
  calculateSavingsEstimateBonos2
} from '@/lib/bonos/calculations'
import { getActiveFees } from '@/lib/bonos/fee-provider'
import { calculateIntegralSummary } from '@/lib/bonos/integral-calculations'
import { calcularLimiteLey1393 } from '@/lib/bonos/integral-cap'
import { ARLRiskLevel } from '@/lib/constants/parafiscales'

interface Bonos2Store extends Bonos2WizardState {
  // Acciones del wizard
  setPasoActual: (paso: number) => void
  siguientePaso: () => void
  pasoAnterior: () => void

  // Selección de flujo (Paso 0)
  setFlujoSeleccionado: (flujo: FlujoTipo) => void

  // Configuración
  setConfiguracion: (config: Partial<WizardConfiguration>) => void
  setSplitConfig: (split: SplitConfig) => void
  setDataLoadMethod: (metodo: DataInputMethod) => void
  toggleBonusType: (tipo: BonusTypeEnum) => void
  setBonusConfig: (config: Partial<Record<BonusTypeEnum, BonusConfigItem>>) => void
  aplicarBonosALotes: () => void

  // Datos de entrada
  addLote: (lote: Omit<LoteBonos2, 'id'>) => void
  updateLote: (id: string, updates: Partial<LoteBonos2>) => void
  removeLote: (id: string) => void
  addEmpleado: (empleado: Omit<EmployeeBonos2, 'id' | 'totalBonos' | 'totalCompensacion' | 'porcentajeBonos' | 'porcentajeSalario'>) => void
  updateEmpleado: (id: string, updates: Partial<EmployeeBonos2>) => void
  removeEmpleado: (id: string) => void
  setArchivoExcel: (archivo: ExcelLoadResult) => void
  expandirLotesAEmpleados: () => void

  // Validación
  ejecutarValidacion: () => void
  limpiarValidacion: () => void

  // Cálculos
  calcularResumenFinanciero: () => void
  calcularComisiones: () => Promise<void>
  calcularAhorros: () => void

  // Datos de empresa
  setDatosEmpresa: (datos: CompanyData) => void

  // Excel data loading
  setEmpleadosFromExcel: (empleados: EmployeeBonos2[]) => void
  setEmpleadosIntegralFromExcel: (empleados: EmployeeIntegral[]) => void

  // Salario Integral (Paso 2 del flujo integral)
  addEmpleadoIntegral: (empleado: Omit<EmployeeIntegral, 'id'>) => void
  removeEmpleadoIntegral: (id: string) => void
  addLoteIntegral: (lote: Omit<LoteIntegral, 'id'>) => void
  removeLoteIntegral: (id: string) => void
  calcularResumenIntegral: () => Promise<void>

  // Persistencia
  marcarComoGuardado: (cotizacionId: string) => void
  resetear: () => void
}

/**
 * Estado inicial del wizard
 */
const estadoInicial: Bonos2WizardState = {
  pasoActual: 0,
  flujoSeleccionado: null,
  configuracion: {
    split: {
      tipo: '60/40',
      porcentajeSalario: DEFAULT_SALARY_PERCENTAGE,
      porcentajeBonos: DEFAULT_BONUS_PERCENTAGE,
      esValido: true,
      warnings: []
    },
    bonusSelection: {
      modo: 'individual',
      tiposSeleccionados: [],
      incluirDotacion: false
    },
    dataLoad: {
      metodo: DataInputMethod.LOTES,
      permitirLotes: true,
      permitirExcel: true
    },
    bonusConfig: {}
  },
  lotes: [],
  empleados: [],
  archivoExcel: undefined,
  validacion: null,
  resumenFinanciero: null,
  comisionesTikin: null,
  ahorrosEstimados: null,
  datosEmpresa: null,
  empleadosIntegral: [],
  lotesIntegral: [],
  resumenIntegral: null,
  fechaCreacion: new Date(),
  ultimaActualizacion: new Date(),
  guardadoEnBD: false,
  cotizacionId: undefined
}

/**
 * Store principal
 */
export const useBonosStore = create<Bonos2Store>()(
  persist(
    (set, get) => ({
      ...estadoInicial,

      // ============================================
      // NAVEGACIÓN DEL WIZARD
      // ============================================

      setPasoActual: (paso: number) => {
        set({ pasoActual: paso, ultimaActualizacion: new Date() })
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
      },

      siguientePaso: () => {
        const { pasoActual } = get()
        const maxPaso = 4 // All flows now have 5 steps (0-4)
        if (pasoActual < maxPaso) {
          set({ pasoActual: pasoActual + 1, ultimaActualizacion: new Date() })
          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      },

      pasoAnterior: () => {
        const { pasoActual } = get()
        if (pasoActual > 0) {
          set({ pasoActual: pasoActual - 1, ultimaActualizacion: new Date() })
          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      },

      // ============================================
      // SELECCIÓN DE FLUJO (PASO 0)
      // ============================================

      setFlujoSeleccionado: (flujo: FlujoTipo) => {
        set({ flujoSeleccionado: flujo, ultimaActualizacion: new Date() })
      },

      // ============================================
      // CONFIGURACIÓN
      // ============================================

      setConfiguracion: (config: Partial<WizardConfiguration>) => {
        set(state => ({
          configuracion: { ...state.configuracion, ...config },
          ultimaActualizacion: new Date()
        }))
      },

      setSplitConfig: (split: SplitConfig) => {
        set(state => ({
          configuracion: {
            ...state.configuracion,
            split
          },
          ultimaActualizacion: new Date()
        }))
      },

      setDataLoadMethod: (metodo: DataInputMethod) => {
        set(state => ({
          configuracion: {
            ...state.configuracion,
            dataLoad: {
              ...state.configuracion.dataLoad,
              metodo
            }
          },
          ultimaActualizacion: new Date()
        }))
      },

      toggleBonusType: (tipo: BonusTypeEnum) => {
        set(state => {
          const tiposSeleccionados = state.configuracion.bonusSelection.tiposSeleccionados
          const existe = tiposSeleccionados.includes(tipo)

          return {
            configuracion: {
              ...state.configuracion,
              bonusSelection: {
                ...state.configuracion.bonusSelection,
                tiposSeleccionados: existe
                  ? tiposSeleccionados.filter(t => t !== tipo)
                  : [...tiposSeleccionados, tipo],
                incluirDotacion: tipo === BonusTypeEnum.DOTACION
                  ? !existe
                  : state.configuracion.bonusSelection.incluirDotacion
              }
            },
            ultimaActualizacion: new Date()
          }
        })
      },

      setBonusConfig: (config) => {
        set(state => ({
          configuracion: {
            ...state.configuracion,
            bonusConfig: config
          },
          ultimaActualizacion: new Date()
        }))
      },

      aplicarBonosALotes: () => {
        const { lotes, empleados, configuracion } = get()
        const bonusConfig = configuracion.bonusConfig

        // Update each lote with calculated bonus amounts
        const updatedLotes = lotes.map(lote => {
          const bonos: Partial<Record<BonusTypeEnum, number>> = {}
          let totalBonos = 0

          Object.entries(bonusConfig).forEach(([tipo, cfg]) => {
            if (!cfg) return
            const monto = cfg.mode === 'fijo'
              ? cfg.valor
              : lote.salarioPorEmpleado * (cfg.valor / 100)
            bonos[tipo as BonusTypeEnum] = monto
            totalBonos += monto
          })

          return {
            ...lote,
            bonos,
            totalBonos: totalBonos * lote.cantidad,
            totalCompensacion: lote.totalSalarios + (totalBonos * lote.cantidad)
          }
        })

        // Update manual employees with calculated bonus amounts
        const updatedEmpleados = empleados.map(emp => {
          if (emp.origen === 'lote') return emp // Lote employees get recalculated from lotes
          const bonos: Partial<Record<BonusTypeEnum, number>> = {}
          let totalBonos = 0

          Object.entries(bonusConfig).forEach(([tipo, cfg]) => {
            if (!cfg) return
            const monto = cfg.mode === 'fijo'
              ? cfg.valor
              : emp.salario * (cfg.valor / 100)
            bonos[tipo as BonusTypeEnum] = monto
            totalBonos += monto
          })

          return {
            ...emp,
            bonos,
            totalBonos,
            totalCompensacion: emp.salario + totalBonos,
            porcentajeBonos: (emp.salario + totalBonos) > 0 ? (totalBonos / (emp.salario + totalBonos)) * 100 : 0,
            porcentajeSalario: (emp.salario + totalBonos) > 0 ? (emp.salario / (emp.salario + totalBonos)) * 100 : 0
          }
        })

        set({
          lotes: updatedLotes,
          empleados: updatedEmpleados,
          ultimaActualizacion: new Date()
        })
      },

      // ============================================
      // LOTES (PASO 1)
      // ============================================

      addLote: (loteData) => {
        const id = crypto.randomUUID()
        const lote: LoteBonos2 = {
          ...loteData,
          id,
          totalSalarios: loteData.cantidad * loteData.salarioPorEmpleado,
          totalBonos: Object.values(loteData.bonos).reduce((sum, val) => sum + (val || 0), 0) * loteData.cantidad,
          totalCompensacion: 0, // Se calcula después
          expandido: false
        }
        lote.totalCompensacion = lote.totalSalarios + lote.totalBonos

        set(state => ({
          lotes: [...state.lotes, lote],
          ultimaActualizacion: new Date()
        }))
      },

      updateLote: (id, updates) => {
        set(state => ({
          lotes: state.lotes.map(lote => {
            if (lote.id === id) {
              const updated = { ...lote, ...updates }
              updated.totalSalarios = updated.cantidad * updated.salarioPorEmpleado
              updated.totalBonos = Object.values(updated.bonos).reduce((sum, val) => sum + (val || 0), 0) * updated.cantidad
              updated.totalCompensacion = updated.totalSalarios + updated.totalBonos
              return updated
            }
            return lote
          }),
          ultimaActualizacion: new Date()
        }))
      },

      removeLote: (id) => {
        set(state => ({
          lotes: state.lotes.filter(lote => lote.id !== id),
          empleados: state.empleados.filter(emp => emp.loteId !== id),
          ultimaActualizacion: new Date()
        }))
      },

      // ============================================
      // EMPLEADOS (PASO 1)
      // ============================================

      addEmpleado: (empleadoData) => {
        const empleado = ValidationEngine.normalizeEmployee({
          ...empleadoData,
          id: crypto.randomUUID()
        })

        set(state => ({
          empleados: [...state.empleados, empleado],
          ultimaActualizacion: new Date()
        }))
      },

      updateEmpleado: (id, updates) => {
        set(state => ({
          empleados: state.empleados.map(emp => {
            if (emp.id === id) {
              return ValidationEngine.normalizeEmployee({ ...emp, ...updates })
            }
            return emp
          }),
          ultimaActualizacion: new Date()
        }))
      },

      removeEmpleado: (id) => {
        set(state => ({
          empleados: state.empleados.filter(emp => emp.id !== id),
          ultimaActualizacion: new Date()
        }))
      },

      setArchivoExcel: (archivo) => {
        set({
          archivoExcel: archivo,
          empleados: archivo.empleados,
          lotes: [],
          ultimaActualizacion: new Date()
        })
      },

      expandirLotesAEmpleados: () => {
        const { lotes } = get()
        const empleadosDeExpansion: EmployeeBonos2[] = []

        lotes.forEach(lote => {
          for (let i = 0; i < lote.cantidad; i++) {
            const empleado = ValidationEngine.normalizeEmployee({
              nombre: `${lote.nombre} - Empleado ${i + 1}`,
              salario: lote.salarioPorEmpleado,
              origen: 'lote',
              loteId: lote.id,
              bonos: lote.bonos
            })
            empleadosDeExpansion.push(empleado)
          }
        })

        set(state => ({
          empleados: [...state.empleados, ...empleadosDeExpansion],
          ultimaActualizacion: new Date()
        }))
      },

      // ============================================
      // VALIDACIÓN (PASO 2)
      // ============================================

      ejecutarValidacion: () => {
        const { empleados, configuracion } = get()

        // Primero expandir lotes si es necesario
        const { lotes } = get()
        let empleadosParaValidar = [...empleados]

        if (lotes.length > 0) {
          lotes.forEach(lote => {
            for (let i = 0; i < lote.cantidad; i++) {
              const empleadoLote = ValidationEngine.normalizeEmployee({
                nombre: `${lote.nombre} - Empleado ${i + 1}`,
                salario: lote.salarioPorEmpleado,
                origen: 'lote',
                loteId: lote.id,
                bonos: lote.bonos
              })
              empleadosParaValidar.push(empleadoLote)
            }
          })
        }

        const validacion = ValidationEngine.validateAllEmployees(
          empleadosParaValidar,
          configuracion.split
        )

        set({
          validacion,
          ultimaActualizacion: new Date()
        })
      },

      limpiarValidacion: () => {
        set({ validacion: null })
      },

      // ============================================
      // CÁLCULOS FINANCIEROS (PASO 3)
      // ============================================

      calcularResumenFinanciero: () => {
        const { empleados, lotes, configuracion, flujoSeleccionado } = get()

        // Expandir lotes a empleados para cálculo
        let todosEmpleados = [...empleados]
        lotes.forEach(lote => {
          for (let i = 0; i < lote.cantidad; i++) {
            const empleadoLote = ValidationEngine.normalizeEmployee({
              nombre: `${lote.nombre} - Empleado ${i + 1}`,
              salario: lote.salarioPorEmpleado,
              origen: 'lote',
              loteId: lote.id,
              bonos: lote.bonos
            })
            todosEmpleados.push(empleadoLote)
          }
        })

        const resumen = ValidationEngine.calculateFinancialSummary(
          todosEmpleados,
          configuracion.split,
          flujoSeleccionado
        )

        set({
          resumenFinanciero: resumen,
          ultimaActualizacion: new Date()
        })
      },

      calcularComisiones: async () => {
        const { resumenFinanciero } = get()
        if (!resumenFinanciero) return

        const fees = await getActiveFees()

        const comisiones = calculateTikinCommissionBonos2(
          resumenFinanciero.totalBonosMeraLiberalidad,
          resumenFinanciero.totalBonosAlimentacion,
          resumenFinanciero.totalBonosDotacion,
          resumenFinanciero.totalBonosViaticos || 0,
          fees,
          resumenFinanciero.totalBonosReparticionUtilidades || 0
        )

        set({
          comisionesTikin: comisiones,
          ultimaActualizacion: new Date()
        })
      },

      calcularAhorros: () => {
        const { empleados, lotes, comisionesTikin, datosEmpresa, flujoSeleccionado } = get()
        if (!comisionesTikin) return

        const esReestructuracion = flujoSeleccionado === 'beneficios_actuales'

        // Expandir lotes a empleados (con ARL heredado del lote)
        let todosEmpleados = [...empleados]
        lotes.forEach(lote => {
          for (let i = 0; i < lote.cantidad; i++) {
            const empleadoLote = ValidationEngine.normalizeEmployee({
              nombre: `${lote.nombre} - Empleado ${i + 1}`,
              salario: lote.salarioPorEmpleado,
              origen: 'lote',
              loteId: lote.id,
              bonos: lote.bonos
            })
            // Inherit ARL from lote
            empleadoLote.arlRiskLevel = lote.arlRiskLevel
            todosEmpleados.push(empleadoLote)
          }
        })

        // Calculate effective salary percentage from actual data
        // beneficios_actuales: bonos salen del salario → IBC = salario - bonos
        // nuevos_beneficios: bonos se agregan al salario → IBC = salario (sin cambio)
        const totalSalariosOriginales = todosEmpleados.reduce((sum, emp) => sum + emp.salario, 0)
        const totalBonos = todosEmpleados.reduce((sum, emp) => sum + emp.totalBonos, 0)
        const totalCompensacion = esReestructuracion
          ? totalSalariosOriginales                    // $10M
          : totalSalariosOriginales + totalBonos       // $14M
        const salarioEfectivo = esReestructuracion
          ? totalSalariosOriginales - totalBonos       // $6M
          : totalSalariosOriginales                    // $10M
        const effectiveSalaryPercentage = totalCompensacion > 0
          ? Math.round((salarioEfectivo / totalCompensacion) * 100)
          : 60

        // Use ARL from first employee's lote or default to I
        const arlRiskLevel: ARLRiskLevel = todosEmpleados[0]?.arlRiskLevel || 'I'

        // Read regimen from company data
        const regimen = datosEmpresa?.regimenParafiscales || 'general'

        const ahorros = calculateSavingsEstimateBonos2(
          todosEmpleados,
          effectiveSalaryPercentage,
          arlRiskLevel,
          comisionesTikin,
          regimen,
          esReestructuracion
        )

        set({
          ahorrosEstimados: ahorros,
          ultimaActualizacion: new Date()
        })
      },

      // ============================================
      // EXCEL DATA LOADING
      // ============================================

      setEmpleadosFromExcel: (empleados) => {
        set({
          empleados,
          lotes: [],
          ultimaActualizacion: new Date()
        })
      },

      setEmpleadosIntegralFromExcel: (empleados) => {
        set({
          empleadosIntegral: empleados,
          lotesIntegral: [],
          ultimaActualizacion: new Date()
        })
      },

      // ============================================
      // SALARIO INTEGRAL
      // ============================================

      addEmpleadoIntegral: (empleadoData) => {
        const empleado: EmployeeIntegral = {
          ...empleadoData,
          id: crypto.randomUUID()
        }
        set(state => ({
          empleadosIntegral: [...state.empleadosIntegral, empleado],
          ultimaActualizacion: new Date()
        }))
      },

      removeEmpleadoIntegral: (id) => {
        set(state => ({
          empleadosIntegral: state.empleadosIntegral.filter(e => e.id !== id),
          ultimaActualizacion: new Date()
        }))
      },

      addLoteIntegral: (loteData) => {
        const lote: LoteIntegral = {
          ...loteData,
          id: crypto.randomUUID()
        }
        set(state => ({
          lotesIntegral: [...state.lotesIntegral, lote],
          ultimaActualizacion: new Date()
        }))
      },

      removeLoteIntegral: (id) => {
        set(state => ({
          lotesIntegral: state.lotesIntegral.filter(l => l.id !== id),
          empleadosIntegral: state.empleadosIntegral.filter(e => e.loteId !== id),
          ultimaActualizacion: new Date()
        }))
      },

      calcularResumenIntegral: async () => {
        const { empleadosIntegral, lotesIntegral, datosEmpresa, configuracion } = get()

        // Expand lotes into individual employees (with ARL inherited from lote)
        const todosEmpleados: EmployeeIntegral[] = [...empleadosIntegral]
        lotesIntegral.forEach(lote => {
          for (let i = 0; i < lote.cantidad; i++) {
            todosEmpleados.push({
              id: crypto.randomUUID(),
              nombre: `${lote.nombre} - Empleado ${i + 1}`,
              salarioActual: lote.salarioActualPorEmpleado,
              origen: 'lote',
              loteId: lote.id,
              arlRiskLevel: lote.arlRiskLevel
            })
          }
        })

        // Integral NUNCA aplica exoneración (Art. 114-1 E.T.: integral ≥ 13 SMMLV > 10 SMMLV)
        const resumen = calculateIntegralSummary(todosEmpleados)

        // ============================================
        // COMISIÓN POR RANGOS: calcular montos por categoría de bonos
        // ============================================
        const bonusConfig = configuracion.bonusConfig
        const tiposSeleccionados = configuracion.bonusSelection.tiposSeleccionados

        // Calculate average salary and total eligible employees for bonus resolution
        const elegibles = todosEmpleados.filter(e => e.salarioActual >= SALARIO_INTEGRAL_MINIMO)
        const totalNomina = todosEmpleados.reduce((sum, e) => sum + e.salarioActual, 0)
        const salarioPromedio = todosEmpleados.length > 0 ? totalNomina / todosEmpleados.length : 0

        // Helper to resolve bonus amount
        const resolveBonus = (config: BonusConfigItem, salary: number): number => {
          if (config.mode === 'fijo') return config.valor
          return salary * config.valor / 100
        }

        // Aggregate per-category totals across eligible employees
        let totalML = 0
        let totalAlimentacion = 0
        let totalDotacion = 0
        let totalViaticos = 0
        let totalReparticion = 0
        const desglosePorTipo: BonusTotals[] = []

        for (const tipo of tiposSeleccionados) {
          const cfg = bonusConfig[tipo]
          if (!cfg || cfg.valor <= 0) continue
          const meta = BONUS_TYPES_METADATA[tipo as BonusTypeEnum]
          if (!meta) continue

          const montoPorEmpleado = resolveBonus(cfg, salarioPromedio)
          const montoTotal = montoPorEmpleado * elegibles.length

          // Accumulate by category
          switch (meta.categoria) {
            case BonusCategory.MERA_LIBERALIDAD:
              totalML += montoTotal
              break
            case BonusCategory.ALIMENTACION:
              totalAlimentacion += montoTotal
              break
            case BonusCategory.DOTACION:
              totalDotacion += montoTotal
              break
            case BonusCategory.VIATICOS:
              totalViaticos += montoTotal
              break
            case BonusCategory.REPARTICION_UTILIDADES:
              totalReparticion += montoTotal
              break
          }

          // Build desglose entry
          desglosePorTipo.push({
            tipoBono: tipo as BonusTypeEnum,
            totalEmpleados: elegibles.length,
            montoPorEmpleado: {
              min: montoPorEmpleado,
              max: montoPorEmpleado,
              promedio: montoPorEmpleado
            },
            montoTotal,
            porcentajeDelTotal: 0 // calculated below
          })
        }

        // Calculate percentage of total for each bonus type
        const totalBonos = totalML + totalAlimentacion + totalDotacion + totalViaticos + totalReparticion
        for (const d of desglosePorTipo) {
          d.porcentajeDelTotal = totalBonos > 0 ? (d.montoTotal / totalBonos) * 100 : 0
        }

        // ============================================
        // CUMPLIMIENTO LEY 1393/2010 — TOPE 40%
        // ============================================
        const numElegibles = elegibles.length || 1
        const bonosCapadosTotal = totalML + totalAlimentacion
        const bonosExentosTotal = totalReparticion + totalViaticos + totalDotacion
        const bonosCapadosPorEmpleado = bonosCapadosTotal / numElegibles
        const bonosExentosPorEmpleado = bonosExentosTotal / numElegibles

        const ley1393 = calcularLimiteLey1393(
          SALARIO_INTEGRAL_MINIMO,
          bonosCapadosPorEmpleado,
          bonosExentosPorEmpleado
        )

        const cumplimiento40 = {
          factorPrestacional: ley1393.factorPrestacional,
          bonosCapados: bonosCapadosTotal,
          bonosCapadosPorEmpleado,
          bonosExentos: bonosExentosTotal,
          bonosExentosPorEmpleado,
          totalNoSalarial: ley1393.noSalarialTotal,
          totalDevengado: ley1393.totalDevengado,
          porcentajeNoSalarial: ley1393.noSalarialPct,
          limiteBonosCapPorEmpleado: ley1393.limiteBonosCap,
          limiteBonosCapTotal: ley1393.limiteBonosCap * numElegibles,
          holgura: ley1393.holgura * numElegibles,
          cumple: ley1393.cumple,
          exceso: ley1393.exceso * numElegibles
        }

        // Calculate commission using fee by ranges (same model as other flows)
        const fees = await getActiveFees()
        const comision = calculateTikinCommissionBonos2(
          totalML,
          totalAlimentacion,
          totalDotacion,
          totalViaticos,
          fees,
          totalReparticion
        )

        // Update resumen with new commission and bonus breakdown
        const beneficioNetoMensual = resumen.ahorroTotalMensual - comision.totalConIva
        const updatedResumen: IntegralFinancialSummary = {
          ...resumen,
          comisionTikin: comision,
          beneficioNetoMensual,
          beneficioNetoAnual: beneficioNetoMensual * 12,
          desglosePorTipo,
          totalBonos,
          cumplimiento40
        }

        set({
          resumenIntegral: updatedResumen,
          comisionesTikin: comision,
          ultimaActualizacion: new Date()
        })
      },

      // ============================================
      // DATOS DE EMPRESA (PASO 0)
      // ============================================

      setDatosEmpresa: (datos) => {
        set({
          datosEmpresa: datos,
          ultimaActualizacion: new Date()
        })
      },

      // ============================================
      // PERSISTENCIA
      // ============================================

      marcarComoGuardado: (cotizacionId) => {
        set({
          guardadoEnBD: true,
          cotizacionId,
          ultimaActualizacion: new Date()
        })
      },

      resetear: () => {
        set({
          ...estadoInicial,
          fechaCreacion: new Date(),
          ultimaActualizacion: new Date()
        })
      }
    }),
    {
      name: 'bonos-storage', // Nombre para localStorage
      partialize: (state) => ({
        // Solo persistir lo necesario
        pasoActual: state.pasoActual,
        flujoSeleccionado: state.flujoSeleccionado,
        configuracion: state.configuracion,
        lotes: state.lotes,
        empleados: state.empleados,
        datosEmpresa: state.datosEmpresa,
        empleadosIntegral: state.empleadosIntegral,
        lotesIntegral: state.lotesIntegral,
        fechaCreacion: state.fechaCreacion,
        cotizacionId: state.cotizacionId
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<Bonos2WizardState>

        // TTL: descartar datos con más de 24 horas
        const createdAt = persisted.fechaCreacion ? new Date(persisted.fechaCreacion).getTime() : 0
        const hoursSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60)
        if (hoursSinceCreation > 24) {
          return currentState // datos expirados, empezar limpio
        }

        // Clamp pasoActual to valid range after rehydration
        // All flows now have 5 steps (0-4)
        const maxPaso = 4
        const pasoActual = (persisted.pasoActual !== undefined && persisted.pasoActual >= 0 && persisted.pasoActual <= maxPaso)
          ? persisted.pasoActual
          : 0
        return {
          ...currentState,
          ...persisted,
          pasoActual,
        }
      }
    }
  )
)
