/**
 * DASHBOARD COMERCIAL
 *
 * Panel de control personalizado del comercial con sus métricas
 */

import { getUserProfile } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export default async function ComercialDashboardPage() {
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Métricas de cotizaciones del comercial
  const { count: totalEnviadas } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)

  const { count: totalAprobadas } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)
    .eq('status', 'accepted')

  const { count: totalRechazadas } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)
    .eq('status', 'rejected')

  const { count: totalPendientes } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)
    .or('status.is.null,status.eq.pending')

  // Obtener datos de cotizaciones aprobadas para calcular totales
  const { data: aprobadas } = await supabase
    .from('quotations')
    .select('total_payroll, monthly_bonus_total, monthly_savings, commission_percentage')
    .eq('user_id', profile?.id)
    .eq('status', 'accepted')

  // Calcular totales de cotizaciones aprobadas
  const totalNomina = aprobadas?.reduce((sum, q) => sum + (q.total_payroll || 0), 0) || 0
  const totalBonos = aprobadas?.reduce((sum, q) => sum + (q.monthly_bonus_total || 0), 0) || 0
  const totalAhorros = aprobadas?.reduce((sum, q) => sum + (q.monthly_savings || 0), 0) || 0
  // commission_percentage está almacenado como decimal (0.04), multiplicar por 100 para obtener porcentaje (4%)
  const avgComisionTikin = aprobadas?.length
    ? (aprobadas.reduce((sum, q) => sum + (q.commission_percentage || 0), 0) / aprobadas.length) * 100
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
    <div className="space-y-8 max-w-[1800px]">
      {/* Header */}
      <div className="border-b border-tikin-dark-200 pb-6">
        <h1 className="text-3xl font-bold text-tikin-dark-950 tracking-tight">Mi Dashboard</h1>
        <p className="text-tikin-dark-600 mt-2">
          Bienvenido de vuelta, {profile?.full_name || profile?.email}
        </p>
      </div>

      {/* Métricas de Cotizaciones */}
      <div>
        <h2 className="text-xl font-semibold text-tikin-dark-950 mb-5 tracking-tight">Resumen de Mis Cotizaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Enviadas */}
          <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 p-6 hover:shadow-soft-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-tikin-dark-600">Total Enviadas</p>
                <p className="text-3xl font-bold text-tikin-dark-950 mt-2">{totalEnviadas || 0}</p>
              </div>
              <div className="w-12 h-12 bg-tikin-dark-100 border border-tikin-dark-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-tikin-dark-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 p-6 hover:shadow-soft-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-tikin-dark-600">Aprobadas</p>
                <p className="text-3xl font-bold text-tikin-dark-950 mt-2">{totalAprobadas || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 p-6 hover:shadow-soft-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-tikin-dark-600">Rechazadas</p>
                <p className="text-3xl font-bold text-tikin-dark-950 mt-2">{totalRechazadas || 0}</p>
              </div>
              <div className="w-12 h-12 bg-tikin-red-50 border border-tikin-red-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-tikin-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 p-6 hover:shadow-soft-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-tikin-dark-600">Pendientes</p>
                <p className="text-3xl font-bold text-tikin-dark-950 mt-2">{totalPendientes || 0}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <h2 className="text-xl font-semibold text-tikin-dark-950 mb-5 tracking-tight">
          Totales de Cotizaciones Aprobadas ({totalAprobadas || 0})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Nómina */}
          <div className="bg-white rounded-lg border border-tikin-dark-200 p-6 shadow-soft hover:shadow-soft-md transition-all">
            <p className="text-sm font-medium text-tikin-dark-600 mb-2">Total Nómina</p>
            <p className="text-2xl font-bold text-tikin-dark-950">{formatCurrency(totalNomina)}</p>
          </div>

          {/* Total Bonos */}
          <div className="bg-white rounded-lg border border-tikin-dark-200 p-6 shadow-soft hover:shadow-soft-md transition-all">
            <p className="text-sm font-medium text-tikin-dark-600 mb-2">Total Bonos</p>
            <p className="text-2xl font-bold text-tikin-dark-950">{formatCurrency(totalBonos)}</p>
          </div>

          {/* Total Ahorros */}
          <div className="bg-white rounded-lg border border-tikin-dark-200 p-6 shadow-soft hover:shadow-soft-md transition-all">
            <p className="text-sm font-medium text-tikin-dark-600 mb-2">Total Ahorros</p>
            <p className="text-2xl font-bold text-tikin-dark-950">{formatCurrency(totalAhorros)}</p>
          </div>

          {/* % Comisión Tikin Promedio */}
          <div className="bg-tikin-red-50 rounded-lg border border-tikin-red-200 p-6 shadow-soft hover:shadow-soft-md transition-all">
            <p className="text-sm font-medium text-tikin-red-700 mb-2">% Comisión Tikin</p>
            <p className="text-2xl font-bold text-tikin-red">{avgComisionTikin.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 p-6">
        <h2 className="text-xl font-semibold text-tikin-dark-950 mb-5 tracking-tight">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/bonos"
            className="flex items-center gap-4 p-5 rounded-lg border border-tikin-dark-200 hover:border-tikin-red hover:bg-tikin-red-50 transition-all duration-200 group"
          >
            <div className="w-11 h-11 bg-tikin-red-50 border border-tikin-red-200 rounded-lg flex items-center justify-center group-hover:bg-tikin-red group-hover:border-tikin-red transition-all">
              <svg className="w-5 h-5 text-tikin-red group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-tikin-dark-950 group-hover:text-tikin-red transition-colors">Nueva Cotización</p>
              <p className="text-sm text-tikin-dark-600">Crear una nueva cotización</p>
            </div>
          </a>

          <a
            href="/comercial/cotizaciones"
            className="flex items-center gap-4 p-5 rounded-lg border border-tikin-dark-200 hover:border-tikin-dark-400 hover:bg-tikin-dark-50 transition-all duration-200 group"
          >
            <div className="w-11 h-11 bg-tikin-dark-100 border border-tikin-dark-200 rounded-lg flex items-center justify-center group-hover:bg-tikin-dark-900 group-hover:border-tikin-dark-700 transition-all">
              <svg className="w-5 h-5 text-tikin-dark-700 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-tikin-dark-950 group-hover:text-tikin-dark-950 transition-colors">Ver Mis Cotizaciones</p>
              <p className="text-sm text-tikin-dark-600">Todas tus cotizaciones creadas</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
