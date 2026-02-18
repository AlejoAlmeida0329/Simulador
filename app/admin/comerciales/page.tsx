/**
 * ADMIN: Gestión de Comerciales (Simplificado)
 * Solo muestra: Comerciales Activos e Invitaciones Pendientes
 * Permite eliminación directa sin confirmación
 */

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SimpleComercialesTable } from '@/components/admin/SimpleComercialesTable'
import { SimpleInvitationsTable } from '@/components/admin/SimpleInvitationsTable'
import { Users, Mail, Plus } from 'lucide-react'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'

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
    <div className="space-y-8 max-w-[1800px]">
      {/* Header */}
      <PageHeader title="Comerciales" description="Gestiona comerciales activos e invitaciones">
        <Link
          href="/admin/comerciales/invitar"
          className="bg-tikin-red text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Invitar Comercial
        </Link>
      </PageHeader>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard title="Comerciales Activos" value={totalActivos} icon={Users} iconBgColor="bg-green-50 border-green-200" iconColor="text-green-600" />
        <MetricCard title="Invitaciones Pendientes" value={totalInvitaciones} icon={Mail} iconBgColor="bg-yellow-50 border-yellow-200" iconColor="text-yellow-600" />
      </div>

      {/* Invitaciones Pendientes */}
      {totalInvitaciones > 0 && (
        <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 p-6 hover:shadow-soft-md transition-all">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-tikin-dark-950 tracking-tight">Invitaciones Pendientes</h2>
            <span className="bg-tikin-dark-100 text-tikin-dark-700 px-3 py-1 rounded-full text-sm font-medium">
              {totalInvitaciones}
            </span>
          </div>
          <SimpleInvitationsTable invitations={invitations || []} />
        </div>
      )}

      {/* Comerciales Activos */}
      <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 p-6 hover:shadow-soft-md transition-all">
        <h2 className="text-xl font-semibold text-tikin-dark-950 mb-5 tracking-tight">Comerciales Activos</h2>
        <SimpleComercialesTable comerciales={comerciales || []} />
      </div>
    </div>
  )
}
