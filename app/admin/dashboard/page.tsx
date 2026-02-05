/**
 * DASHBOARD ADMIN
 *
 * Métricas principales de cotizaciones:
 * - Total enviadas, aprobadas, rechazadas
 * - De las aprobadas: Total nómina, bonos, ahorros, % comisión Tikin
 */

import { getUserProfile } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Métricas de cotizaciones
  const { count: totalEnviadas } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })

  const { count: totalAprobadas } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted')

  const { count: totalRechazadas } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected')

  const { count: totalPendientes } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .or('status.is.null,status.eq.pending')

  // Obtener datos de cotizaciones aprobadas para calcular totales
  const { data: aprobadas } = await supabase
    .from('quotations')
    .select('total_payroll, monthly_bonus_total, annual_savings, commission_percentage')
    .eq('status', 'accepted')

  // Calcular totales de cotizaciones aprobadas
  const totalNomina = aprobadas?.reduce((sum, q) => sum + (q.total_payroll || 0), 0) || 0
  const totalBonos = aprobadas?.reduce((sum, q) => sum + (q.monthly_bonus_total || 0), 0) || 0
  const totalAhorros = aprobadas?.reduce((sum, q) => sum + (q.annual_savings || 0), 0) || 0
  const avgComisionTikin = aprobadas?.length
    ? aprobadas.reduce((sum, q) => sum + (q.commission_percentage || 0), 0) / aprobadas.length
    : 0

  // Formateo de moneda
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenido de vuelta, {profile?.email}</p>
      </div>

      {/* Métricas de Cotizaciones */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen de Cotizaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Enviadas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enviadas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalEnviadas || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Aprobadas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{totalAprobadas || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Rechazadas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{totalRechazadas || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Pendientes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{totalPendientes || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Totales de Cotizaciones Aprobadas */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Totales de Cotizaciones Aprobadas ({totalAprobadas || 0})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Nómina */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 p-6">
            <p className="text-sm font-medium text-purple-700 mb-2">Total Nómina</p>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalNomina)}</p>
          </div>

          {/* Total Bonos */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 p-6">
            <p className="text-sm font-medium text-blue-700 mb-2">Total Bonos</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalBonos)}</p>
          </div>

          {/* Total Ahorros */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 p-6">
            <p className="text-sm font-medium text-green-700 mb-2">Total Ahorros</p>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(totalAhorros)}</p>
          </div>

          {/* % Comisión Tikin Promedio */}
          <div className="bg-gradient-to-br from-tikin-red/10 to-red-100 rounded-xl border-2 border-red-200 p-6">
            <p className="text-sm font-medium text-red-700 mb-2">% Comisión Tikin</p>
            <p className="text-2xl font-bold text-red-900">{avgComisionTikin.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/comerciales"
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-tikin-red hover:bg-red-50 transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-tikin-red to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Gestionar Comerciales</p>
              <p className="text-sm text-gray-600">Ver y administrar comerciales e invitaciones</p>
            </div>
          </a>

          <a
            href="/admin/cotizaciones"
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Ver Cotizaciones</p>
              <p className="text-sm text-gray-600">Todas las cotizaciones del sistema</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
