/**
 * DASHBOARD COMERCIAL
 *
 * Panel de control personalizado del comercial con sus métricas
 */

import { FileText, CheckCircle, XCircle, Clock, Plus } from 'lucide-react'
import { MetricCard } from '@/components/ui/metric-card'
import { ActionCard } from '@/components/ui/action-card'
import { PageHeader } from '@/components/ui/page-header'
import { getUserProfile } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export default async function ComercialDashboardPage() {
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Métricas de cotizaciones del comercial
  const { count: totalEnviadas } = await supabase
    .from('quotations_bonos2')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)

  const { count: totalAprobadas } = await supabase
    .from('quotations_bonos2')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)
    .eq('status', 'accepted')

  const { count: totalRechazadas } = await supabase
    .from('quotations_bonos2')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)
    .eq('status', 'rejected')

  const { count: totalPendientes } = await supabase
    .from('quotations_bonos2')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)
    .eq('status', 'pending')

  // Obtener datos de cotizaciones aprobadas para calcular totales
  const { data: aprobadas } = await supabase
    .from('quotations_bonos2')
    .select('total_salary, total_bonuses, savings_estimate, tikin_commission')
    .eq('user_id', profile?.id)
    .eq('status', 'accepted')

  // Calcular totales de cotizaciones aprobadas
  const totalNomina = aprobadas?.reduce((sum, q) => sum + (q.total_salary || 0), 0) || 0
  const totalBonos = aprobadas?.reduce((sum, q) => sum + (q.total_bonuses || 0), 0) || 0
  const totalAhorros = aprobadas?.reduce((sum, q) => sum + ((q.savings_estimate as any)?.ahorroMensualEstimado || 0), 0) || 0
  const avgComisionTikin = aprobadas?.length
    ? (aprobadas.reduce((sum, q) => sum + ((q.tikin_commission as any)?.porcentajeFee || 0), 0) / aprobadas.length) * 100
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
      <PageHeader
        title="Mi Dashboard"
        description={`Bienvenido de vuelta, ${profile?.full_name || profile?.email}`}
      />

      {/* Métricas de Cotizaciones */}
      <div>
        <h2 className="text-xl font-semibold text-tikin-dark-950 mb-5 tracking-tight">Resumen de Mis Cotizaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Enviadas" value={totalEnviadas || 0} icon={FileText} />
          <MetricCard title="Aprobadas" value={totalAprobadas || 0} icon={CheckCircle} iconBgColor="bg-green-50 border-green-200" iconColor="text-green-600" />
          <MetricCard title="Rechazadas" value={totalRechazadas || 0} icon={XCircle} iconBgColor="bg-tikin-red-50 border-tikin-red-200" iconColor="text-tikin-red" />
          <MetricCard title="Pendientes" value={totalPendientes || 0} icon={Clock} iconBgColor="bg-yellow-50 border-yellow-200" iconColor="text-yellow-600" />
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
          <ActionCard
            title="Nueva Cotización"
            description="Crear una nueva cotización"
            href="/bonos"
            icon={Plus}
            variant="primary"
          />
          <ActionCard
            title="Ver Mis Cotizaciones"
            description="Todas tus cotizaciones creadas"
            href="/comercial/cotizaciones"
            icon={FileText}
            variant="default"
          />
        </div>
      </div>
    </div>
  )
}
