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

  // Obtener métricas del comercial
  const { count: misCotizaciones } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)

  const { count: cotizacionesPendientes } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)
    .eq('status', 'pending')

  const { count: cotizacionesAceptadas } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)
    .eq('status', 'accepted')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido de vuelta, {profile?.full_name || profile?.email}
        </p>
      </div>

      {/* Métricas Personales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mis Cotizaciones */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Mis Cotizaciones
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {misCotizaciones || 0}
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

        {/* Pendientes */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {cotizacionesPendientes || 0}
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

        {/* Aceptadas */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aceptadas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {cotizacionesAceptadas || 0}
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
            href="/comercial/cotizaciones"
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Ver Mis Cotizaciones</p>
              <p className="text-sm text-gray-600">
                Todas tus cotizaciones creadas
              </p>
            </div>
          </a>

          <a
            href="/bonos"
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Nueva Cotización</p>
              <p className="text-sm text-gray-600">Crear una nueva cotización</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
