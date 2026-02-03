'use client'

import { useState, useEffect } from 'react'
import { Employee, BonusType, BonusConfig, BonusAssignment, LIMITE_ALIMENTACION_MENSUAL } from '@/types/bonuses'
import {
  distributeProportionally,
  distributeFixed,
  validateAlimentacionAssignments,
  redistributeExcess,
  calculateMeraLiberalidadFee,
  calculateAlimentacionFee
} from '@/lib/bonuses/calculations'
import { formatCOP } from '@/lib/formatters'

interface BonusDistributionProps {
  empleados: Employee[]
  tipoSeleccionado: BonusType
  onConfigsComplete: (configML?: BonusConfig, configAL?: BonusConfig) => void
  onBack: () => void
  initialConfigML?: BonusConfig
  initialConfigAL?: BonusConfig
}

export function BonusDistribution({
  empleados,
  tipoSeleccionado,
  onConfigsComplete,
  onBack,
  initialConfigML,
  initialConfigAL
}: BonusDistributionProps) {
  const [activeTab, setActiveTab] = useState<'mera_liberalidad' | 'alimentacion'>(
    tipoSeleccionado === 'alimentacion' ? 'alimentacion' : 'mera_liberalidad'
  )

  // Mera Liberalidad state
  const [mlMetodo, setMlMetodo] = useState<'proporcional' | 'fijo' | 'personalizado'>(
    initialConfigML?.metodoDistribucion || 'proporcional'
  )
  const [mlMontoTotal, setMlMontoTotal] = useState<string>(
    initialConfigML?.montoTotal.toString() || ''
  )
  const [mlMontoPorEmpleado, setMlMontoPorEmpleado] = useState<string>('')
  const [mlConfig, setMlConfig] = useState<BonusConfig | undefined>(initialConfigML)

  // Alimentación state
  const [alMetodo, setAlMetodo] = useState<'proporcional' | 'fijo' | 'personalizado'>(
    initialConfigAL?.metodoDistribucion || 'proporcional'
  )
  const [alMontoTotal, setAlMontoTotal] = useState<string>(
    initialConfigAL?.montoTotal.toString() || ''
  )
  const [alMontoPorEmpleado, setAlMontoPorEmpleado] = useState<string>('')
  const [alConfig, setAlConfig] = useState<BonusConfig | undefined>(initialConfigAL)
  const [alValidacion, setAlValidacion] = useState<{ valido: boolean; errores: any[] }>({
    valido: true,
    errores: []
  })

  const needsMeraLiberalidad = tipoSeleccionado === 'mera_liberalidad' || tipoSeleccionado === 'ambos'
  const needsAlimentacion = tipoSeleccionado === 'alimentacion' || tipoSeleccionado === 'ambos'

  const canContinue =
    (needsMeraLiberalidad ? mlConfig !== undefined : true) &&
    (needsAlimentacion ? alConfig !== undefined && alValidacion.valido : true)

  // Calculate Mera Liberalidad distribution
  const handleCalculateML = () => {
    let asignaciones: BonusAssignment[] = []
    let montoTotal = 0

    if (mlMetodo === 'proporcional') {
      montoTotal = parseFloat(mlMontoTotal)
      if (!montoTotal || montoTotal <= 0) {
        alert('Ingresa un monto total válido')
        return
      }
      asignaciones = distributeProportionally(empleados, montoTotal)
    } else if (mlMetodo === 'fijo') {
      const montoPorEmpleado = parseFloat(mlMontoPorEmpleado)
      if (!montoPorEmpleado || montoPorEmpleado <= 0) {
        alert('Ingresa un monto por empleado válido')
        return
      }
      asignaciones = distributeFixed(empleados, montoPorEmpleado)
      montoTotal = asignaciones.reduce((sum, a) => sum + a.montoBono, 0)
    }

    // Calculate fee
    const feeInfo = calculateMeraLiberalidadFee(montoTotal)

    const config: BonusConfig = {
      tipo: 'mera_liberalidad',
      montoTotal,
      metodoDistribucion: mlMetodo,
      asignaciones,
      feePercentage: feeInfo.percentage,
      feeAmount: feeInfo.feeAmount,
      iva: feeInfo.iva,
      totalConFee: montoTotal + feeInfo.total,
      validado: true
    }

    setMlConfig(config)
  }

  // Calculate Alimentación distribution
  const handleCalculateAL = () => {
    let asignaciones: BonusAssignment[] = []
    let montoTotal = 0

    if (alMetodo === 'proporcional') {
      montoTotal = parseFloat(alMontoTotal)
      if (!montoTotal || montoTotal <= 0) {
        alert('Ingresa un monto total válido')
        return
      }
      asignaciones = distributeProportionally(empleados, montoTotal, LIMITE_ALIMENTACION_MENSUAL)
    } else if (alMetodo === 'fijo') {
      const montoPorEmpleado = parseFloat(alMontoPorEmpleado)
      if (!montoPorEmpleado || montoPorEmpleado <= 0) {
        alert('Ingresa un monto por empleado válido')
        return
      }
      asignaciones = distributeFixed(empleados, montoPorEmpleado, LIMITE_ALIMENTACION_MENSUAL)
      montoTotal = asignaciones.reduce((sum, a) => sum + a.montoBono, 0)
    }

    // Validate
    const validacion = validateAlimentacionAssignments(asignaciones)
    setAlValidacion(validacion)

    // Calculate fee
    const feeInfo = calculateAlimentacionFee(montoTotal)

    const config: BonusConfig = {
      tipo: 'alimentacion',
      montoTotal,
      metodoDistribucion: alMetodo,
      asignaciones,
      feePercentage: feeInfo.percentage,
      feeAmount: feeInfo.feeAmount,
      iva: feeInfo.iva,
      totalConFee: montoTotal + feeInfo.total,
      empleadosExcedenLimite: validacion.errores.length,
      excesoTotal: validacion.totalExceso,
      validado: validacion.valido
    }

    setAlConfig(config)
  }

  const handleRedistributeExcess = () => {
    if (!alConfig) return

    const asignacionesRedistribuidas = redistributeExcess(alConfig.asignaciones)
    const validacion = validateAlimentacionAssignments(asignacionesRedistribuidas)
    setAlValidacion(validacion)

    const nuevoMontoTotal = asignacionesRedistribuidas.reduce((sum, a) => sum + a.montoBono, 0)
    const feeInfo = calculateAlimentacionFee(nuevoMontoTotal)

    setAlConfig({
      ...alConfig,
      montoTotal: nuevoMontoTotal,
      asignaciones: asignacionesRedistribuidas,
      feeAmount: feeInfo.feeAmount,
      iva: feeInfo.iva,
      totalConFee: nuevoMontoTotal + feeInfo.total,
      empleadosExcedenLimite: validacion.errores.length,
      excesoTotal: validacion.totalExceso,
      validado: validacion.valido
    })
  }

  const handleContinue = () => {
    onConfigsComplete(mlConfig, alConfig)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Configuración de Distribución
        </h2>
        <p className="text-gray-600">
          Define cómo deseas distribuir los bonos entre tus empleados
        </p>
      </div>

      {/* Tabs if both types */}
      {tipoSeleccionado === 'ambos' && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('mera_liberalidad')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'mera_liberalidad'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Mera Liberalidad
          </button>
          <button
            onClick={() => setActiveTab('alimentacion')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'alimentacion'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Alimentación
          </button>
        </div>
      )}

      {/* Mera Liberalidad Configuration */}
      {needsMeraLiberalidad && (tipoSeleccionado !== 'ambos' || activeTab === 'mera_liberalidad') && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Bonos de Mera Liberalidad
          </h3>

          {/* Method selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Método de Distribución
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setMlMetodo('proporcional')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  mlMetodo === 'proporcional'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">Proporcional al Salario</p>
                <p className="text-sm text-gray-600 mt-1">
                  Cada empleado recibe bonos proporcionales a su salario
                </p>
              </button>
              <button
                onClick={() => setMlMetodo('fijo')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  mlMetodo === 'fijo'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">Monto Fijo</p>
                <p className="text-sm text-gray-600 mt-1">
                  Todos los empleados reciben el mismo monto
                </p>
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div className="mb-6">
            {mlMetodo === 'proporcional' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Total a Distribuir
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={mlMontoTotal}
                  onChange={(e) => setMlMontoTotal(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 10000000"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto por Empleado
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={mlMontoPorEmpleado}
                  onChange={(e) => setMlMontoPorEmpleado(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 500000"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleCalculateML}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
          >
            Calcular Distribución
          </button>

          {/* Results */}
          {mlConfig && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-900">Resumen</h4>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✓ Configurado
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total en bonos:</span>
                  <span className="font-medium text-gray-900">{formatCOP(mlConfig.montoTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee ({(mlConfig.feePercentage * 100).toFixed(2)}%):</span>
                  <span className="font-medium text-gray-900">{formatCOP(mlConfig.feeAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA (19%):</span>
                  <span className="font-medium text-gray-900">{formatCOP(mlConfig.iva)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-300">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-semibold text-blue-600">{formatCOP(mlConfig.totalConFee)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alimentación Configuration */}
      {needsAlimentacion && (tipoSeleccionado !== 'ambos' || activeTab === 'alimentacion') && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Bonos de Alimentación
          </h3>

          {/* Method selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Método de Distribución
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setAlMetodo('proporcional')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  alMetodo === 'proporcional'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">Proporcional al Salario</p>
                <p className="text-sm text-gray-600 mt-1">
                  Cada empleado recibe bonos proporcionales a su salario
                </p>
              </button>
              <button
                onClick={() => setAlMetodo('fijo')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  alMetodo === 'fijo'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">Monto Fijo</p>
                <p className="text-sm text-gray-600 mt-1">
                  Todos los empleados reciben el mismo monto
                </p>
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div className="mb-6">
            {alMetodo === 'proporcional' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Total a Distribuir
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={alMontoTotal}
                  onChange={(e) => setAlMontoTotal(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ej: 5000000"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto por Empleado
                </label>
                <input
                  type="number"
                  min="0"
                  max={LIMITE_ALIMENTACION_MENSUAL}
                  step="1000"
                  value={alMontoPorEmpleado}
                  onChange={(e) => setAlMontoPorEmpleado(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={`Máximo: ${formatCOP(LIMITE_ALIMENTACION_MENSUAL)}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Límite legal: {formatCOP(LIMITE_ALIMENTACION_MENSUAL)} por empleado/mes
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleCalculateAL}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
          >
            Calcular Distribución
          </button>

          {/* Validation errors */}
          {alConfig && !alValidacion.valido && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-red-600 text-xl">⚠️</span>
                <h4 className="font-semibold text-red-900">
                  {alValidacion.errores.length} empleado(s) exceden el límite
                </h4>
              </div>
              <p className="text-sm text-red-700 mb-3">
                Los siguientes empleados superan el límite legal de {formatCOP(LIMITE_ALIMENTACION_MENSUAL)}:
              </p>
              <div className="space-y-2 mb-4">
                {alValidacion.errores.slice(0, 3).map((error) => (
                  <div key={error.empleadoId} className="text-sm bg-white rounded p-2">
                    <p className="font-medium text-gray-900">{error.empleadoNombre}</p>
                    <p className="text-red-600">
                      Asignado: {formatCOP(error.montoAsignado)} | Exceso: {formatCOP(error.exceso)}
                    </p>
                  </div>
                ))}
                {alValidacion.errores.length > 3 && (
                  <p className="text-sm text-red-600">
                    ... y {alValidacion.errores.length - 3} más
                  </p>
                )}
              </div>
              <button
                onClick={handleRedistributeExcess}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
              >
                Redistribuir Excesos Automáticamente
              </button>
            </div>
          )}

          {/* Results */}
          {alConfig && alValidacion.valido && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-900">Resumen</h4>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✓ Validado
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total en bonos:</span>
                  <span className="font-medium text-gray-900">{formatCOP(alConfig.montoTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee (1.25%):</span>
                  <span className="font-medium text-gray-900">{formatCOP(alConfig.feeAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA (19%):</span>
                  <span className="font-medium text-gray-900">{formatCOP(alConfig.iva)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-300">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-semibold text-green-600">{formatCOP(alConfig.totalConFee)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          ← Volver
        </button>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
            canContinue
              ? 'bg-tikin-red text-white hover:bg-red-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continuar →
        </button>
      </div>

      {!canContinue && (
        <p className="text-center text-sm text-gray-600 mt-3">
          {needsMeraLiberalidad && !mlConfig && 'Configura la distribución de Mera Liberalidad'}
          {needsAlimentacion && !alConfig && ' y Alimentación'}
          {needsAlimentacion && alConfig && !alValidacion.valido && ' y resuelve los errores de validación'}
        </p>
      )}
    </div>
  )
}
