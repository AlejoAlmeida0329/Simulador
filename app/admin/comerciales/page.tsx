/**
 * ADMIN: Gestión de Comerciales (Simplificado)
 * Solo muestra: Comerciales Activos e Invitaciones Pendientes
 * Permite eliminación directa sin confirmación
 */

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SimpleComercialesTable } from '@/components/admin/SimpleComercialesTable'
import { SimpleInvitationsTable } from '@/components/admin/SimpleInvitationsTable'

export const metadata = {
  title: 'Gestión de Comerciales | Tikin Admin',
  description: 'Administración de comerciales activos e invitaciones',
}

export default async function ComercialesPage() {
  const supabase = await createClient()

  // Obtener solo comerciales activos (aprobados)
  const { data: comerciales } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('role', 'comercial')
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })

  // Obtener invitaciones pendientes
  const { data: invitations } = await supabase
    .from('comercial_invitations')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Contadores
  const totalActivos = comerciales?.length || 0
  const totalInvitaciones = invitations?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comerciales</h1>
          <p className="text-gray-600 mt-1">Gestiona comerciales activos e invitaciones</p>
        </div>
        <Link
          href="/admin/comerciales/invitar"
          className="bg-gradient-to-r from-tikin-red to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invitar Comercial
        </Link>
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Comerciales Activos</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{totalActivos}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Invitaciones Pendientes</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{totalInvitaciones}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Invitaciones Pendientes */}
      {totalInvitaciones > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Invitaciones Pendientes</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {totalInvitaciones}
            </span>
          </div>
          <SimpleInvitationsTable invitations={invitations || []} />
        </div>
      )}

      {/* Comerciales Activos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Comerciales Activos</h2>
        <SimpleComercialesTable comerciales={comerciales || []} />
      </div>
    </div>
  )
}
