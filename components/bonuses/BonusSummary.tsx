'use client'

import { BonusCompanyData, Employee, BonusConfig, BonusType } from '@/types/bonuses'
import { formatCOP } from '@/lib/formatters'

interface BonusSummaryProps {
  tipoSeleccionado: BonusType
  companyData: BonusCompanyData
  empleados: Employee[]
  configMeraLiberalidad?: BonusConfig
  configAlimentacion?: BonusConfig
  onBack: () => void
  onConfirm: () => void
}

export function BonusSummary({
  tipoSeleccionado,
  companyData,
  empleados,
  configMeraLiberalidad,
  configAlimentacion,
  onBack,
  onConfirm
}: BonusSummaryProps) {
  const totalGeneral =
    (configMeraLiberalidad?.totalConFee || 0) +
    (configAlimentacion?.totalConFee || 0)

  const totalBonos =
    (configMeraLiberalidad?.montoTotal || 0) +
    (configAlimentacion?.montoTotal || 0)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Resumen de Dispersión de Bonos
        </h2>
        <p className="text-gray-600">
          Revisa toda la información antes de confirmar la dispersión
        </p>
      </div>

      {/* Company Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🏢</span>
          <span>Información de la Empresa</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Empresa</p>
            <p className="font-medium text-gray-900">{companyData.companyName}</p>
          </div>
          <div>
            <p className="text-gray-600">NIT</p>
            <p className="font-medium text-gray-900">{companyData.nit}</p>
          </div>
          <div>
            <p className="text-gray-600">Contacto</p>
            <p className="font-medium text-gray-900">{companyData.contactName}</p>
          </div>
          <div>
            <p className="text-gray-600">Email</p>
            <p className="font-medium text-gray-900">{companyData.email}</p>
          </div>
        </div>
      </div>

      {/* Employees */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>👥</span>
          <span>Empleados</span>
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">Total de empleados a beneficiar</p>
          <p className="text-2xl font-bold text-tikin-red">{empleados.length}</p>
        </div>
      </div>

      {/* Mera Liberalidad Summary */}
      {configMeraLiberalidad && (
        <div className="bg-white border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🎁</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Bonos de Mera Liberalidad
              </h3>
              <p className="text-sm text-gray-600">
                Método: {configMeraLiberalidad.metodoDistribucion === 'proporcional' ? 'Proporcional al salario' : 'Monto fijo'}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Empleados beneficiados:</span>
              <span className="font-semibold text-gray-900">
                {configMeraLiberalidad.asignaciones.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Total en bonos:</span>
              <span className="font-semibold text-gray-900">
                {formatCOP(configMeraLiberalidad.montoTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">
                Fee ({(configMeraLiberalidad.feePercentage * 100).toFixed(2)}%):
              </span>
              <span className="font-semibold text-gray-900">
                {formatCOP(configMeraLiberalidad.feeAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">IVA (19%):</span>
              <span className="font-semibold text-gray-900">
                {formatCOP(configMeraLiberalidad.iva)}
              </span>
            </div>
            <div className="flex justify-between text-base pt-3 border-t border-blue-300">
              <span className="font-bold text-gray-900">Subtotal:</span>
              <span className="font-bold text-blue-600">
                {formatCOP(configMeraLiberalidad.totalConFee)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Alimentación Summary */}
      {configAlimentacion && (
        <div className="bg-white border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🍽️</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bonos de Alimentación
                </h3>
                {configAlimentacion.validado && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    ✓ Validado
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Método: {configAlimentacion.metodoDistribucion === 'proporcional' ? 'Proporcional al salario' : 'Monto fijo'}
              </p>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Empleados beneficiados:</span>
              <span className="font-semibold text-gray-900">
                {configAlimentacion.asignaciones.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Total en bonos:</span>
              <span className="font-semibold text-gray-900">
                {formatCOP(configAlimentacion.montoTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Fee (1.25%):</span>
              <span className="font-semibold text-gray-900">
                {formatCOP(configAlimentacion.feeAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">IVA (19%):</span>
              <span className="font-semibold text-gray-900">
                {formatCOP(configAlimentacion.iva)}
              </span>
            </div>
            <div className="flex justify-between text-base pt-3 border-t border-green-300">
              <span className="font-bold text-gray-900">Subtotal:</span>
              <span className="font-bold text-green-600">
                {formatCOP(configAlimentacion.totalConFee)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Total General */}
      <div className="bg-gradient-to-r from-tikin-red to-red-700 text-white rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm mb-1">Total a Pagar</p>
            <p className="text-3xl font-bold">{formatCOP(totalGeneral)}</p>
          </div>
          <div className="text-right">
            <p className="text-red-100 text-sm mb-1">Total en Bonos</p>
            <p className="text-xl font-semibold">{formatCOP(totalBonos)}</p>
          </div>
        </div>
      </div>

      {/* Legal Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-900 mb-2 text-sm">
          📋 Nota Importante
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Los bonos están exentos de parafiscales según normativa colombiana</li>
          <li>• La dispersión se realizará en un plazo de 24-48 horas hábiles</li>
          <li>• Los empleados recibirán los bonos directamente en su cuenta bancaria</li>
          <li>• Se generará un reporte detallado de la dispersión</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          ← Volver
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-6 py-4 bg-tikin-red text-white rounded-lg hover:bg-red-700 font-semibold transition-colors text-lg shadow-lg"
        >
          Confirmar Dispersión ✓
        </button>
      </div>

      <p className="text-center text-xs text-gray-500 mt-4">
        Al confirmar, aceptas los términos y condiciones del servicio de dispersión de bonos de Tikin
      </p>
    </div>
  )
}
