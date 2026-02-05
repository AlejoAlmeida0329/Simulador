/**
 * DASHBOARD ADMIN
 *
 * Panel de control del administrador con métricas globales
 */

import { getUserProfile } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Obtener métricas
  const { count: totalCotizaciones } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })

  const { count: totalComerciales } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'comercial')

  const { count: comercialesPendientes } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'comercial')
    .eq('approval_status', 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido de vuelta, {profile?.email}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Cotizaciones */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Cotizaciones
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalCotizaciones || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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

        {/* Total Comerciales */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Comerciales Activos
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalComerciales || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Comerciales Pendientes */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Pendientes de Aprobación
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {comercialesPendientes || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/comerciales"
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-tikin-red hover:bg-red-50 transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-tikin-red to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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
              <p className="text-sm text-gray-600">
                Aprobar, editar o eliminar comerciales
              </p>
            </div>
          </a>

          <a
            href="/admin/cotizaciones"
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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
              <p className="text-sm text-gray-600">
                Todas las cotizaciones del sistema
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
