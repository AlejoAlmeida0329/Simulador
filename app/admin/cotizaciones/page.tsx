/**
 * ADMIN: Resumen de Cotizaciones
 * Tabla resumen simple de todas las cotizaciones
 */

import { createClient } from '@/lib/supabase/server'
import type { QuotationRecord } from '@/types/quotation'

export const metadata = {
  title: 'Cotizaciones | Tikin Admin',
  description: 'Resumen de todas las cotizaciones',
}

export default async function AdminCotizacionesPage() {
  const supabase = await createClient()

  // Obtener todas las cotizaciones
  const { data: quotations } = await supabase
    .from('quotations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100) // Limitar a las últimas 100 para rendimiento

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status?: string) => {
    const currentStatus = status || 'pending'

    const statusConfig = {
      pending: { label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-800' },
      accepted: { label: 'Aprobada', bg: 'bg-green-100', text: 'text-green-800' },
      rejected: { label: 'Rechazada', bg: 'bg-red-100', text: 'text-red-800' },
    }

    const config = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.pending

    return (
      <span className={`${config.bg} ${config.text} px-2 py-1 rounded-full text-xs font-medium`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cotizaciones</h1>
        <p className="text-gray-600 mt-1">Resumen de todas las cotizaciones ({quotations?.length || 0})</p>
      </div>

      {/* Tabla de Cotizaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {!quotations || quotations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay cotizaciones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleados
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nómina
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bonos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ahorro Anual
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(quotation.created_at || '')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{quotation.company_name}</div>
                      {quotation.nit && <div className="text-xs text-gray-500">NIT: {quotation.nit}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{quotation.contact_name}</div>
                      <div className="text-xs text-gray-500">{quotation.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                      {quotation.employee_count}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(quotation.total_payroll)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-blue-600 font-medium">
                      {formatCurrency(quotation.monthly_bonus_total)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-green-600 font-medium">
                      {formatCurrency(quotation.annual_savings)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {getStatusBadge(quotation.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información adicional */}
      {quotations && quotations.length >= 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📊 Mostrando las últimas 100 cotizaciones. Para ver más, considera implementar paginación.
          </p>
        </div>
      )}
    </div>
  )
}
